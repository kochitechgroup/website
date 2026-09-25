// /llms.txt, per https://llmstxt.org: H1, blockquote summary, free-form detail,
// then H2 sections that are lists of links. Static build, so Pages serves it as text/plain.
import type { APIRoute } from 'astro';
import { site, socials, topics } from '../data/site';

export const GET: APIRoute = () => {
	const body = `# ${site.name}

> ${site.name} is a not-for-profit community in ${site.locality}, ${site.region}, India (not Kōchi, Japan) for systems programming, enterprise computing, machine learning, statistics, deep learning, mathematics and philosophy.

${site.tagline}

Status: ${site.status}

Contact: ${site.email}. This is the only contact channel.

Subjects:

${topics.map((t) => `- ${t.name}: ${t.note}`).join('\n')}

To take part, write to ${site.email} to hear about the first sessions, or to offer a talk, a venue, or help organising.

## Pages

- [Home](${site.url}/): who we are, what we study, how to get in touch; its footer links here

## Optional

- [Website source](${site.github}/website): the code for this site
${socials.map((s) => `- [${s.name}](${s.url}): ${s.note}`).join('\n')}
`;
	return new Response(body);
};
