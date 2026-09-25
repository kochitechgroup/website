// Runs the constraint rules in rules.ts and prints feedback.
//
//   bun scripts/checks/run.ts --staged        pre-commit: checks the staged content
//   bun scripts/checks/run.ts --all           CI: checks every tracked file
//   bun scripts/checks/run.ts <file>...       checks files on disk
//   bun scripts/checks/run.ts --claude-hook   Claude Code PostToolUse: reads the hook
//                                             payload on stdin, exits 2 so the feedback
//                                             goes back to the model

import { relative, resolve } from 'node:path';
import { evaluate, type Violation } from './rules';

const root = (await $git('rev-parse', '--show-toplevel')).trim();

async function $git(...args: string[]): Promise<string> {
	const proc = Bun.spawn(['git', ...args], { stdout: 'pipe', stderr: 'pipe' });
	const out = await new Response(proc.stdout).text();
	if ((await proc.exited) !== 0) throw new Error(`git ${args.join(' ')} failed`);
	return out;
}

const skip = (p: string) =>
	/^(node_modules|dist|\.astro)\//.test(p) || p === 'bun.lock' || !/\.[\w]+$/.test(p) && !p.startsWith('.githooks/');

async function readStaged(): Promise<[string, string][]> {
	const names = (await $git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')).split('\0').filter(Boolean);
	return Promise.all(names.filter((p) => !skip(p)).map(async (p) => [p, await $git('show', `:${p}`)] as [string, string]));
}

async function readDisk(paths: string[]): Promise<[string, string][]> {
	const out: [string, string][] = [];
	for (const p of paths) {
		const rel = relative(root, resolve(p)).replaceAll('\\', '/');
		if (rel.startsWith('..') || skip(rel)) continue;
		const file = Bun.file(resolve(root, rel));
		if (await file.exists()) out.push([rel, await file.text()]);
	}
	return out;
}

function report(violations: Violation[]): string {
	const n = violations.length;
	const lines = [
		`Constraint check: ${n} ${n === 1 ? 'thing' : 'things'} to fix.`,
		'These rules can only be checked after the text exists, so this is the normal place to catch them.',
		'',
	];
	const byRule = Map.groupBy(violations, (v) => v.rule.id);
	for (const [id, vs] of byRule) {
		const rule = vs[0].rule;
		lines.push(`[${id}] ${rule.title}`);
		for (const v of vs) lines.push(`  ${v.file}:${v.line}  found: ${v.found}`);
		lines.push(`  why: ${rule.why}`, `  fix: ${rule.fix}`, '');
	}
	lines.push(
		'Fix these, then try again.',
		'If a rule is wrong for this case, add `check-ignore: <rule-id> -- <reason>` on that line or the line above,',
		'or change the rule in scripts/checks/rules.ts. Both show up in review, so the reason should be one a reviewer would accept.',
	);
	return lines.join('\n');
}

const args = Bun.argv.slice(2);
let files: [string, string][];

if (args[0] === '--claude-hook') {
	const payload = await new Response(Bun.stdin.stream()).json().catch(() => ({}));
	const path = payload?.tool_input?.file_path;
	files = path ? await readDisk([path]) : [];
} else if (args[0] === '--staged') {
	files = await readStaged();
} else if (args[0] === '--all') {
	const tracked = (await $git('ls-files', '-z')).split('\0').filter(Boolean);
	files = await readDisk(tracked.map((p) => resolve(root, p)));
} else {
	files = await readDisk(args);
}

const violations = files.flatMap(([p, text]) => evaluate(p, text));
if (violations.length === 0) process.exit(0);

console.error(report(violations));
process.exit(args[0] === '--claude-hook' ? 2 : 1);
