---
name: dbe-analytics
description: Pull user analytics, new-account signups, and funnel health for deepbreathingexercises.com from Google Analytics 4. Use when asked to check users, traffic, new accounts/signups, conversions, or "how the funnel is doing" for DBE. Drives GA4 via the claude-in-chrome (/chrome) browser tools — the user is already authenticated.
---

# DBE Analytics (GA4)

deepbreathingexercises.com's product analytics (users, new accounts, funnel) live in **Google Analytics 4**, not in the SEO tools (GSC/Bing/Ahrefs cover search only). This repo is a control surface — there is no app source here, so everything is read via the browser.

## Property

- **Account:** DKMT · **Property:** Deep Breathing Exercises
- **Property path:** `a375255070p527524722` (account `a375255070`, property `p527524722`)
- Auth: the user's Chrome is already signed in — just navigate, no login flow.

Key URLs (open with the `claude-in-chrome` navigate tool):
- Home snapshot: `https://analytics.google.com/analytics/web/#/a375255070p527524722/reports/intelligenthome`
- Admin → Events (event list + key-event stars): `https://analytics.google.com/analytics/web/#/a375255070p527524722/admin/events/hub`
- Realtime: `…/realtime/overview` · Reports hub: `…/reports/intelligenthome`

Fastest read: `navigate` to a report, then `get_page_text` — the Home page returns the full snapshot (active/new users, channels, countries, top pages, event counts) as plain text without screenshots.

## Event taxonomy

**Engagement funnel** (someone using a breathing tool):
`session_start` → `page_view` → `page_viewed_breathing` → `breathing_session_start` → `breathing_session_end`
- Note: `breathing_session_pause` and `breathing_session_complete` no longer appear in GA4 recent events (last 28 days as of 2026-06-21) — may have been removed from instrumentation.
- Healthy benchmark seen 2026-05-30: ~82% of started sessions complete; only ~1 in 3 breathing-page viewers start a session (top-of-funnel is the weak point, not completion).

**Signup / new-account funnel** (the real conversion — yes, the site has accounts via Google + magic link):
`conversion_prompt_shown` → `conversion_prompt_dismissed` (drop-off) **or** `signin_google_clicked` / `signin_magic_link_sent` → `signup_user_identified` → **`conversion_signup_completed`** (← the conversion)

**Other events:** `mode_switch`, `form_start`, `scroll`, `click`, `first_visit`, `user_engagement`, `signin_prompt_view`.
- Note: `binaural_toggled` and `eyes_closed_toggled` no longer appear in recent events (as of 2026-06-21); may be instrumented but low-traffic or removed.

## Key events (conversions) — important gotcha

GA4's "Key events: 0" on Home is misleading. As of 2026-05-30:
- `conversion_signup_completed` is marked as a **key event** (set this session) — this is the new-account conversion.
- `purchase` appears in the Key events tab with an **empty star** (it has been unmarked as a key event) and shows "No stream data detected" — it never fires. No action needed.

If a funnel/conversion report shows zero, first check Admin → Events that the relevant event is still starred as a key event before concluding the funnel is leaking.

## "New accounts" = `conversion_signup_completed`

When asked about "new accounts," report `conversion_signup_completed` (key event), not GA4's "New users" metric — "New users" just means first-time *visitors*, not registered accounts.

## Saved funnel exploration — "Signup Conversion Funnel"

There is a ready-made GA4 funnel exploration named **"Signup Conversion Funnel"** (Explore → Explorations list). Built 2026-05-30 after the key-event fix. Open it instead of rebuilding. Standard (closed) funnel, 5 ordered steps:

1. **Viewed breathing tool** — `page_viewed_breathing`
2. **Started a session** — `breathing_session_start`
3. **Saw signup prompt** — `conversion_prompt_shown`
4. **Started signup** — `signin_google_clicked` OR `signin_magic_link_sent`
5. **Account created** — `conversion_signup_completed`

Note it's a *closed* funnel (`MAKE OPEN FUNNEL` off), so it counts only users who hit the steps in order — its step-5 count will be lower than total DB signups (some users sign up without first starting a session). Use it for *where users drop*, and the Neon `"user"` table ([[dbe-accounts-auth]]) for the true signup count.

There is also an older broken **"Breathing Conversion Funnel"** (gated on `breathing_session_pause`/`complete`, reads ~0) — ignore it.

To rebuild from scratch: Explore → Funnel exploration → pencil next to STEPS. The event picker's "Search items" box needs a direct click to focus before typing, or the text leaks into GA4's global search bar.

## Reporting style

Lead with a small table (active users, new users, new accounts, WoW deltas), then channels / top pages, then the two funnels with step-conversion rates. Flag instrumentation gaps (key-event config) explicitly. End with concrete next steps.
