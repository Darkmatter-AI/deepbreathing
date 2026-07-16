---
name: add-language
description: Full language onboarding for deepbreathingexercises.com — keywords first, then translate, deploy, and verify.
argument-hint: [locale] (e.g. pt-br, fr-fr, de-de)
disable-model-invocation: true
---

# Add Language to deepbreathingexercises.com

Onboard a new locale for the breathing exercises site. Tenant: deepbreathingexercises_com_ac8ae5.

**CRITICAL ORDER: Keywords BEFORE translation.** Pinned keywords are injected into translation prompts for both body and metadata. Translating first wastes money on retranslation.

## Phase 1: Setup

1. `get_site_config()` — confirm current languages
2. `get_site_status()` — baseline metrics
3. `deploy_translations(action="add_languages", languages=["$ARGUMENTS"])` — add the locale

## Phase 2: Keyword Research (BEFORE translating)

4. `get_page_dashboard(language="$ARGUMENTS", sort_by="impressions")` — get all pages
5. For each page, read the H1/content to understand what the page is ACTUALLY about:
   - `get_site_content(page_url=PAGE_URL)` — read primary_heading and first subheadings
   - **Never guess keywords from URLs** — always verify against actual page content
6. Write 3-4 seed keywords PER PAGE in the TARGET LANGUAGE based on H1/topic
7. Use `get_keyword_volumes` first (batches 1000 keywords in one $0.075 call) — if results have volume > 0, pin them
8. For pages where volume was null, use `research_keywords` with content-aware seeds (costs $0.075/call)
9. Pin all keywords: `set_page_keyword(locale="$ARGUMENTS", keywords=[{page_url, keyword_id}, ...])`

**Keyword selection rules:**
- Pick the keyword that best describes the page's SPECIFIC topic, not just highest volume
- Never pin keywords with search_volume = 0
- Prefer keywords that match the H1's intent over generic category terms
- After pinning, check `keyword_in_title` via optimize_metadata — if false, the keyword doesn't match the page

## Phase 2.5: Glossary

Before translating, add glossary terms for the new locale so translations use consistent terminology:

10. `manage_glossary(action="list", lang_code="en-us")` — get existing concept_ids
11. For each concept, add the new locale's term: `manage_glossary(action="add", concept_id=..., lang_code="$ARGUMENTS", term_text=...)`

Standard breathing terms to add:
- physiological_sigh, box_breathing, coherent_breathing, belly_breathing, pursed_lip_breathing
- breath_of_fire, alternate_nostril, ocean_breath, cardiac_coherence, guided_breathing

## Phase 3: Translate

12. Translate all pages in one call:
    `translate_content(target_languages=["$ARGUMENTS"])`
    No need to pass `page_urls` — the system auto-resolves all pages and uses page-batch mode.
13. Poll `check_translation_status(session_id=...)` every 60-120s until complete
14. Verify with `get_coverage_stats` — should be 90%+
15. If some pages have gaps, run another `translate_content(target_languages=["$ARGUMENTS"])` — it only translates missing segments

**Translation notes:**
- Concurrent sessions are fine — no locking conflicts
- All pages are chunked automatically to avoid LLM timeouts
- Keywords are injected into prompts automatically for pages with pinned keywords
- Coverage scores update automatically after each page completes

## Phase 4: SEO Optimization

16. `optimize_metadata(locale="$ARGUMENTS", max_pages=50, persist=true, force_refresh=true)`
17. Check `keyword_in_title` counts — retranslate metadata for pages where keyword wasn't incorporated:
    `translate_content(target_languages=["$ARGUMENTS"], metadata_only=true, force_retranslate=true)`

## Phase 5: Quality Check

18. `run_audit(locale="$ARGUMENTS")`
19. `get_audit_results(locale="$ARGUMENTS")`
20. `fix_audit_issues(locale="$ARGUMENTS", severity="high")` if needed

## Phase 6: Deploy & Verify

21. `deploy_translations(action="deploy")`
22. `get_coverage_stats(language="$ARGUMENTS", force_refresh=true)` — should be 90%+
23. Submit sitemaps: `submit_sitemap_gsc(...)` and `submit_sitemap_bing(...)`
24. Request indexing for top 5 pages
25. **Verify in browser** using `agent-browser` — check 5 top pages for translated titles/H1s/body

## Integration notes
- **Bing**: If `get_pipeline_status` shows `bing.api_key: true`, URL submission works — no OAuth needed
- **GSC**: If `gsc: "connected"`, sitemap submission and performance sync work

## Cache Warning

Cloudflare caches translated pages for ~5 minutes. After deploying, wait or hard-refresh before concluding content is untranslated.

## Phase 7: Report

Report: coverage %, pages translated, keywords pinned, keyword_in_title rate, audit issues, DataForSEO spend, glossary terms added, browser verification results.

$ARGUMENTS
