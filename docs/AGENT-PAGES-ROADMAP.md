# Agent-Generated Breathing Session Pages — Roadmap

> Any AI agent can create custom breathing session pages on deepbreathingexercises.com.
> Pages persist as indexable UGC, building a programmatic SEO flywheel.

## Vision

The breathing engine becomes infrastructure that any agent can call — via URL, REST API, or MCP. Each generated page is a unique long-tail landing page that earns organic traffic and backlinks. Free distribution through every agent that creates a link. Premium tier for power users and API consumers.

## Phases

### Phase 0 — Foundation (prerequisites)
Unblock the agent pages feature by aligning the codebase.

1. **Migrate web Resonance.tsx to `@resonance/engine`** — eliminate the local fork of types/patterns/constants
2. **Add custom pattern support to engine** — allow ad-hoc `BreathingPattern` objects (not just `ModeName` presets)
3. **Create `session_events` table + API endpoint** — enables per-page engagement tracking (completion counts, quality signals)
4. **Add `breathing_sessions` table** — persistence for agent-generated pages (slug, config, metadata, quality tier)

### Phase 1 — Agent Pages MVP
The core product: URL → quality gate → persistent page.

1. `/breathe/new` URL endpoint — accepts params, runs quality gate, persists or creates temporary session, redirects to slug
2. `/breathe/[slug]` dynamic page — Resonance player + custom content template + schema markup
3. Quality gate implementation — minimum data check, similarity detection, tier assignment
4. Dynamic OG images via `@vercel/og`
5. Segmented sitemap (`sitemap-sessions.xml`)
6. Internal linking — auto-link from pattern/use-case hub pages, "related sessions" module
7. `llms.txt` + `/developers` page — machine-readable docs for LLM discoverability

### Phase 2 — Distribution
Multiple front doors to the same backend.

1. REST API (`POST /api/v1/sessions`) — returns session URL + metadata
2. OpenAPI spec at `/api/openapi.json`
3. Embeddable widget + oEmbed protocol
4. ChatGPT Action registration
5. MCP server (`packages/mcp-server`) wrapping the REST API

### Phase 3 — Monetization
Premium tier for power users and API consumers.

1. Premium API keys with rate limits
2. Custom patterns (premium) — arbitrary inhale/hold/exhale durations
3. Private sessions (noindex, unlisted)
4. Branded embeds (remove "powered by" attribution)
5. Stripe integration for fixed-price subscription

### Phase 4 — Mobile
Universal links and native rendering.

1. Universal links / app links for `/breathe/[slug]`
2. Mobile session rendering from shared page data
3. Deep link → app or smart banner fallback
4. Mobile premium unlock (Apple/Google IAP)

## Key Constraints

| Rule | Threshold |
|------|-----------|
| Max monthly page growth | 20-30% (never >50%) |
| Min quality score to index | 60/100 |
| Indexation ratio target | >60% |
| Max boilerplate per page | 40% |
| Min unique content per page | 60% |
| Min unique data points per page | 5 |
| Prune zero-engagement pages after | 90 days |
| Near-duplicate similarity threshold | 70% |

## Free vs Premium Split

| Always Free (growth engine) | Premium |
|---|---|
| All 12 base patterns | Custom patterns (arbitrary durations) |
| Basic session experience | Soundscapes / audio themes |
| Shareable page URL | Session history & insights |
| Embeddable widget | Cross-device sync |
| Create via URL params | API access with higher rate limits |
| Public pages (indexed) | Private sessions (noindex, unlisted) |
| Standard themes | Full color/theme customization |
| | Remove "powered by" on embeds |
| | PDF export of routines |

**Principle:** Never paywall the distribution engine. Public pages + basic patterns = free forever.
