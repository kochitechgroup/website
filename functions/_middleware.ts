// Cloudflare Pages Function. public/_routes.json limits it to "/", so static
// assets are served without invoking it.
// A client that prefers text/markdown gets the page's Markdown twin.
import { prefersMarkdown } from '../src/lib/negotiate';

type Env = { ASSETS: { fetch: (input: Request | URL | string) => Promise<Response> } };

export const onRequest = async (ctx: {
	request: Request;
	env: Env;
	next: () => Promise<Response>;
}): Promise<Response> => {
	const url = new URL(ctx.request.url);
	if (url.pathname === '/' && prefersMarkdown(ctx.request.headers.get('Accept'))) {
		const md = await ctx.env.ASSETS.fetch(new URL('/index.html.md', url));
		if (md.ok) {
			return new Response(md.body, {
				headers: {
					'Content-Type': 'text/markdown; charset=utf-8',
					'Cache-Control': 'public, max-age=0, must-revalidate',
					Vary: 'Accept',
					Link: '</llms.txt>; rel="describedby"',
				},
			});
		}
	}
	const res = await ctx.next();
	const out = new Response(res.body, res);
	out.headers.append('Vary', 'Accept');
	out.headers.set('Link', '</index.html.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
	return out;
};
