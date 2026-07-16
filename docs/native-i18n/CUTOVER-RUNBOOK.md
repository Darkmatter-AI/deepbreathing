# Native i18n production cutover runbook

Prepared: 2026-07-16  
Cutover owner: Abi  
Execution owner: Codex, while the approved release task is active  
Scope: route the existing English and five translated URL families to the repository-owned Next.js implementation without changing URLs, translations, sitemap content, or product behavior

## Release candidate

- Branch: `codex/native-i18n`
- Native serving mode: `NATIVE_I18N_MODE=native`
- Last proxy-mode production deployment before cutover: `dpl_38pH8mJzwttsA8rtYX5L5KnymYBh`
- Last proxy-mode production URL: `https://deepbreathing-tmmj-lu0zf3eq9-darkmatterai.vercel.app`
- Hosted native-preview deployment used for browser and performance QA: `dpl_2UPyjpVFje3xh4dgPFhyKPNuhTNA`

Record the release commit and new native production deployment here before changing DNS:

- Release commit: `TBD`
- Native production deployment: `TBD`
- Cutover time in Europe/Lisbon: `TBD`

## Frozen scope

During cutover, do not change translation copy, keywords, claims, layouts, route inventory, sitemap membership, indexability, redirects, authentication architecture, the MassTranslate service, or unrelated application code. A parity defect that blocks the existing public contract may be fixed with a focused test. Everything else stays separate so later improvements remain measurable.

## Pre-cutover evidence

- Production-equivalent native build: 433 of 433 pages generated.
- Static native verifier: 275 of 275 localized parent artifacts passed.
- Googlebot runtime matrix: 350 of 350 localized URLs passed, comprising 280 sitemap URLs and 70 localized embed children.
- Hosted browser QA: every route class and all five translated locales represented, with mobile and interactive checks on the highest-risk surfaces.
- Rendered transfer regression versus English on the same deployment: 0% to 6% across five representative pairs.
- Authentication: the production Google chooser opens successfully; a local native production-mode auth request returned a valid OAuth handoff. The branch preview cannot complete Google auth because its preview environment does not have the production OAuth credentials and is not an allowed origin.
- GSC baseline, finalized through 2026-07-14: 312 of 331 inspected URLs indexed; localized last-28-day performance is 41 clicks and 1,573 impressions.
- Bing baseline, finalized through 2026-07-10: localized last-28-day performance is 29 clicks and 696 impressions.
- Vercel error baseline, last 24 hours on 2026-07-16: two malformed-JSON 500s on sync endpoints and one OAuth state mismatch; no locale-serving error cluster.
- Ahrefs: no current signed-in session was available to automation. Last documented health score was 92 on 2026-06-13 and must be treated as stale. The 350-URL native crawler sweep is the current release crawl evidence.

Known parity exceptions that are not migration regressions:

- Localized `/stats` remains in the sitemap while declaring `noindex`, matching the current contract.
- English embed metadata and the English homepage rendering warning are unchanged.
- Dormant proxy compatibility reads remain in shared code, but native server output contains no `__MT_CONFIG__` and the full localized matrix works without it.

## Current routing snapshot

The domain uses Vercel nameservers under the `amorimferreiras-projects` scope. One explicit apex ALIAS overrides the Vercel default:

```text
record id: rec_446e9b673d3eff0e30137ce3
name: @ (apex)
type: ALIAS
value: proxy-fallback.masstranslate.ai.
created: 132 days before 2026-07-16
```

The default apex and wildcard ALIAS target is `cname.vercel-dns-017.com.`. Deleting only the explicit record exposes the default Vercel apex routing. Do not delete or modify the default records, TXT records, mail records, CAA records, nameservers, the MassTranslate Worker, or its tenant configuration.

Read-only snapshot commands:

```bash
vercel dns ls deepbreathingexercises.com --scope amorimferreiras-projects
vercel domains inspect deepbreathingexercises.com --scope amorimferreiras-projects
dig +short NS deepbreathingexercises.com
dig +short A deepbreathingexercises.com
```

## Cutover sequence

### 1. Prepare the native production deployment

1. Confirm the release commit is pushed and the worktree is clean.
2. Add the production serving mode:

   ```bash
   vercel env add NATIVE_I18N_MODE production \
     --value native \
     --yes \
     --scope darkmatterai \
     --cwd /Users/abi/Sites/deepbreathing
   ```

3. Build and deploy the release commit to Vercel Production.
4. Record the deployment ID above.
5. Before DNS changes, verify the immutable deployment and `origin.deepbreathingexercises.com` with the representative matrix. Stop if any localized route is not native, returns a non-200 response, has the wrong language, lacks a self-canonical or seven alternates, exposes `__MT_CONFIG__`, or renders a Next error document.

### 2. Route the apex directly to Vercel

Delete only the explicit MassTranslate apex override:

```bash
vercel dns remove rec_446e9b673d3eff0e30137ce3 \
  --yes \
  --scope amorimferreiras-projects
```

Then poll the authoritative Vercel nameserver and public resolvers until the apex no longer resolves through the MassTranslate fallback:

```bash
dig @ns1.vercel-dns.com +short A deepbreathingexercises.com
dig @1.1.1.1 +short A deepbreathingexercises.com
dig @8.8.8.8 +short A deepbreathingexercises.com
vercel domains verify deepbreathingexercises.com \
  --project deepbreathing-tmmj \
  --scope darkmatterai
```

### 3. Immediate verification

Run the production matrix with a normal browser user agent and Googlebot. At minimum verify:

- Locale roots: `/es`, `/pt`, `/fr`, `/de`, `/ja`
- Structured family: each locale on `/breathe/ujjayi` and `/for/anxiety`
- Bespoke content: each locale on `/holiday-breathing-exercises`
- Interactive surfaces: each locale represented across `/4-7-8-breathing-timer`, `/breathing-visualizer`, `/embed`, `/embed/box?duration=180&theme=dark&binaural=0`, and `/stats`
- English root, `/languages`, auth session endpoint, Google sign-in handoff, sitemap, robots, and a signed-out stats state

For every localized HTML response require:

- HTTP 200
- exact BCP 47 `<html lang>`
- localized title and visible body
- expected self-canonical
- seven reciprocal alternates
- no `__MT_CONFIG__`
- no Next error document
- no unexpected English link target where a localized target exists

Also inspect Vercel production logs for new locale-related 4xx/5xx responses, hydration errors, or auth failures.

## Rollback

Rollback is authorized if any stop condition below is met. Route restoration comes first because it is the fastest way to return locale traffic to the known proxy path.

### 1. Restore the MassTranslate apex override

```bash
vercel dns add deepbreathingexercises.com '@' ALIAS \
  proxy-fallback.masstranslate.ai. \
  --scope amorimferreiras-projects
```

Immediately run `vercel dns ls` again and record the new record ID because Vercel will assign a different ID.

### 2. Restore the prior application deployment when needed

```bash
vercel rollback dpl_38pH8mJzwttsA8rtYX5L5KnymYBh \
  --yes \
  --scope darkmatterai
```

The DNS rollback is sufficient for an edge-routing regression. Roll back the application as well for native application, metadata, auth, or API regressions. Do not remove the MassTranslate service or credentials during the observation window.

### 3. Verify rollback

Require HTTP 200, proxy-produced localized content, canonical and hreflang parity, and working interactive controls on at least one root, structured, bespoke, embed, stats, and auth surface. Record the trigger and evidence in `PROGRESS.md` before another cutover attempt.

## Stop conditions

Rollback immediately for any of the following:

- existing locale URLs produce widespread 4xx or 5xx responses;
- localized bodies render in English or swap language after hydration;
- canonicals or hreflang sets point to the wrong locale or disappear broadly;
- timer, visualizer, embed, session, stats, or sign-in controls break because of routing;
- production error rate or representative response latency materially exceeds the captured baseline;
- sitemap or robots output changes unexpectedly;
- a critical webhook or API route fails because the apex now reaches Vercel directly.

Do not roll back for a stale Ahrefs score alone. Confirm the affected URLs with the production crawler and server logs first.

## Observation window

- T+0 to T+2 hours: repeat representative browser and Googlebot checks and inspect production errors every 15 to 30 minutes.
- T+24 hours: repeat the 350-URL crawl, compare Vercel errors and latency, and test auth plus one interactive surface per locale.
- T+7 days: refresh GSC indexing and performance, Bing performance, Ahrefs crawl health, and localized funnel signals.
- T+28 days: complete the migration outcome comparison against the pre-cutover baseline.

The old proxy remains intact until the T+28 review is accepted. Removing proxy code, cache warmers, credentials, DNS rollback knowledge, and operational workarounds is a later cleanup phase.
