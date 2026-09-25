// /index.html.md: the home page as Markdown, per the llmstxt.org convention
// (a page's Markdown twin lives at its URL + ".md"; "/" becomes "/index.html.md").
// functions/_middleware.ts serves this for "/" when a client asks for text/markdown.
import type { APIRoute } from 'astro';
import { site, socials, topics } from '../data/site';

export const GET: APIRoute = () => {
	const body = `# ${site.name}

${site.tagline}

${site.locality}, ${site.region}, India.

## What we study

${topics.map((t, i) => `${i + 1}. **${t.name}**: ${t.note}`).join('\n')}

## Coming soon

Talks, reading groups and writing. ${site.status}

To hear first, or to take part, write to [${site.email}](mailto:${site.email}).

## Links

- Website: ${site.url}/
- Summary for AI agents: ${site.url}/llms.txt
${socials.map((s) => `- ${s.name}: ${s.url}`).join('\n')}
`;
	return new Response(body);
};
