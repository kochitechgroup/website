// Constraint rules that can only be evaluated after text is written.
// Each rule is run by scripts/checks/run.ts from the pre-commit hook, CI,
// and the Claude Code PostToolUse hook. The `why` and `fix` fields are the
// feedback the author (human or LLM) sees, so write them as instructions.

export type Hit = { line: number; found: string };

export type Rule = {
	id: string;
	title: string;
	why: string;
	fix: string;
	applies: (path: string) => boolean;
	check: (text: string, path: string) => Hit[];
};

const ext = (...exts: string[]) => (path: string) => exts.some((e) => path.endsWith(e));
const under = (dir: string, inner: (p: string) => boolean) => (path: string) =>
	path.startsWith(dir) && inner(path);

export function lineOf(text: string, index: number): number {
	let line = 1;
	for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') line++;
	return line;
}

type Range = { start: number; end: number };

// Returns the range from `openIndex` (a `{`) to its matching `}`.
function braceRange(text: string, openIndex: number): Range {
	let depth = 0;
	for (let i = openIndex; i < text.length; i++) {
		if (text[i] === '{') depth++;
		else if (text[i] === '}' && --depth === 0) return { start: openIndex, end: i };
	}
	return { start: openIndex, end: text.length };
}

function blocks(text: string, selector: RegExp): (Range & { head: string; at: number })[] {
	const out: (Range & { head: string; at: number })[] = [];
	for (const m of text.matchAll(selector)) {
		const open = m.index! + m[0].length - 1;
		out.push({ ...braceRange(text, open), head: m[0], at: m.index! });
	}
	return out;
}

const inside = (i: number, ranges: Range[]) => ranges.some((r) => i >= r.start && i <= r.end);

// CSS regions of a file: whole file for .css; <style> bodies and style="" for .astro.
function styleRanges(text: string, path: string): Range[] {
	if (path.endsWith('.css')) return [{ start: 0, end: text.length }];
	const out: Range[] = [];
	for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))
		out.push({ start: m.index!, end: m.index! + m[0].length });
	for (const m of text.matchAll(/\bstyle="[^"]*"/g))
		out.push({ start: m.index!, end: m.index! + m[0].length });
	return out;
}

const COLOR = /(?<![\w&-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g;
const ROOT = /:root\b[^{};]*\{/g;
const DARK_MEDIA = /@media[^{]*prefers-color-scheme:\s*dark[^{]*\{/g;

const styled = ext('.astro', '.css');
const site = (p: string) => p.startsWith('src/') && ext('.astro', '.md', '.mdx', '.html')(p);
const prose = (p: string) => site(p) || p === 'README.md';

export const rules: Rule[] = [
	{
		id: 'tokens-only-colors',
		title: 'Colors come from tokens',
		why: 'Dark mode works by redefining tokens under :root. A color literal outside :root stays the same in both themes.',
		fix: 'Define a token under :root (with a dark counterpart) and use var(--name) here.',
		applies: styled,
		check(text, path) {
			const styles = styleRanges(text, path);
			const roots = blocks(text, ROOT);
			const hits: Hit[] = [];
			for (const m of text.matchAll(COLOR)) {
				if (inside(m.index!, styles) && !inside(m.index!, roots))
					hits.push({ line: lineOf(text, m.index!), found: m[0] });
			}
			return hits;
		},
	},
	{
		id: 'dark-mode-parity',
		title: 'Every light color token has a dark value',
		why: 'A token left out of the dark block keeps its light value on a dark background, which is usually unreadable.',
		fix: 'Redefine the token inside the @media (prefers-color-scheme: dark) :root block.',
		applies: styled,
		check(text) {
			const dark = blocks(text, DARK_MEDIA);
			const light = new Map<string, number>();
			const darkTokens = new Set<string>();
			for (const root of blocks(text, ROOT)) {
				const isDark = inside(root.at, dark) || /dark/.test(root.head);
				const body = text.slice(root.start, root.end);
				for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
					if (!new RegExp(COLOR.source).test(m[2])) continue;
					if (isDark) darkTokens.add(m[1]);
					else if (!light.has(m[1])) light.set(m[1], lineOf(text, root.start + m.index!));
				}
			}
			return [...light].filter(([t]) => !darkTokens.has(t)).map(([t, line]) => ({ line, found: t }));
		},
	},
	{
		id: 'no-third-party-scripts',
		title: 'No third-party scripts or stylesheets',
		why: 'The site loads nothing from other origins: no trackers, no CDNs, no surprise dependencies. Google Fonts is the one stylesheet exception.',
		fix: 'Install the dependency with bun and import it, or drop it.',
		applies: ext('.astro', '.html', '.md', '.mdx'),
		check(text) {
			const hits: Hit[] = [];
			for (const m of text.matchAll(/<script\b[^>]*\bsrc="(https?:)?\/\/[^"]+"/g))
				hits.push({ line: lineOf(text, m.index!), found: m[0] });
			for (const m of text.matchAll(/<link\b[^>]*>/g)) {
				const tag = m[0];
				if (!/rel="(stylesheet|preload|modulepreload)"/.test(tag)) continue;
				const href = /href="((?:https?:)?\/\/[^"/]+)/.exec(tag)?.[1];
				if (href && !/\/\/fonts\.(googleapis|gstatic)\.com$/.test(href))
					hits.push({ line: lineOf(text, m.index!), found: tag });
			}
			return hits;
		},
	},
	{
		id: 'page-metadata',
		title: 'Pages have a title and description',
		why: 'The title and meta description are what search results and link previews show. A page without them shows as a bare URL.',
		fix: 'Add <title> and <meta name="description" content="..."> to the page, or render it through a layout in src/layouts that takes both.',
		applies: under('src/pages/', ext('.astro')),
		check(text) {
			if (/from\s+['"][^'"]*layouts\//.test(text)) return [];
			const hits: Hit[] = [];
			if (!/<title>/.test(text)) hits.push({ line: 1, found: 'missing <title>' });
			if (!/<meta\s+name="description"/.test(text)) hits.push({ line: 1, found: 'missing meta description' });
			return hits;
		},
	},
	{
		id: 'img-alt',
		title: 'Images have alt text',
		why: 'Screen readers read alt text aloud. Without it they read the file name.',
		fix: 'Add alt="what the image shows". Use alt="" only for purely decorative images.',
		// Site files only: docs mention <Image> in prose and code spans.
		applies: site,
		check(text) {
			return [...text.matchAll(/<(img|Image)\b(?![^>]*\balt=)[^>]*>/g)].map((m) => ({
				line: lineOf(text, m.index!),
				found: m[0].slice(0, 60),
			}));
		},
	},
	{
		id: 'bun-only',
		title: 'Bun is the only runtime and package manager',
		why: 'The repo has one lockfile (bun.lock) and one toolchain. Commands for other package managers leave stale lockfiles and tell contributors to use the wrong tool.',
		fix: 'Use `bun install`, `bun run <script>`, `bun add`, `bunx <tool>`, or `bun <file>`.',
		applies: (p) =>
			p.startsWith('.githooks/') ||
			(!p.startsWith('scripts/checks/') &&
				ext('.md', '.mdx', '.astro', '.ts', '.js', '.mjs', '.json', '.yml', '.yaml', '.sh')(p)),
		check(text) {
			const re = /\b(?:npm\s+(?:install|i|ci|run|exec|test)\b|npx\s+\S|pnpm\s+\S|yarn\s+\S|node\s+(?:\.\/|\S+\.m?[jt]s\b))/g;
			return [...text.matchAll(re)].map((m) => ({ line: lineOf(text, m.index!), found: m[0] }));
		},
	},
	{
		id: 'claims-match-reality',
		title: 'Copy claims only what is true',
		why: 'The group is not registered and has no partners or sponsors yet. Legal-status and endorsement claims on the site are public statements, so they have to be true.',
		fix: 'Remove the claim. When it becomes true, update this rule in scripts/checks/rules.ts in the same commit that adds the claim.',
		applies: site,
		check(text) {
			const re = /\b(?:registered\s+(?:non-?profit|not-for-profit|charity|society|trust|company)|section\s*8|\bNGO\b|charit(?:y|able)|80G|12A\b|tax[- ]deductible|partner(?:ed|ing)?\s+with|sponsored\s+by|backed\s+by|in\s+association\s+with|endorsed\s+by)/gi;
			return [...text.matchAll(re)].map((m) => ({ line: lineOf(text, m.index!), found: m[0] }));
		},
	},
	{
		id: 'plain-words',
		title: 'Plain words, no marketing filler',
		why: 'The readers are engineers. Filler words tell them nobody specific wrote this, and they stop reading.',
		fix: 'Say the concrete thing: what happens, who it is for, when. If there is nothing concrete to say, cut the sentence.',
		applies: prose,
		check(text) {
			const re = /\b(?:cutting[- ]edge|state[- ]of[- ]the[- ]art|world[- ]class|revolutioni[sz]\w*|game[- ]chang\w*|next[- ]gen(?:eration)?|synerg\w*|seamless(?:ly)?|empower\w*|unlock(?:s|ing)?\s+(?:the|your)|leverag(?:e|es|ing)\b|innovative|vibrant|thriving|passionate|delve|tapestry|harness(?:es|ing)?\s+the\s+power|in\s+today'?s\s+(?:fast-paced|digital)|embark\w*|elevate\w*)/gi;
			return [...text.matchAll(re)].map((m) => ({ line: lineOf(text, m.index!), found: m[0] }));
		},
	},
];

// `check-ignore: <rule-id> -- <reason>` on the same or previous line silences one rule.
// The reason is mandatory; an ignore without one does not count.
export function ignored(text: string, line: number, id: string): boolean {
	const lines = text.split('\n');
	// `--\s+` so that the `-->` closing an HTML comment is not read as a reason.
	const re = new RegExp(`check-ignore:\\s*${id}\\s+--\\s+[^\\s>-]`);
	return [lines[line - 1], lines[line - 2]].some((l) => l !== undefined && re.test(l));
}

export type Violation = Hit & { rule: Rule; file: string };

export function evaluate(path: string, text: string): Violation[] {
	const out: Violation[] = [];
	for (const rule of rules) {
		if (!rule.applies(path)) continue;
		for (const hit of rule.check(text, path))
			if (!ignored(text, hit.line, rule.id)) out.push({ ...hit, rule, file: path });
	}
	return out;
}
