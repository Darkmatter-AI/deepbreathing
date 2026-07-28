# TestFlight Build 12 — Physical Device Checklist

Distilled from the three pending validation passes in `PRODUCT-EXPERIMENTS.md`
(2026-07-11 immersion pass, 2026-07-11 account-sync pass, 2026-07-12 native-sheet pass)
plus the ears-on audio gate from `submission-checklist.md` 4.5.
Build 12 = commit `0bb486e`, first build with the native `@resonance/audio` engine AND live GA4.

Check each on a physical iPhone. Anything that fails: note it, we triage before App Review.

## Audio (the big one — first build with the native engine)
- [ ] Soundscape audible with the ringer/silent switch OFF
- [ ] Audio continues after screen lock; session timing correct after unlock
- [ ] No FM warble on drone tones (8265f7b fix — listen ~30s on Coherent)
- [ ] Phase cues and haptics feel synchronized
- [ ] Phone-speaker balance acceptable (not just AirPods)
- [ ] Mobile sounds like the website (A/B against deepbreathingexercises.com)

## Session core
- [ ] All 7 modes reachable in the drawer (4 visible rows + scroll). No Wim Hof
- [ ] Drawer: opens/closes by drag AND tap; tap-away dismisses; no gesture fighting
- [ ] Safe areas (top/bottom) tint and pulse with the active mode at phase boundaries
- [ ] Duration chips + auto-stop work; pause → resume doesn't insta-complete
      (watch for the one-off in UX-BACKLOG: double-tap on resume crediting a full session)
- [ ] Settings: no duplicate mode/duration controls; settings button geometry correct (0bb486e)

## Accounts & sync
- [ ] Guest practice works with zero sign-in friction
- [ ] Apple sign-in completes; portrait/deterministic orb replaces guest icon immediately
- [ ] Google sign-in completes (real 4-color G; first page is the app's own auth subdomain, then Google — expected)
- [ ] Guest sessions migrate into the account after sign-in
- [ ] Web → phone hydration: minutes/sessions/streak match the website
- [ ] Phone → web hydration: complete a session on phone, appears on web
- [ ] Offline completion: airplane mode, complete session, re-connect, syncs
- [ ] Sign out → local practice persists
- [ ] Account deletion: initiates in-app, confirmation email arrives
- [ ] Completion: guest gets Keep Practice receipt; signed-in gets swipe-up saved banner

## Analytics (new in build 12)
- [ ] After a session, events appear in GA4 realtime (property 527524722) — first build where this can work
