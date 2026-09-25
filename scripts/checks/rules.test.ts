import { describe, expect, test } from 'bun:test';
import { evaluate } from './rules';

const ids = (path: string, text: string) => evaluate(path, text).map((v) => v.rule.id);

const page = (body: string, style = '') => `---
---
<html><head><title>T</title><meta name="description" content="d" /></head>
<body>${body}</body></html>
<style>${style}</style>`;

describe('tokens-only-colors', () => {
	test('allows color literals inside :root, light and dark', () => {
		const css = `:root { --bg: #fff; } @media (prefers-color-scheme: dark) { :root { --bg: #000; } } body { background: var(--bg); }`;
		expect(ids('src/pages/a.astro', page('', css))).toEqual([]);
	});
	test('flags a hex color outside :root', () => {
		const v = evaluate('src/pages/a.astro', page('', ':root{--a:#fff} @media (prefers-color-scheme: dark){:root{--a:#000}} p { color: #333; }'));
		expect(v.map((x) => [x.rule.id, x.found])).toEqual([['tokens-only-colors', '#333']]);
	});
	test('flags rgb() in a style attribute', () => {
		expect(ids('src/pages/a.astro', page('<p style="color: rgb(0,0,0)">x</p>'))).toContain('tokens-only-colors');
	});
	test('ignores hex-looking anchors in markup', () => {
		expect(ids('src/pages/a.astro', page('<a href="#add">x</a>'))).toEqual([]);
	});
});

describe('dark-mode-parity', () => {
	test('flags a light token with no dark value', () => {
		const css = `:root { --bg: #fff; --fg: #111; } @media (prefers-color-scheme: dark) { :root { --bg: #000; } }`;
		const v = evaluate('src/styles/a.css', css);
		expect(v.map((x) => [x.rule.id, x.found])).toEqual([['dark-mode-parity', '--fg']]);
	});
	test('ignores non-color tokens', () => {
		expect(ids('src/styles/a.css', `:root { --gap: 1rem; }`)).toEqual([]);
	});
	test('accepts [data-theme=dark] as a dark block', () => {
		expect(ids('src/styles/a.css', `:root { --bg: #fff; } :root[data-theme="dark"] { --bg: #000; }`)).toEqual([]);
	});
});

describe('no-third-party-scripts', () => {
	test('flags an external script', () => {
		expect(ids('src/pages/a.astro', page('<script src="https://cdn.example.com/x.js"></script>'))).toContain('no-third-party-scripts');
	});
	test('allows Google Fonts stylesheets', () => {
		expect(ids('src/pages/a.astro', page('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />'))).toEqual([]);
	});
	test('flags other external stylesheets', () => {
		expect(ids('src/pages/a.astro', page('<link rel="stylesheet" href="https://cdn.example.com/x.css" />'))).toContain('no-third-party-scripts');
	});
});

describe('page-metadata', () => {
	test('flags a page with neither title nor description', () => {
		expect(ids('src/pages/a.astro', '<html><body>x</body></html>')).toEqual(['page-metadata', 'page-metadata']);
	});
	test('trusts pages rendered through a layout', () => {
		expect(ids('src/pages/a.astro', `---\nimport Base from '../layouts/Base.astro';\n---\n<Base>x</Base>`)).toEqual([]);
	});
	test('does not apply outside src/pages', () => {
		expect(ids('src/components/a.astro', '<p>x</p>')).toEqual([]);
	});
});

test('img-alt ignores docs that mention the component', () => {
	expect(ids('AGENTS.md', 'render through `<Image>`')).toEqual([]);
});

test('img-alt flags an image without alt', () => {
	expect(ids('src/pages/a.astro', page('<img src="/a.png" />'))).toContain('img-alt');
	expect(ids('src/pages/a.astro', page('<img src="/a.png" alt="" />'))).toEqual([]);
});

describe('bun-only', () => {
	test('flags other package managers in docs', () => {
		expect(ids('README.md', 'Run npm install then npx astro dev')).toEqual(['bun-only', 'bun-only']);
	});
	test('flags running a script with node', () => {
		expect(ids('README.md', 'node ./build.mjs')).toEqual(['bun-only']);
	});
	test('allows bun commands and the word node_modules', () => {
		expect(ids('README.md', 'bun install, bunx astro, rm -rf node_modules')).toEqual([]);
	});
	test('checks git hooks, which have no extension', () => {
		expect(ids('.githooks/pre-commit', 'npm run build')).toEqual(['bun-only']);
	});
});

describe('claims-match-reality', () => {
	test('flags legal-status and endorsement claims in site copy', () => {
		expect(ids('src/pages/a.astro', page('A registered non-profit, sponsored by Acme.'))).toEqual(['claims-match-reality', 'claims-match-reality']);
	});
	test('does not apply outside src', () => {
		expect(ids('README.md', 'Section 8')).toEqual([]);
	});
});

test('plain-words flags filler in copy', () => {
	expect(ids('src/pages/a.astro', page('A vibrant community leveraging cutting-edge tech.'))).toEqual(['plain-words', 'plain-words', 'plain-words']);
});

describe('check-ignore', () => {
	test('silences a rule when a reason is given', () => {
		expect(ids('README.md', '<!-- check-ignore: bun-only -- quoting an upstream doc -->\nnpm install')).toEqual([]);
	});
	test('does not count without a reason', () => {
		expect(ids('README.md', '<!-- check-ignore: bun-only -->\nnpm install')).toEqual(['bun-only']);
	});
});
