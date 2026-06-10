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

- [ ] Starting/ending a session in the sim produces `breathing_session_start` /
      `breathing_session_end` hits in GA4 realtime (DebugView or realtime report).
- [ ] Event names/params identical to web, plus `app_platform`.
- [ ] Airplane mode: app works normally, no errors surfaced to the user.
- [ ] Note the integration in `docs/runbooks/tools-and-data-sources.md` (same commit).

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

- [ ] 4a: complete a session: the native mirror (AsyncStorage; inspect the app sandbox via
      `xcrun simctl get_app_container <UDID> com.deepbreathing.app data`, RCTAsyncLocalStorage
      manifest) holds `resonance_stats` matching the webview values. Kill + relaunch: totals
      survive.
- [ ] 4a: seed path verified: with the native mirror populated and webview localStorage
      empty, mount seeds the component from the mirror (unit test at the JS level is fine).
      Note: the mirror protects against WKWebView data eviction, NOT app reinstall — both
      stores die on uninstall. AsyncStorage 2.2.0 is already installed and in the current
      sim build (RNCAsyncStorage in Podfile.lock); no native rebuild needed.
- [ ] 4b: completing a 30s session produces a success haptic event (code path verified in sim;
      feel verified on device under DAR-395) and a visible summary.
- [ ] No change to website behavior.

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

---

## MOB-6 — Splash and native background are near-black regardless of theme

**Priority: Low. Size: XS. Related to DAR-400 (status-bar strip), not a duplicate.**

### Problem

`apps/mobile/app.json` hardcodes `#0b0b0f` for the app background (`:16`), Android adaptive icon
background (`:25`), and the splash screen including its dark variant (`:41-47`). Light-mode users
get a black flash into cream on every launch. The host backdrop already themes correctly at
runtime (`index.tsx:115` — `#fdf8f2` light / `#221711` dark); only the static config lags.

### Fix sketch

Set the default splash/background to the light cream `#fdf8f2` and keep `#0b0b0f` (or better,
the real dark token `#221711`) under the `dark` splash variant. Requires a native rebuild to
verify (config is baked at build time, not OTA-able).

### Acceptance criteria

- [ ] Cold launch in light mode: no black flash (sim video or eyeball).
- [ ] Cold launch in dark mode: still dark.

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
