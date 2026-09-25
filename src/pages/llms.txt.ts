// /llms.txt, per https://llmstxt.org: a plain-Markdown summary for language models and agents.
import type { APIRoute } from 'astro';
import { site, topics } from '../data/site';

export const GET: APIRoute = () => {
	const body = `# ${site.name}

> ${site.description}

${site.tagline}

- Location: ${site.locality}, ${site.region}, India
- Status: ${site.status}
- Contact: ${site.email} (the only contact channel; email is read by the organisers)
- Source code of this website: ${site.github}/website

## What we study

${topics.map((t) => `- ${t.name}: ${t.note}`).join('\n')}

## How to take part

Write to ${site.email} to hear about the first sessions, or to offer a talk, a venue, or help organising.

## Pages

- [Home](${site.url}/): who we are, what we study, how to get in touch

## Optional

- [GitHub organisation](${site.github}): the website's source and future community projects
`;
	return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
