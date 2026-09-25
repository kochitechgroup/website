# Cloudflare configuration

Everything about this site that lives in the Cloudflare dashboard rather than in this repository. When you change a setting there, record it here in the same week, with the date.

The zone is `kochitechgroup.dev`, on the Free plan. Account IDs and personal addresses are deliberately left out, because this repository is public.

## Pages project

| Setting | Value |
|---|---|
| Project name | `kochitechgroup` |
| Source | GitHub `kochitechgroup/website`, via the Cloudflare Pages GitHub app |
| Production branch | `main` (deploys to https://kochitechgroup.dev) |
| Preview deploys | every other branch, at `https://<branch>.kochitechgroup.pages.dev` (Cloudflare adds `X-Robots-Tag: noindex`) |
| Build command | `bun run build` |
| Output directory | `dist` |
| Environment variables | `NODE_VERSION=22` |
| Framework preset | none |

Response headers come from `public/_headers` in this repo, not from the dashboard. `functions/_middleware.ts` is a Pages Function, and `public/_routes.json` limits it to `/`, so it runs once per home-page request and never for assets.

## DNS

| Type | Name | Content | Proxy | Why |
|---|---|---|---|---|
| CNAME | `@` | `kochitechgroup.pages.dev` | proxied | Added by Pages when the custom domain was attached |
| A | `www` | `192.0.2.1` | proxied | Placeholder address (RFC 5737). The request never reaches it; the www redirect rule answers at the edge |
| MX ×3 | `@` | `route{1,2,3}.mx.cloudflare.net` | n/a | Email Routing |
| TXT | `@` | SPF for Email Routing | n/a | Email Routing |

## Email

- **Email Routing:** `hello@kochitechgroup.dev` forwards to an organiser's inbox. It can receive only; there is no SMTP to send from this address.
- **Email Address Obfuscation** (Scrape Shield) is **on** at zone level. It would rewrite `mailto:` links into `/cdn-cgi/l/email-protection` and hide the address from crawlers and agents. `src/layouts/Base.astro` wraps the page body in `<!--email_off-->` to opt out, and production was checked on 2026-09-25 to serve plain `mailto:` links.

## Redirects

| Rule | Where | Match | Target | Code |
|---|---|---|---|---|
| Canonical host for kochitechgroup | Account → Bulk Redirects, list `ktg_canonical_host` | `kochitechgroup.pages.dev` (subpath matching, subdomains **excluded** so previews keep working) | `https://kochitechgroup.dev`, path and query preserved | 301 |
| Redirect from WWW to root | Zone → Rules → Redirect Rules | `https://www.*` | `https://${1}`, query preserved | 301 |
| HTTP to HTTPS | Zone → SSL/TLS → Always Use HTTPS | all `http://` | `https://` | 301 |

## Security and TLS

- **Universal SSL** certificate covers `kochitechgroup.dev` and `*.kochitechgroup.dev`.
- **HSTS: not enabled.** It was recommended (6-month max-age, no `includeSubDomains`, no preload, plus `nosniff`) but is waiting for an organiser to switch on by hand under SSL/TLS → Edge Certificates.

## AI crawlers and agents

- **AI Crawl Control:** no per-crawler rules. `robots.txt` (served from this repo) allows everything, and GPTBot and ClaudeBot were checked to get a normal 200.
- **Managed robots.txt:** off. Our own file is served unchanged, including its `Content-Signal: search=yes, ai-input=yes, ai-train=yes` line (set 2026-09-25).
- **Agent Readiness scan (2026-09-25):** "Almost ready", Quick Wins 3/5. The open items:
  - *Content Signals*: added to our own `robots.txt` on 2026-09-25, not through the managed-robots feature.
  - *Markdown Negotiation*: added on 2026-09-25 through the Pages Function.
  - Levels 2 and 3 (API discovery, agent login, tools) and Commerce don't apply to a static community site.

## Change log

- **2026-09-25:** Pages project created, custom domain attached, Bulk Redirect `pages.dev` → apex added, `www` DNS record and www → apex redirect added. HSTS left off, pending a decision.
