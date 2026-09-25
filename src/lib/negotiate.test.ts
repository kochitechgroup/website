import { expect, test } from 'bun:test';
import { prefersMarkdown } from './negotiate';

test.each([
	['text/markdown', true],
	['text/markdown, text/html;q=0.9', true],
	['text/html;q=0.5, text/markdown', true],
	['text/markdown, text/html', true],
	['text/html, text/markdown', false],
	['text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', false],
	['*/*', false],
	['text/markdown;q=0', false],
	['', false],
])('Accept %p -> %p', (accept, expected) => {
	expect(prefersMarkdown(accept)).toBe(expected);
});

test('null header', () => {
	expect(prefersMarkdown(null)).toBe(false);
});
