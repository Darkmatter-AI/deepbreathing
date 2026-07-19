<!-- dkmt:deep-breathing:start -->
# Deep Breathing Exercises

Deep Breathing Exercises — Guided breathing exercises web app

## Command Center

| Endpoint | URL |
|----------|-----|
| Plugin | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/plugin` |
| Briefing | `https://commandcenter.darkmatter.is/api/v1/context/deep-breathing/briefing` |
| Notes | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/notes` |
| Secrets | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/env` |
| API spec | `https://commandcenter.darkmatter.is/api/v1/openapi` |

Auth: `Authorization: Bearer $DKMT_CC_KEY`

## Environments

- **production** (domain): https://deepbreathingexercises.com
- **production** (app): https://origin.deepbreathingexercises.com

## CLI Quick Reference

The `dkmt-cc` CLI is installed via:
```
curl -fsSL https://raw.githubusercontent.com/Darkmatter-AI/deploy-dashboard/main/scripts/install-dkmt-cc.sh | bash
```

| Command | What it does |
|---------|-------------|
| `dkmt-cc context deep-breathing` | Full project context |
| `dkmt-cc env deep-breathing --export` | Resolve secrets as env vars |
| `dkmt-cc note deep-breathing "text"` | Add a note |
| `dkmt-cc access list deep-breathing` | See who has access |
| `dkmt-cc projects` | List all projects |
| `dkmt-cc whoami` | Check current user |
<!-- dkmt:deep-breathing:end -->

# Deep Breathing Project

How we work on `deepbreathingexercises.com`. Read this before starting work; the system here exists so changes don't ship "half-haz" without baselines or measurement.

## Common operations — go straight here

Before exploring, check whether your task is one of these. Each has a canonical path so you don't rediscover it.

| When you need to… | Canonical path |
|---|---|
| Check users / traffic / signups / funnel health (GA4) | skill **`dbe-analytics`** |
| Count real new accounts, or debug signup / auth | skill **`dbe-accounts-auth`** |
| Submit translated pages to GSC / Bing for indexing | skill **`daily-indexing`** |
| Add or translate a new language | skill **`add-language`** (then **`seo-keywords`**) |
| Any SEO change (title, meta, redirect, sitemap, hreflang) | read [`docs/SEO-EXPERIMENTS.md`](docs/SEO-EXPERIMENTS.md) FIRST, then log there |
| Any product/UX change measured by the funnel | log [`docs/PRODUCT-EXPERIMENTS.md`](docs/PRODUCT-EXPERIMENTS.md) |
| "How is X doing?" — current funnel state | [`docs/FUNNEL-DASHBOARD.md`](docs/FUNNEL-DASHBOARD.md) |
| Weekly funnel refresh | [`docs/runbooks/weekly-funnel-refresh.md`](docs/runbooks/weekly-funnel-refresh.md) |
| Analytics / SEO / DB tool IDs + gotchas | [`docs/runbooks/tools-and-data-sources.md`](docs/runbooks/tools-and-data-sources.md) |
| Ship a change: merge → deploy to prod → cache-bust → browser-verify | deploy section of [`docs/runbooks/tools-and-data-sources.md`](docs/runbooks/tools-and-data-sources.md) _(dedicated skill pending)_ |

Project skills live in `.claude/skills/` and load on demand by their trigger description; invoke by name.

## Experiments — before you ship

**STOP — read [`docs/SEO-EXPERIMENTS.md`](docs/SEO-EXPERIMENTS.md) FIRST.** Any SEO-adjacent task — a GSC/Bing alert, an indexing report, a redirect, a title/meta change, a sitemap or hreflang question, a crawl-health investigation — starts by reviewing that log. Many "new" problems are already diagnosed there as benign or already-fixed (e.g. the recurring "Page with redirect" WNC alert is a known no-action finding). Do not re-investigate from scratch and do not ship a change before checking whether it was already tried. This is non-negotiable; it is the whole reason the log exists.

**SEO changes** (titles, meta, sitemap, redirects, indexing): log in [`docs/SEO-EXPERIMENTS.md`](docs/SEO-EXPERIMENTS.md).

**Product/UX changes** (orb cue, hero placement, conversion timing, tracking events, anything measured by the funnel): log in [`docs/PRODUCT-EXPERIMENTS.md`](docs/PRODUCT-EXPERIMENTS.md).

For both, the rule is the same:

1. Add an entry with **hypothesis**, **baseline metrics**, and **pre-committed success criteria** (the "I'll call this Success if X moves by ≥Y%" line) BEFORE shipping — not after.
2. Link the commit, set a measure-after date, mark `🔄 Implemented`.
3. On the measure-after date: apply the criteria, don't relitigate. Move to ✅ Success / ❌ Failed / ⚪ Inconclusive / 🟡 Mixed.

The pre-commitment matters. Without it, every "implemented" entry drifts to "inconclusive" because we end up arguing about what counted.

## Current state — where the funnel is right now

[`docs/FUNNEL-DASHBOARD.md`](docs/FUNNEL-DASHBOARD.md) is the single source of truth for the current funnel (start → pause → complete → return → engaged minutes → signup). Refreshed every Friday — see [`docs/runbooks/weekly-funnel-refresh.md`](docs/runbooks/weekly-funnel-refresh.md). The recurring scheduled task `deepbreathing-weekly-funnel-refresh` (Fri 09:00 ET) prompts the next session to run the refresh.

When the question is "how is X doing?" — look at the dashboard first, not GA4 directly. The dashboard has the curated context.

## Tools and data sources

[`docs/runbooks/tools-and-data-sources.md`](docs/runbooks/tools-and-data-sources.md) is the per-task lookup for analytics, SEO, DB queries, deploy verification. **Read this BEFORE starting any analytics, SEO, or DB work.** It documents project identifiers (Vercel, GA4, Neon) and the gotchas already learned the hard way:

- GA4 lives on the **DKMT** account, property `527524722`, measurement ID `G-53DLCBMRL3`. The OLD `G-7GG9WVNBBP` (Abiassi) is stale.
- `mcp__gsc__*` tools work as of 2026-07-10 (the repo's `.mcp.json` points at the `ga-visibility` SA, an Owner of the property). This is the preferred GSC path — durable, nothing expires. The old "403, use mass-translate instead" advice is obsolete; the mass-translate OAuth expires ~2-weekly and is only needed for translation work.
- The mass-translate **proxy strips one locale prefix** before forwarding to Next.js. Redirect rules in `next.config.js` must target the post-proxy URL.
- `dkmt-cc` creds **expire ~30 days** — `dkmt-cc login` to refresh, or fall back to `vercel env pull`.
- Cloudflare + Vercel cache may serve stale 404s for ~5 min after a redirect deploy. Always cache-bust with `?cb=$(date +%s%N)` when verifying.

If you discover a new gotcha or tool detail, **update tools-and-data-sources.md in the same commit** as your work. The system only works if it stays current.

## Backlog of things not yet shipped

[`docs/UX-BACKLOG.md`](docs/UX-BACKLOG.md). Once shipped, move the entry to `PRODUCT-EXPERIMENTS.md` with hypothesis + criteria.

## File-system map at a glance

```
docs/
├── SEO-EXPERIMENTS.md             SEO change log (hypothesis, baseline, result)
├── PRODUCT-EXPERIMENTS.md         Product/UX change log (same shape)
├── FUNNEL-DASHBOARD.md            Current state, refreshed weekly
├── UX-BACKLOG.md                  Open ideas not yet shipped
├── indexing-queue.md              Operational state for GSC/Bing submissions
├── OUTREACH-CRM.md                Link-outreach targets + contact status (never double-contact)
└── runbooks/
    ├── weekly-funnel-refresh.md   Friday refresh procedure
    ├── tools-and-data-sources.md  Per-task lookup + gotchas
    └── sql/cohort-check.sql       Canonical user-quality query
```
