# Mobile app review tickets (2026-06-10)

Findings from a parity + product review of the Expo app (`apps/mobile`) against the website
breathing experience. Verified interactively on the iPhone 17 Pro simulator (idle, running,
settings sheet, completion). The DOM-component port is faithful by construction: `Visualizer.tsx`,
`ParticleBackground.tsx`, `SnowBackground.tsx`, `audioService.ts`, `constants.ts`, and
`runtime-phrases.ts` are byte-identical to `src/components/resonance/*`. The tickets below are
the gaps that remain.

Each ticket is self-contained. Pick one, do it, verify with the runbook at the bottom.

**Relationship to the Linear backlog (team DAR, project Deep Breathing):** these are NEW findings,
not duplicates of DAR-395..401. Where a ticket touches an existing issue it says so. When you
finish a ticket, check whether it should be logged in Linear against that issue.

---

## MOB-1 — Light-mode sessions render on black instead of cream (parity bug)

**Priority: High. Size: XS (one CSS rule + rebuild). Blocks: visual parity sign-off.**

> **STATUS: DONE 2026-06-10** (Cursor Composer run, verified by Claude on the iPhone 17 Pro
> sim in light AND dark mode). Fix landed in `styles/source.css` + regenerated
> `breathing-web.css`; working tree, not yet committed. All acceptance criteria below checked.
> Note: verification left an in-app theme override (dark) in the webview's localStorage.

### Problem

When a session is running, the experience root swaps its opaque `bg-background` for an inline
10%-alpha theme tint:

- `apps/mobile/src/components/breathing-web/BreathingExperience.tsx:1026` —
  `return isRunning ? \`${themeColor}1a\` : undefined;`
- `:1031-1032` — the inline `style.backgroundColor` overrides the `bg-background` class.

On the website that tint composites over the page body, which is opaque cream/dark
(`src/app/layout.tsx:86` — `<body className="... bg-background ...">`). In the app the WKWebView
body has no background-color, so the tint composites over the webview's dark backing.

Reproduced in the sim (light mode): idle = cream, tap orb = near-black, stop = cream again.
On the website light mode stays light during a session.

### Fix

Add to `apps/mobile/src/components/breathing-web/styles/source.css`:

```css
html, body { background-color: hsl(var(--background)); }
```

Then rebuild the compiled artifact: `npm run breathing:css` (run inside `apps/mobile`, Node 22).
Do not hand-edit `breathing-web.css`.

### Acceptance criteria

- [ ] Light mode: background stays cream-tinted while running (compare with the website at
      `deepbreathingexercises.com` in light mode, session running).
- [ ] Dark mode: still dark while running (no regression).
- [ ] Idle/running/idle transition has no flash to black in either theme.

---

## MOB-2 — Analytics events are emitted but dropped; the app is invisible to the funnel

**Priority: High. Size: S-M. Treat as a launch blocker.**

> **STATUS: DONE 2026-06-10** (Claude Sonnet subagent implementation, judged + committed by the
> orchestrating agent). New `ga4-mp.ts` MP client (fire-and-forget, 5s abort timeout, never
> throws, stable AsyncStorage client_id), forwarding wired into `handleEvent`, secret via
> `EXPO_PUBLIC_*` vars in gitignored `.env`. Verified: 63 tests, tsc clean, MP validation
> endpoint zero messages, per-event `HTTP 204` in the Metro log from a real sim session, and
> the event names visible in GA4 realtime (mixed with web traffic — exclusive app attribution
> via `app_platform` lands with the next funnel refresh). One review fix applied post-agent:
> `fireGA4Event` now awaits the in-flight `warmClientId` promise instead of racing it.
> EAS-build note: `EXPO_PUBLIC_GA4_*` must be configured as EAS env vars before any
> TestFlight/store build, or the app silently skips analytics (DAR-395 checklist).

### Problem

The DOM component emits the same GA4 events the website fires, through `onEvent`:

- `breathing_session_start` — `BreathingExperience.tsx:480`
- `breathing_session_end` — `:437`
- `mode_switch` — `:568`
- `page_viewed_breathing` — `:910`

The native host handler only handles `haptic` and `keep_awake` and silently drops the rest
(`apps/mobile/src/app/index.tsx:98-111`). `handleSessionComplete` is a no-op (`index.tsx:96`).
Result: zero measurement. The funnel dashboard (`docs/FUNNEL-DASHBOARD.md`) will never see app
sessions.

### Fix sketch

In `index.tsx`'s `handleEvent`, forward the four events above to GA4 via the Measurement
Protocol (property `527524722`, measurement ID `G-53DLCBMRL3` — see
`docs/runbooks/tools-and-data-sources.md`). The MP API secret already exists (created
2026-06-10, nickname `mobile-app-mp` on the web stream): the value is in `apps/mobile/.env`
(gitignored) as `GA4_MP_API_SECRET`, alongside `GA4_MEASUREMENT_ID`. Load it via Expo env
handling (`EXPO_PUBLIC_*` or app config), do not commit the value.
Keep the event names and params unchanged so web and app unify in GA4. Add an
`app_platform: 'ios' | 'android'` param so the dashboard can segment.

Use a stable pseudonymous `client_id` persisted natively (e.g. `expo-application` install ID or
a UUID in AsyncStorage). Fire-and-forget with a short timeout; never block the UI on analytics.
Queue-and-retry on failure is nice-to-have, not required for v1.

### Acceptance criteria

- [x] Starting/ending a session in the sim produces `breathing_session_start` /
      `breathing_session_end` hits in GA4 realtime (DebugView or realtime report).
- [x] Event names/params identical to web, plus `app_platform`.
- [x] Airplane mode: app works normally, no errors surfaced to the user (failure-path unit
      tests; device check stays on DAR-395).
- [x] Note the integration in `docs/runbooks/tools-and-data-sources.md` (same commit).

### Pre-ship note

Per the project rules, add an entry to `docs/PRODUCT-EXPERIMENTS.md` only if this changes
measured behavior. Instrumentation itself ships with a note in the funnel dashboard's
"data sources" section.

---

## MOB-3 — Web-only copy leaks into the app (iOS Safari help text, silent-switch banner)

**Priority: Medium. Size: S. Do before TestFlight screenshots.**

> **STATUS: DONE 2026-06-10** (Cursor Composer run, screenshots judged by Claude).
> `isNativeApp` prop added to BOTH `BreathingExperience.tsx` and upstream `Resonance.tsx`
> (default false, web unchanged) so the vendored fork stays minimally diffed. App banner now
> uses neutral volume copy; Safari paragraph suppressed in-app. Conservative copy kept until
> DAR-395 confirms silent-mode audio on device.

### Problem

Two strings written for the website's Safari context render in the native app:

1. Settings sheet sound help (`BreathingExperience.tsx:1183`):
   "iOS Safari can silence Web Audio when the ringer is off. Try the side switch/volume buttons,
   then tap Play again." Wrong on two counts in-app: it is not Safari, and the native host sets
   `playsInSilentMode: true` (`index.tsx:65-71`), so audio should survive the mute switch.
2. The runtime banner shown 4.2s after session start on iOS (`BreathingExperience.tsx:523`,
   rendered at `:1133` via phrase key `ui.sound_hint_no_audio` in `runtime-phrases.ts`):
   "If you do not hear any sound, make sure your phone is not on silent."

### Fix sketch

Add an `isNativeApp?: boolean` prop to `BreathingExperience` (the component already takes
host-context props like `forcedTheme`, `appState`). When true:

- Skip the `isIOS && soundStatus !== 'confirmed'` banner path at `:523` (or swap to app-correct
  copy: "If you do not hear any sound, raise the volume.").
- Replace the Safari paragraph at `:1183` with app-correct copy, or hide the block.

Pass `isNativeApp` from `BreathingExperience.dom.tsx` / `index.tsx`. Keep the website behavior
untouched (prop defaults to false). Mind the vendored-fork concern in DAR-396: keep the diff
against `src/components/resonance/Resonance.tsx` minimal and prop-gated.

### Dependency

DAR-395 device QA must confirm audio actually plays with the ringer off before shipping copy
that promises it. If device QA fails, fix the audio session config instead and keep a corrected
hint.

### Acceptance criteria

- [ ] No mention of "Safari" anywhere in the app UI.
- [ ] Banner either suppressed or shows app-correct copy (run a session in the sim to check).
- [ ] Website rendering unchanged (prop default false; no diff in web behavior).

---

## MOB-4 — Session completion is a dead end and stats can be silently lost

**Priority: Medium. Size: S (persistence) + M (completion moment, can split).**

> **STATUS: 4a + 4b DONE 2026-06-10.** 4b (Claude Sonnet subagent): success haptic
> (code-path verified; feel stays on DAR-395) + a calm theme-aware native summary card
> (session time, totals from the live persist stream, tap-anywhere or ~6s auto dismiss).
> Verified in dark AND light mode on the sim. Known transient nit: for ~1s the webview's own
> "SESSION COMPLETE" text shows under the fading card (doubled messaging); fixing it needs a
> reason param on the DOM contract. Same contract fires `onSessionComplete` on mid-session
> mode switch too (web credit semantics) — summary appears there as well; product call if
> that should change. 4a notes (Cursor Composer implementation + fix pass, final root-cause
> and verification by Claude). Two real bugs were found and fixed along the way:
> 1. **Async-hydration clobber** — the host initially passed an empty snapshot; the webview's
>    first commit wrote defaults over the mirror. Fixed by gating the DOM mount on
>    `snapshotReady` plus suppressing mirror emissions until the seed pass completes
>    (`shouldMirrorPersist`).
> 2. **Bridge corruption (the "blank webview")** — `@expo/dom-webview` embeds initial props in
>    an unescaped JS template literal; the snapshot's JSON-stringified values (full of `\"`)
>    corrupted the whole payload and the webview rendered nothing. Fixed by transporting
>    snapshot values `encodeURIComponent`-encoded and decoding at the seed site. See the
>    runbook gotcha below.
> Verified end to end: wiped webview storage, relaunched → idle shows the seeded non-default
> 30s chip; completed a 30s session → mirror manifest shows `sessionsCompleted` 1→2 with
> `duration: 30` intact.

### Problem

1. `handleSessionComplete` is a no-op (`index.tsx:96`). On web, completion drives the conversion
   prompt. In the app, a completed session just stops. No summary, no acknowledgement beyond the
   instruction text.
2. `totalMinutes` / `sessionsCompleted` (and settings/theme/sound-ok) live only in WKWebView
   localStorage (`BreathingExperience.tsx:12-17`, keys `resonance_stats`, `resonance_settings`,
   `resonance_theme`, `resonance_sound_ok`). iOS can evict WKWebsiteDataStore under storage
   pressure, and any future move off the DOM component orphans the data.

### Fix sketch (split into 4a and 4b)

**4a — persistence bridge (do first, cheap):** emit stats/settings changes through `onEvent`
(e.g. `onEvent('persist', { key, value })`) and mirror them into native storage
(`@react-native-async-storage/async-storage` or `expo-sqlite/kv-store`). On mount, the host
passes the persisted snapshot back in as initial props and the component seeds localStorage from
it when localStorage is empty. Native copy is the source of truth.

**4b — native completion moment:** in `handleSessionComplete(seconds)`, fire
`Haptics.notificationAsync(NotificationFeedbackType.Success)` and show a small native summary
(minutes this session, total minutes, sessions completed). Keep it calm and dismissible.
Streaks/notifications are out of scope here; if pursued, open a Linear issue first
(retention loop design).

### Acceptance criteria

- [x] 4a: complete a session: the native mirror (AsyncStorage; inspect the app sandbox via
      `xcrun simctl get_app_container <UDID> com.deepbreathing.app data`, RCTAsyncLocalStorage
      manifest) holds `resonance_stats` matching the webview values. Kill + relaunch: totals
      survive.
- [x] 4a: seed path verified: with the native mirror populated and webview localStorage
      empty, mount seeds the component from the mirror (unit test at the JS level is fine).
      Note: the mirror protects against WKWebView data eviction, NOT app reinstall — both
      stores die on uninstall. AsyncStorage 2.2.0 is already installed and in the current
      sim build (RNCAsyncStorage in Podfile.lock); no native rebuild needed.
- [x] 4b: completing a 30s session produces a success haptic event (code path verified in sim;
      feel verified on device under DAR-395) and a visible summary.
- [x] No change to website behavior.

---

## MOB-5 — Six breathing modes are unreachable in the app

**Priority: Low (v2 scope per GOAL.md). Size: M-L. Product decision needed before build.**

### Problem

Wim Hof, Tummo, Breath of Fire, Nadi Shodhana, Ujjayi, and Buteyko are hidden-unless-active in
the settings sheet (`BreathingExperience.tsx:1229-1237`), same as web. On web they are reachable
because dedicated SEO pages pass `defaultMode`. The app has no equivalent entry point. The
`initialMode` prop exists end-to-end (`BreathingExperience.dom.tsx:11`) but `index.tsx` never
passes it. Half the catalog is dead code in the app.

### Fix sketch

A mode library screen (expo-router route) listing all 12 patterns with name, color, and phase
timings from `constants.ts`, navigating to the experience with `initialMode`. This is the first
place the app can exceed the website instead of mirroring it. Needs a product pass first:
which modes are app-appropriate (Wim Hof has safety caveats), ordering, and whether the library
is the home screen or secondary.

### Acceptance criteria

- [ ] Every shipped mode reachable in 2 taps or fewer.
- [ ] Mode choice persists across launches (combine with MOB-4a).
- [ ] `mode_switch` analytics fire on selection (combine with MOB-2).

### Decision brief (drafted 2026-06-10 — owner to decide)

All 12 modes from constants.ts and their recommended v1 status:

| Mode | Pattern | Intended use | Safety caveats | v1 recommendation |
|------|---------|--------------|----------------|-------------------|
| Box | 4-4-4-4 | Focus & stress | None; foundational | **Include** — baseline mode, web SEO traffic, high confidence |
| Relax | 4-7-8 | Sleep & calming | None; well-studied | **Include** — 2nd most popular, strong web engagement, safe for all audiences |
| Coherent | 5.5-5.5 | HRV training | None; gentle | **Include** — v1 spec completes core trilogy, minimal risk |
| Sigh | Double inhale | Panic & acute reset | None; designed for emergency | **Include** — fills acute-need gap, accessible, high value-add vs web |
| Wim Hof | 30 breaths × 3 | Energy & resilience | **Hyperventilation + sustained holds.** Contraindicated: pregnancy, uncontrolled hypertension, seizure history, cardiac conditions. In water: asphyxia risk (shallow-water blackout, though rare at indoor temps). Only 2 web pages; rare mode_switch on web (3.6% → mostly Box/Relax). | **Defer to v2** — complex protocol (not a simple pattern), safety gates needed, low web demand |
| Pursed Lip | 2-4 exhale ratio | COPD & respiratory | None; respiratory rehab focused, gentle | **Include** — low barrier, respiratory use-case underserved by breathing apps, safe |
| Nadi Shodhana | 4-4-4 alternating nostril | Balance & focus | None; yoga foundation, gentle | **Defer to v2** — requires visual instruction (nostril alternation hard to convey in UI; web has a dedicated page but app can't teach the technique in text alone; revisit with a tutorial card) |
| Ujjayi | 4-6 ocean breath | Yoga & focus | None; ocean-throat sound, learnable | **Include** — yoga complement to main modes, low friction, documented in web page |
| Belly | 4-6 diaphragmatic | Breathing foundation | None; foundational, gentle | **Include** — remedial technique, valuable for users learning proper breathing mechanics |
| Buteyko | 3-3-3 nasal | Light nasal breathing | None; COPD variant (light version), very gentle | **Defer to v2** — overlaps Pursed Lip conceptually, less web demand, marginal v1 ROI |
| Tummo | 2-1 rapid shallow | Tibetan inner heat | **Rapid shallow breathing + hyperventilation.** Contraindicated: pregnancy, cardiovascular conditions, seizure history, uncontrolled asthma. Extreme version can trigger panic in susceptible users. Not a timed mode; advanced practitioners hold breath intervals manually. | **Defer to v2** — needs manual hold prompts (outside simple pattern), hyperventilation risk, esoteric, zero web pages, no mode_switch signal |
| Breath of Fire | 0.75-0.75 rapid | Kundalini energy | **Rapid hyperventilation.** Contraindicated: pregnancy, seizure history, cardiovascular conditions, uncontrolled high blood pressure. Intense sympathetic activation; can trigger dizziness/panic in unaccustomed users. | **Defer to v2** — intense hyperventilation, narrow audience, zero web pages, not searchable, risk outweighs discovery benefit |

**Ordering principle:** Group by use case (calm / focus / recovery) rather than alphabetical. Within each group, sort by safety and learning curve (simple patterns first). Suggested order: Box → Relax → Coherent (calm foundation) → Sigh (acute) → Ujjayi → Belly → Pursed Lip (focus & mechanics). This mirrors web discovery (users land on Box/Relax/Coherent pages first) and avoids dumping complex/risky modes early.

**Placement options:**

(a) **Library as secondary screen behind a button on the breathing screen.** Tapping a "library" or "modes" button navigates to a full-screen grid showing all 7 shipped modes. Pros: keeps the core loop (orb + session) the main UX affordance; library is clearly an advanced feature, reducing cognitive load on first launch. Cons: one extra tap to discover; cold-launch users may never find the library.

(b) **Library as home screen; orb one tap deep.** App launches on a mode grid. Selecting a mode navigates to the breathing experience. Pros: all 7 modes equally discoverable; every session starts with a conscious choice (boosts mode awareness). Cons: adds a screen to the core loop; users who habitually pick the same mode (likely most) get friction on every session; contradicts the web UX (orb is the entry point there).

(c) **Horizontal mode strip on the breathing screen itself.** A small carousel or pills row above or below the orb showing 3–4 "featured" modes (e.g. Box, Relax, Coherent, Sigh) with the rest behind a "More" button. Pros: modes visible without leaving the breathing context; enables mode discovery mid-session (mirrors web settings sheet). Cons: adds UI chrome to the breathing screen, risks cluttering the orb focus; small carousel is fiddly on mobile.

**Recommended: (a) Library as secondary.** The core loop (start breathing fast) is v1's competitive advantage. Web data shows `mode_switch` is rare (3.6% of starts), implying users are habitually monogamous per session. A library button keeps the default flow clean while unblocking advanced users who want to explore; when they tap library, they get full-screen focus (unlike a crowded mode strip). **One-line rationale:** prioritizes the breathing experience and shipping 7 safe modes now, over designing a home-screen reboot in v1.

**Open questions for the owner:**

1. Do you want to gate Wim Hof behind a safety disclaimer/acknowledgement (e.g. "confirm you are not pregnant") to include it in v1, or defer it entirely? (Same for Tummo / Breath of Fire if they're ever revisited.)
2. Nadi Shodhana requires visual instruction on nostril alternation — should v2 add an in-app GIF/animation tutorial, or treat it as web-only?
3. If library is secondary, should the "library" button be persistent (gear icon next to play/pause) or only visible when not running (to avoid mid-session distraction)?

---

## MOB-6 — Splash and native background are near-black regardless of theme

**Priority: Low. Size: XS. Related to DAR-400 (status-bar strip), not a duplicate.**

> **STATUS: DONE 2026-06-10** (Cursor Composer run, verified by Claude on the iPhone 17 Pro
> sim). `app.json`: default background/splash `#fdf8f2`, dark splash variant `#221711`;
> Android adaptive-icon background left dark (icon art reads better, iOS is release target).
> Native rebuild via `expo prebuild -p ios` + `expo run:ios`. Pixel-verified: settled UI hits
> the exact tokens in both modes; cold-launch frames are the splash color under the iOS launch
> zoom dim (~21% — cream reads grey-ish in raw screenshots, sample pixels before panicking).
> Both acceptance criteria checked. Device cold-launch re-check stays on the DAR-395 list.
background (`:25`), and the splash screen including its dark variant (`:41-47`). Light-mode users
get a black flash into cream on every launch. The host backdrop already themes correctly at
runtime (`index.tsx:115` — `#fdf8f2` light / `#221711` dark); only the static config lags.

### Fix sketch

Set the default splash/background to the light cream `#fdf8f2` and keep `#0b0b0f` (or better,
the real dark token `#221711`) under the `dark` splash variant. Requires a native rebuild to
verify (config is baked at build time, not OTA-able).

### Acceptance criteria

- [x] Cold launch in light mode: no black flash (sim video or eyeball).
- [x] Cold launch in dark mode: still dark.

---

## QA note for DAR-395 (no separate ticket)

During the sim run the orb read as a near-perfect circle in later screenshots, while the first
idle screenshot showed a strong blob. The morph keyframes never produce a true circle, so either
the screenshots caught near-round keyframe moments or WKWebView throttled the CSS animation.
Add to the DAR-395 device checklist: after a 5+ minute session, confirm the orb is still visibly
morphing (and `animate-hue` still cycling).

---

## Runbook for agents picking these up

- **Node:** 22 via fnm. All `apps/mobile` commands: `fnm exec --using=22 -- npm run <script>`
  from `apps/mobile`. Do NOT use the repo-root Node version.
- **Rebuild CSS after any class/source.css change:** `npm run breathing:css`
  (source: `styles/source.css` + `tailwind.config.cjs` → artifact `breathing-web.css`).
- **Run on iOS sim:** Metro may already be on :8081 (`curl localhost:8081/status`). A Debug
  build is installed on iPhone 17 Pro (UDID `910F5A6F-0A5A-47B6-84DB-8A079449BAF3`). Boot, then
  `xcrun simctl launch 910F5A6F-... com.deepbreathing.app`. Full native rebuild only needed for
  native dep / app.json changes: `fnm exec --using=22 -- npm run ios`.
- **Stale-bundle gotcha (bit two agents already):** after JS or CSS-artifact changes, the sim
  often serves the old bundle. Restart Metro with `--clear`
  (`fnm exec --using=22 -- npx expo start --port 8081 --clear`) and relaunch the app before
  concluding your change "didn't work".
- **Theme-override gotcha:** the in-app Light/Dark toggle writes a persistent localStorage
  override that beats the device theme on every later launch. If your verification toggles
  theme, restore it (or note the state you left) so the next agent's screenshots aren't
  silently themed wrong.
- **DOM-component props gotcha (cost a full debug cycle):** `@expo/dom-webview` bakes the
  initial props into an UNESCAPED JS template literal (`DomWebView.swift`,
  `setInjectedJavaScriptObject`). Any prop value whose JSON encoding contains `\"`, backslash,
  backtick, or `${` corrupts the entire payload: the webview's inline bootstrap script fails,
  `$$EXPO_DOM_HOST_OS` is never set, React mounts nothing, and the screen is blank with NO
  error overlay. Symptom pattern: Metro logs `DOM Bundled` fine but never
  `Running application "main"`. Rule: only pass escape-free scalars as DOM props; encode
  anything richer with `encodeURIComponent` (see `resonance-mirror.ts` / `persist-seed.ts`).
  Unfixed upstream as of `@expo/dom-webview` 56.0.6-canary-20260606 (checked 2026-06-10) —
  worth filing on expo/expo.
- **Blank-webview debug recipe:** (1) host-side `console.log` reaches the Metro log; webview
  console does NOT. (2) Drop a module-level beacon in the `.dom.tsx` file that appends a
  visible `<pre>` to `document.body` (plus `window.onerror`/`unhandledrejection` sinks) and
  screenshot — that works even when React never mounts and the bridge is dead. (3) A
  cream/theme-colored screen means the webview's CSS painted (bundle executed); pure host
  backdrop means the page never loaded.
- **Drive the UI headlessly:** fb-idb venv at `/tmp/idb310` (recreate:
  `/opt/homebrew/bin/python3.10 -m venv /tmp/idb310 && /tmp/idb310/bin/pip install fb-idb`).
  `PATH="/opt/homebrew/bin:$PATH" /tmp/idb310/bin/idb ui tap <x> <y> --udid <UDID>`.
  Known points (pts): orb ≈ (197, 340), gear ≈ (366, 106), sheet close ≈ (349, 121).
- **Screenshots:** `xcrun simctl io <UDID> screenshot /tmp/shot.png`.
- **Tests/typecheck:** `fnm exec --using=22 -- npm test` and `npx tsc --noEmit` in `apps/mobile`.
- **Parity rule:** anything touching `src/components/breathing-web/*` should stay minimally
  diffed against `src/components/resonance/*` (DAR-396). Prop-gate app-specific behavior;
  never fork shared visuals.
- **Context docs:** `docs/expo-attempt-2-progress.md` (state + DAR backlog),
  `apps/mobile/GOAL.md` (scope), `docs/runbooks/tools-and-data-sources.md` (GA4 identifiers).
