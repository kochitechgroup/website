# kochitechgroup.dev

Website for Kochi Tech Group, a not-for-profit community in Kochi. Its areas: systems programming, enterprise computing, machine learning, statistics, deep learning, mathematics and philosophy. Astro static site, deployed to Cloudflare Pages from `main`.

## Toolchain

Bun only. `bun install` also points git at `.githooks/` (the `prepare` script).

| Task | Command |
|---|---|
| Dev server | `bun run dev` (for an agent: `bunx astro dev --background`, stop with `bunx astro dev stop`) |
| Build | `bun run build` → `dist/` |
| Constraint checks | `bun run check` |
| Unit tests | `bun test` |

## Commits

Conventional Commits are mandatory. The `commit-msg` hook and CI both reject anything else.

- Header: `type(scope)!: subject`, lower case, imperative mood, no trailing period, 72 characters or fewer.
- Types: `feat fix docs style refactor perf test build ci chore revert`.
- Separate the header from the body with a blank line.
- One logical change per commit.

## Constraint checks

`scripts/checks/rules.ts` holds the rules that can only be checked after text is written: colors come from tokens, every light token has a dark value, no third-party scripts, pages have title and description, images have alt text, bun only, copy claims only what is true, and plain words.

They run in three places:
1. **After every Edit/Write by Claude Code**, via `.claude/settings.json`. Violations come back as tool feedback.
2. **In the pre-commit hook**, against the staged content, along with `bun test` and `bun run build`.
3. **In CI**, against every tracked file.

When a check fails, fix the text. Feedback from a check is routine and doesn't mean the work was bad. If a rule is wrong for a case, add `check-ignore: <rule-id> -- <reason>` on the line or the line above, or change the rule and its test in the same commit. Never bypass a hook with `--no-verify`.

Adding a rule: add it to `rules`, then add a test in `rules.test.ts` that shows it firing and not firing.

## Site data and agent files

- `src/data/site.ts` is the single source for the group's name, email, tagline and topics. The home page, `/llms.txt`, `/robots.txt` and the JSON-LD all read from it, so change facts there.
- `/llms.txt` follows https://llmstxt.org. When you add a page, add it to the `## Pages` list in `src/pages/llms.txt.ts`.
- `src/layouts/Base.astro` wraps the body in `<!--email_off-->`, because Cloudflare Email Obfuscation would otherwise hide the address from crawlers and agents.
- Every page renders through `Base.astro`. Pass `noindex` for pages that must not be indexed.

## Content rules

- **Say only what is true today.** The group isn't registered and has no partners, sponsors, dates or venues yet. Don't invent events, speakers, member counts or testimonials. `claims-match-reality` catches some of these; the rest is on the author.
- **The audience is engineers and serious learners.** Write concrete, plain sentences. Name the subject rather than gesturing at "deep tech".
- **Keep the name.** Write "Kochi Tech Group" in full, "KTG" only as the mark.
- **Contact address:** `hello@kochitechgroup.dev`. It receives mail only, via Cloudflare Email Routing.

## Design rules

- The theme lives in `src/styles/global.css`. Its palette comes from the hero image `src/assets/kochi-net.png`: dusk indigo, sunset orange (accent) and sun gold.
- Colors are CSS custom properties on `:root`, redefined under `@media (prefers-color-scheme: dark)`. Nothing else holds a color literal. Text over the hero image uses the `--on-image*` tokens, which are the same in both themes.
- Type: Fraunces (serif) for headings and Inter for body text, both self-hosted via `@fontsource-variable`. Don't add Google Fonts links.
- Images go in `src/assets/` and render through `astro:assets` `<Image>`, so they ship as resized WebP. Don't put large originals in `public/`.
- It has to work at 390px wide with no horizontal scroll.
- No client-side JavaScript unless a feature needs it. Right now nothing does.
- Before calling a visual change done, look at it rendered: build, `bunx astro preview`, and screenshot desktop and phone widths.

## Deploy

Cloudflare Pages builds `main` with `bun run build` and serves `dist/`. Pushing to `main` deploys to production, and other branches get preview URLs.
