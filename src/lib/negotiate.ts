// Content negotiation for the Markdown twin of a page.
// True when the Accept header ranks text/markdown above text/html
// (by q-value; on a tie, whichever is listed first wins).

type Entry = { type: string; q: number; order: number };

function parse(accept: string): Entry[] {
	return accept
		.split(',')
		.map((part, order) => {
			const [type, ...params] = part.trim().toLowerCase().split(';');
			const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
			const value = q ? Number.parseFloat(q.slice(2)) : 1;
			return { type: type.trim(), q: Number.isFinite(value) ? value : 0, order };
		})
		.filter((e) => e.type);
}

export function prefersMarkdown(accept: string | null): boolean {
	if (!accept) return false;
	const entries = parse(accept);
	const md = entries.find((e) => e.type === 'text/markdown');
	if (!md || md.q <= 0) return false;
	const html = entries.find((e) => e.type === 'text/html');
	if (!html || html.q <= 0) return true;
	return md.q > html.q || (md.q === html.q && md.order < html.order);
}
