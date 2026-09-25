// Single source for facts about the group. The home page, llms.txt, robots.txt
// and structured data all read from here, so they cannot drift apart.

export const site = {
	name: 'Kochi Tech Group',
	shortName: 'KTG',
	url: 'https://kochitechgroup.dev',
	email: 'hello@kochitechgroup.dev',
	github: 'https://github.com/kochitechgroup',
	locality: 'Kochi',
	region: 'Kerala',
	country: 'IN',
	tagline:
		'A not-for-profit community that studies computing from first principles. We read primary sources, work through the proofs, and measure before we claim.',
	description:
		'A not-for-profit community in Kochi, Kerala that studies computing from first principles: systems, enterprise computing, ML, statistics, maths and philosophy.',
	heroAlt:
		"A Chinese fishing net on the Kochi shore at sunset. Its mesh is drawn as circuit traces, and the sun's reflection on the sea breaks into bars of light.",
	status:
		'Starting out. Talks, reading groups and writing are being planned; no events are scheduled yet.',
};

// Official accounts. Add new ones here; the footer, JSON-LD sameAs, llms.txt
// and the Markdown twin all read this list.
export const socials = [
	{ name: 'YouTube', url: 'https://www.youtube.com/@KochiTechGroup', note: 'recorded talks' },
	{ name: 'LinkedIn', url: 'https://www.linkedin.com/company/kochitechgroup/', note: 'updates for professionals' },
	{ name: 'X', url: 'https://x.com/kochitechgroup', note: 'updates' },
	{ name: 'Instagram', url: 'https://www.instagram.com/kochitechgroup/', note: 'updates' },
	// DID URL, so the link survives handle changes (handle @kochitechgroup.dev, verified 2026-09-25 via public/.well-known/atproto-did).
	{ name: 'Bluesky', url: 'https://bsky.app/profile/did:plc:shlvkrn2kun2knosxwyxgchs', note: 'updates' },
	{ name: 'GitHub', url: 'https://github.com/kochitechgroup', note: 'code and community projects' },
];

export const topics = [
	{ name: 'Systems programming', note: 'Compilers, runtimes, operating systems and the hardware underneath.' },
	{ name: 'Enterprise computing', note: 'Distributed systems, data platforms and software that runs businesses.' },
	{ name: 'Machine learning', note: 'Models that learn from data, and the engineering to train and serve them.' },
	{ name: 'Statistics', note: 'Inference, uncertainty and knowing what the data actually says.' },
	{ name: 'Deep learning', note: 'Neural networks, from the mathematics to the GPU kernels.' },
	{ name: 'Mathematics', note: 'The foundations: linear algebra, probability, logic and proof.' },
	{ name: 'Philosophy', note: 'Mind, meaning and knowledge, and what computing tells us about them.' },
];
