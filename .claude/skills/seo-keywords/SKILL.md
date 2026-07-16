---
name: seo-keywords
description: Research and pin SEO keywords for all pages in a target locale. Run after translations are deployed.
argument-hint: [locale] (e.g. pt-br, fr-fr)
disable-model-invocation: true
---

# SEO Keyword Research & Pinning

Research and pin keywords for all pages in a locale on deepbreathingexercises.com.

## Prerequisites
- Site must be set up with the locale already added
- DataForSEO credentials configured (check `get_site_config()`)

## Step 1: Read page content

For EVERY page, read the actual content before choosing seeds:

```
get_site_content(page_url=PAGE_URL, include_segments=True)
```

Extract the H1 (primary_heading) and first subheadings. **Never derive keywords from URLs alone** — the URL often doesn't match the page's specific topic.

Example:
- URL `/for/athletes` suggests "breathing for athletes"
- H1 says "Faster Recovery Between Sets: The Physiological Sigh for Athletes"
- Correct seed: "suspiro fisiológico recuperação treino" (specific topic)
- Wrong seed: "respiração para atletas" (generic, from URL)

## Step 2: Batch volume check first (cheap)

Write one candidate keyword per page in the target language. Batch them all in one call:

```
get_keyword_volumes(locale="$ARGUMENTS", keywords=[...up to 1000...])
```

Cost: ~$0.075 total for up to 1000 keywords. Results now include `id` fields for pinning.

## Step 3: Pin keywords with volume

For keywords that returned volume > 0 and have an `id`:

```
set_page_keyword(locale="$ARGUMENTS", keywords=[
  {page_url: "/page1", keyword_id: "kw_xxx"},
  {page_url: "/page2", keyword_id: "kw_yyy"},
  ...
])
```

## Step 4: Research fallbacks for nulls

For pages where the volume lookup returned null, use `research_keywords` with content-aware seeds:

```
research_keywords(
  locale="$ARGUMENTS",
  page_url="/specific-page",
  seed_keywords=["seed1 in target language", "seed2", "seed3"]
)
```

Cost: ~$0.075/call. Only call this for pages that need it.

## Step 5: Verify incorporation

```
optimize_metadata(locale="$ARGUMENTS", max_pages=50, persist=true, force_refresh=true)
```

Check `keyword_in_title` and `keyword_in_description` in results. If a keyword wasn't incorporated:
- The keyword likely doesn't match the page's actual topic
- Re-research with better content-aware seeds
- Re-pin and retranslate metadata: `translate_content(metadata_only=true, force_retranslate=true, page_urls=[...])`

## Keyword Selection Rules

1. **Match the page's specific subject** from H1, not the generic category
2. **Never pin volume=0 keywords** — nobody searches for them
3. **Prefer topic alignment over raw volume** — a 200vol keyword that matches the page beats a 2000vol tangential keyword
4. **Check for duplicates** — don't pin the same keyword on multiple pages

## Cost Optimization

- `get_keyword_volumes`: $0.075 per call, batches up to 1000 keywords → always try this first
- `research_keywords`: $0.075 per call, one page at a time → fallback only
- Both have 24h cache — repeat calls within a day are free
- Typical cost for 44 pages: ~$1.50-$2.50

## Auditing Existing Keywords

When auditing a locale that already has keywords pinned:
1. Check for **language contamination** — keywords in the wrong language (e.g. Portuguese keywords on es-es pages). This happened when keywords were shared across locales.
2. Check for **topic mismatches** — compare pinned keyword against the page's H1. A generic keyword on a specific-topic page won't get incorporated by the translator.
3. Use `get_page_dashboard(language=LOCALE)` to see all current `pinned_keyword` values at a glance.

## Glossary Sync

When pinning keywords for a new locale, also add glossary terms:
```
manage_glossary(action="list", lang_code="en-us")  # get concept_ids
manage_glossary(action="add", concept_id=..., lang_code=LOCALE, term_text=...)
```
Standard concepts: physiological_sigh, box_breathing, coherent_breathing, belly_breathing, pursed_lip_breathing, breath_of_fire, alternate_nostril, ocean_breath, cardiac_coherence, guided_breathing

$ARGUMENTS
