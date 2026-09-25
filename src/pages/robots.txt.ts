import type { APIRoute } from 'astro';

// Everything is public, including to AI crawlers: the point of the site is to be found.
// Content signals (https://contentsignals.org): search = search indexing,
// ai-input = using pages to ground AI answers, ai-train = training models.
// Flip ai-train to "no" here if the group decides against training use.
const signals = 'search=yes, ai-input=yes, ai-train=yes';

export const GET: APIRoute = ({ site }) => {
	const sitemap = new URL('sitemap-index.xml', site).href;
	const body = `# Content signals for this site: ${signals}.
# See https://contentsignals.org for what each signal means.

User-agent: *
Content-Signal: ${signals}
Allow: /

Sitemap: ${sitemap}
`;
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
