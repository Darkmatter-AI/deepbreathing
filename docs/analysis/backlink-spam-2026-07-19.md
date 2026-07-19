# Backlink spam analysis — deepbreathingexercises.com, 2026-07-19

**Recommendation up front: LEAVE ALONE for now.** Keep the draft file ready, do not submit it yet. Reasoning and the triggers that would change that are at the bottom.

Nothing was submitted to Google Search Console or Bing. This is analysis plus a draft artifact for review.

## What was pulled

Ahrefs Site Explorer → Referring domains, read-only via the logged-in browser session (Darkmatter account, projectId 9300406). Target `deepbreathingexercises.com/`, mode **Subdomains**, protocol **http + https**, link filter **All**, live index. All 300 rows read across three pages.

## The shape of it

| | Count |
|---|---:|
| Live referring domains | 300 |
| Classified as link-farm spam | **281** (94%) |
| Legitimate | 7 |
| Ambiguous, left alone | 12 |
| Dofollow referring domains (all types) | 28 |

Growth: **+279 referring domains in 6 months**, roughly +46/month and accelerating. DR rose 4.3 → essentially all of it from this junk.

### Eight distinct clusters

| Cluster | Count | Character | First seen |
|---|---:|---|---|
| A. High-DR singles | 12 | `buybacklinks.agency` DR 71, `fiverr-affordable-seo-services.site` DR 70, `rank-top.click` DR 60 | Dec 2025 – Apr 2026 |
| B. DR 53-54 `.shop` | 14 | `linkrankpro.shop`, `pbnseolinks.shop`, `authoritybacklinks.shop` | May – Jun 2026 |
| C. "SEOExpress" DR 34 | 37 | `seoexpress.{shop,store,site,website,space,online}` plus hijacked-looking real shop names (`kawaiishop.shop`, `lixil-reformshop.shop`, `rent-a-shop.shop`) | Apr – Jun 2026 |
| D. Hyphenated `.store` PBN | **127** | `seoexpress-pbn-company.store`, `link-baron-da-pa-luxury-directory.store`, `outrank-hq-dr-90-paramount-system.store`, `dr-90-rank-forge-department.store` | May – Jul 2026 |
| E. Descriptive-phrase `.store` | 18 | `crawl-budget-organic-traffic-and-contextual-link-central.store` | Jul 2026 (newest) |
| F. Low-DR `.shop` backlink shops | 57 | `seokart.shop`, `linkpicks.shop`, `rankgear.shop` — near-identical DR 0.8, 51 refdomains each | Jun – Jul 2026 |
| G. Chinese spam | 13 | `1gua.xyz`, `1asmr.xyz`, `seju.life` | Jan 2026 |
| H. Scrapers / SEO tools | 21 | carried from the 2026-02-06 file | pre-2026 |

Clusters D, E and F are machine-generated at scale. Cluster F in particular is 57 domains with identical metrics (DR 0.8, 51 dofollow refdomains, one link to us each) registered across three weeks — one operator, one script.

### What this is, most likely

Not a targeted negative-SEO attack. The naming (`dr-90-`, `tier-1-`, `guest-post-`, `niche-edit-`, `pbn-`) is link-vendor inventory: these farms exist to sell links, and they scrape and link large numbers of sites to look populated and to build their own internal link graphs. We are collateral, not a target. A DR 4.3 breathing-exercises site is not worth attacking.

Two supporting facts: every farm domain links to us exactly once, and the farms carry hundreds of other outgoing linked domains each.

## Is it hurting us?

**No evidence that it is.** Over the same six months the spam scaled from ~20 to ~280 domains:

- Organic keywords: 17 (**+12**)
- Organic traffic: 15 (**+14**)
- DR: 4.3 (+4.3)
- No ranking collapse in [SEO-EXPERIMENTS.md](../SEO-EXPERIMENTS.md); the losses logged there have identified causes (sitemap conversion, canonical hijack, CTR experiments), none link-related

The site got better while the spam got worse. That is the single most important input to the recommendation.

## Why "leave alone" rather than "submit"

1. **Google's own guidance.** The disavow tool is for sites with a manual action, or that expect one. Google states it ignores obvious link spam algorithmically. SpamBrain has neutralised this category since 2022. Disavowing junk Google already discounts changes nothing.
2. **The evidence says we are not being penalised.** Traffic and keywords are up through the whole influx.
3. **Disavow has real downside and no upside here.** The failure mode is disavowing something legitimate. This list is conservative, but `bettersleephacks.com`, `shiftmag.org` and `reiwachronicle.tokyo` are exactly the kind of small real site that gets swept up in a bulk classification. The cost of wrongly disavowing a genuine link is permanent and silent.
4. **It does not stay done.** At +46/month, submitting today means re-submitting monthly forever. That is a standing chore bought in exchange for no measured benefit.
5. **It would contaminate the outreach experiment.** The [outreach baseline](../SEO-EXPERIMENTS.md) was pinned today at 28 dofollow referring domains. Changing the link profile mid-window adds a confound to a 90-day measurement that is already noisy.

## When to submit instead

Any one of these flips the recommendation to "submit the draft immediately":

1. **A manual action appears in GSC** under Security & Manual Actions → "Unnatural links to your site". This is the decisive trigger; the file is ready to upload the same day.
2. **An unexplained ranking or traffic drop** that survives the usual checks (indexing, canonical, sitemap, CTR experiments) and correlates with a spam influx spike.
3. **The character changes from vendor inventory to targeted attack** — for example, farm links start using our commercial anchor text (`box breathing`, `4-7-8`) rather than bare URLs, or a single operator points hundreds of links at one money page. Check the Anchors report if this is suspected.

## Middle option, if you want insurance

If you would rather not carry the risk, submit **clusters D, E and F only** (202 domains). They are the machine-generated bulk, they are unambiguous, and none of them could plausibly be a real site. That captures ~72% of the spam with essentially zero chance of a false positive. Clusters A, B, C, G and H add little and include a few judgment calls.

## Housekeeping found along the way

- `docs/disavow.txt` header says "Disavow file for **deepbreathing.com**". The property is `deepbreathingexercises.com`. Cosmetic, but worth fixing whenever that file is next touched.
- The live file's 27 domains are all carried into the draft, so the draft can replace it wholesale rather than being appended.
- Bing maintains a **separate** disavow tool. The 2026-02-06 submission went to Google only. If a submission ever happens, decide deliberately whether Bing gets it too — Bing drives meaningful impressions for this site (see the FR Coherent entry).

## Correction to an earlier note

My 2026-07-19 SEO-EXPERIMENTS entry cited `linkrankpro.ch` as a spam domain. That was a misread of a truncated table cell. The actual domain is **`linkrankpro.shop`**. No other domain in that entry was affected.

## Files

- [`docs/disavow-2026-07-19-draft.txt`](../disavow-2026-07-19-draft.txt) — 299 domains, 8 clusters, **not submitted**
- [`docs/disavow.txt`](../disavow.txt) — unchanged; still reflects what is actually live in GSC as of 2026-02-06
