import { expect, test } from 'bun:test';
import { problems } from './commit-msg';

test.each([
	'feat: add events page',
	'fix(nav): keep the menu open on tap',
	'feat!: move to a new URL scheme',
	'docs: explain hooks\n\nLonger body here.\n\nCo-Authored-By: Someone <a@b.c>',
	'# comment from git\nchore: bump astro',
	'Merge branch \'main\' into feature',
	'fixup! feat: add events page',
])('accepts %p', (msg) => {
	expect(problems(msg)).toEqual([]);
});

test.each([
	['Add events page', 'not in the form'],
	['feature: add events page', 'not one of the allowed types'],
	['feat: add events page.', 'ends with a period'],
	['feat: Added events page', 'lower case'],
	['feat: add events page\nno blank line', 'second line must be blank'],
	[`feat: ${'x'.repeat(80)}`, 'characters'],
	['feat:add events page', 'not in the form'],
])('rejects %p', (msg, expected) => {
	expect(problems(msg).join(' ')).toContain(expected);
});
