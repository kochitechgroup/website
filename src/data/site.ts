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
		'A not-for-profit community for people who want to understand computing properly, from the machine up and from first principles down.',
	description:
		'A not-for-profit community in Kochi for systems programming, enterprise computing, machine learning, statistics, deep learning, mathematics and philosophy.',
	status:
		'Starting out. Talks, reading groups and writing are being planned; no events are scheduled yet.',
};

export const topics = [
	{ name: 'Systems programming', note: 'Compilers, runtimes, operating systems and the hardware underneath.' },
	{ name: 'Enterprise computing', note: 'Distributed systems, data platforms and software that runs businesses.' },
	{ name: 'Machine learning', note: 'Models that learn from data, and the engineering to train and serve them.' },
	{ name: 'Statistics', note: 'Inference, uncertainty and knowing what the data actually says.' },
	{ name: 'Deep learning', note: 'Neural networks, from the mathematics to the GPU kernels.' },
	{ name: 'Mathematics', note: 'The foundations: linear algebra, probability, logic and proof.' },
	{ name: 'Philosophy', note: 'Mind, meaning and knowledge, and what computing tells us about them.' },
];
