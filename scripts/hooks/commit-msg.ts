// Enforces Conventional Commits (https://www.conventionalcommits.org/en/v1.0.0/).
//
//   bun scripts/hooks/commit-msg.ts <message-file>    commit-msg hook
//   bun scripts/hooks/commit-msg.ts --range <a>..<b>  CI: every commit in a range

export const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const MAX_HEADER = 72;

// Commits git writes itself; they are exempt.
const GENERATED = /^(Merge (branch|pull request|remote-tracking branch) |Revert "|fixup! |squash! |amend! )/;

export function problems(message: string): string[] {
	const lines = message.split('\n').filter((l) => !l.startsWith('#'));
	while (lines.length && lines[0].trim() === '') lines.shift();
	const header = lines[0]?.trimEnd() ?? '';
	if (GENERATED.test(header)) return [];

	const m = /^(?<type>[a-z]+)(?:\((?<scope>[^()\s]+)\))?(?<bang>!)?: (?<subject>.+)$/.exec(header);
	if (!m) {
		return [`the header "${header}" is not in the form  type(optional-scope)!: subject`];
	}
	const { type, subject } = m.groups!;
	const out: string[] = [];
	if (!TYPES.includes(type)) out.push(`"${type}" is not one of the allowed types: ${TYPES.join(', ')}`);
	if (header.length > MAX_HEADER) out.push(`the header is ${header.length} characters; keep it to ${MAX_HEADER} or fewer`);
	if (/[.]$/.test(subject)) out.push('the subject ends with a period; drop it');
	if (/^[A-Z][a-z]/.test(subject)) out.push('the subject starts with a capital letter; write it in lower case, imperative mood ("add", not "Added")');
	if (lines.length > 1 && lines[1].trim() !== '') out.push('the second line must be blank, separating the header from the body');
	return out;
}

function explain(header: string, issues: string[]): string {
	return [
		`Commit message check: "${header}"`,
		...issues.map((i) => `  - ${i}`),
		'',
		'This repo uses Conventional Commits:  type(scope): subject',
		`  types: ${TYPES.join(', ')}`,
		'  examples:',
		'    feat: add events page',
		'    fix(nav): keep the menu open on tap',
		'    docs: explain the check-ignore escape hatch',
		'    feat!: move the site to a new URL scheme   (! marks a breaking change)',
		'Rewrite the message and commit again.',
	].join('\n');
}

if (import.meta.main) {
	const args = Bun.argv.slice(2);
	let failed = false;
	if (args[0] === '--range') {
		const proc = Bun.spawn(['git', 'log', '--format=%H%x00%B%x01', args[1]], { stdout: 'pipe' });
		const out = await new Response(proc.stdout).text();
		for (const entry of out.split('\x01').map((e) => e.trim()).filter(Boolean)) {
			const [sha, body] = entry.split('\0');
			const issues = problems(body);
			if (issues.length) {
				failed = true;
				console.error(`${sha.slice(0, 8)} ${explain(body.split('\n')[0], issues)}\n`);
			}
		}
	} else {
		const message = await Bun.file(args[0]).text();
		const issues = problems(message);
		if (issues.length) {
			failed = true;
			console.error(explain(message.split('\n').find((l) => l.trim() && !l.startsWith('#')) ?? '', issues));
		}
	}
	process.exit(failed ? 1 : 0);
}
