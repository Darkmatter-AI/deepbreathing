# App Store Submission Checklist

End-to-end ordered checklist from Apple account setup to "submitted for review."
Status key: ✅ Done | ⏳ Pending | 🔲 Not started

---

## 1. Apple Developer Account

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Apple Developer Program membership active ($99/yr) | ✅ | Active via EAS credentials |
| 1.2 | Correct team selected in ASC (App Store Connect) | ✅ | M29XZH5LMJ, Reentry Systems Unipessoal Lda |

---

## 2. App Record in App Store Connect

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | New app record created in ASC | ✅ | ASC app id `6786431781` |
| 2.2 | Bundle ID registered: `com.deepbreathing.app` | ✅ | Matches `app.json` and prior TestFlight build |
| 2.3 | App name set: `Deep Breathing Exercises` | 🔲 | 24 chars — fits 30-char limit |
| 2.4 | Primary language: English (US) | 🔲 | |
| 2.5 | SKU: `deep-breathing-exercises-ios` (or similar unique string) | 🔲 | Internal only, never shown to users |

> Bundle ID is locked to `com.deepbreathing.app` by the existing App Store record and prior TestFlight build.

---

## 3. Signing & EAS Credentials

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Apple Distribution Certificate in Keychain / EAS credentials | ✅ | EAS-managed, expires July 1, 2027 |
| 3.2 | App Store Provisioning Profile for `com.deepbreathing.app` | ✅ | EAS-managed |
| 3.3 | `eas.json` `submit.production` configured | ✅ | Apple ID, ASC app id, and team id present |
| 3.4 | App-specific password or ASC API key for submission | ✅ | ASC API key stored in EAS credentials service |

```jsonc
// eas.json submit.production — add these:
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "amorim.a.ferreira@gmail.com",
        "ascAppId": "<numeric-app-id-from-asc>",
        "appleTeamId": "<TEAM_ID>"
      }
    }
  }
}
```

---

## 4. Build

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | `app.json` `version` and `ios.buildNumber` set correctly | ✅ | Version 1.0.0; build 4 queued with remote auto-increment |
| 4.2 | `ITSAppUsesNonExemptEncryption = false` in `ios.infoPlist` | ✅ | Already set in `app.json` |
| 4.3 | `PrivacyInfo.xcprivacy` added to iOS target | ✅ | Declared via `ios.privacyManifests` in `app.json` (UserDefaults CA92.1, SystemBootTime 35F9.1, FileTimestamp C617.1, DiskSpace E174.1); Expo generates the manifest at prebuild |
| 4.4 | GA4 env vars set for EAS production builds | 🔲 | **Blocker for analytics:** `.env` is gitignored and EAS cloud builds only see git-tracked files, so `EXPO_PUBLIC_GA4_MEASUREMENT_ID` / `EXPO_PUBLIC_GA4_MP_API_SECRET` are `undefined` at bundle time and `ga4-mp.ts` silently no-ops every event. Fix before building: `cd apps/mobile && set -a && source .env && set +a && npx eas env:create --environment production --name EXPO_PUBLIC_GA4_MEASUREMENT_ID --value "$EXPO_PUBLIC_GA4_MEASUREMENT_ID" --visibility plaintext --scope project --non-interactive && npx eas env:create --environment production --name EXPO_PUBLIC_GA4_MP_API_SECRET --value "$EXPO_PUBLIC_GA4_MP_API_SECRET" --visibility sensitive --scope project --non-interactive` |
| 4.5 | Ears-on audio parity pass on a real device (TestFlight or dev build) | 🔲 | 2026-07-22: mobile now runs the shared `@resonance/audio` engine natively (react-native-audio-api). Simulator-verified rendering + gain ramps; timbre/parity vs web needs human ears. Check: per-mode ambient differs (Relax=noise bed, Box=drone), cues match web, silent switch + screen lock keep audio alive. |
| 4.6 | Production build: `eas build --platform ios --profile production` | 🔲 | Creates `.ipa` and uploads to EAS |
| 4.7 | Build passes all Apple validations (check build log in EAS dashboard) | 🔲 | Privacy manifest warnings appear here |

---

## 5. App Icon

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | 1024×1024 px PNG, no alpha, no rounded corners | ⏳ | ASC applies the mask. Verify `assets/images/icon.png` meets spec |
| 5.2 | Icon does not contain Apple imagery or simulate iOS UI | ⏳ | Verify |

---

## 6. Screenshots

Apple requires screenshots for every device size you support. Required sizes (pixels at 3x):

| Device | Size | Required |
|---|---|---|
| iPhone 6.7" (Pro Max) | 1290 × 2796 px | **Required** |
| iPhone 6.5" (Plus/Max pre-14) | 1242 × 2688 px | Required (or use 6.7" shots — ASC accepts scaling for older sizes if 6.7" provided) |
| iPhone 5.5" (8 Plus and older) | 1242 × 2208 px | Required if supporting iOS 15 and earlier or if you want to support those devices explicitly |
| iPad Pro 12.9" (3rd gen+) | 2048 × 2732 px | Not required — `supportsTablet` is `false` in `app.json`. |

> ✅ Done — `supportsTablet: false` is set in `app.json` for v1.0. No iPad screenshots needed.

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | iPhone 6.7" screenshots (min 3, up to 10) | 🔲 | Capture via Simulator or real device |
| 6.2 | iPhone 6.5" screenshots | 🔲 | Can reuse 6.7" in ASC if dimensions match |
| 6.3 | iPad 12.9" screenshots (if `supportsTablet: true`) | ✅ N/A | `supportsTablet: false` — not required |
| 6.4 | Screenshots do not show status bar with wrong time/signal | 🔲 | Use Simulator's clean status bar |
| 6.5 | App Previews (optional video) | 🔲 | Not required; can skip for v1 |

---

## 7. Listing Copy

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | App name entered | 🔲 | See listing.md |
| 7.2 | Subtitle entered | 🔲 | See listing.md — pick one option |
| 7.3 | Promotional text entered | 🔲 | Can update without new build |
| 7.4 | Description entered | 🔲 | See listing.md |
| 7.5 | Keywords entered | 🔲 | See listing.md — 99 chars |
| 7.6 | Support URL: `https://deepbreathingexercises.com/support` | 🔲 | **Page must be live before submission** |
| 7.7 | Marketing URL: `https://deepbreathingexercises.com` | 🔲 | |
| 7.8 | Copyright: `© 2026 Darkmatter AI Labs` | 🔲 | |
| 7.9 | Category: Health & Fitness | 🔲 | |

---

## 8. Privacy

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | App Privacy nutrition label completed in ASC | 🔲 | See app-privacy.md for exact answers |
| 8.2 | Privacy Policy URL set in ASC | 🔲 | `https://deepbreathingexercises.com/privacy` |
| 8.3 | Privacy page updated with mobile data section | ✅ | Account, sync, analytics, device features, deletion |
| 8.4 | Support page created and live | ✅ | Account deletion instructions updated locally; deploy pending |

---

## 9. Export Compliance

| # | Task | Status | Notes |
|---|---|---|---|
| 9.1 | `ITSAppUsesNonExemptEncryption = false` in infoPlist | ✅ | Already in `app.json` — no export compliance review needed |

---

## 10. Age Rating

| # | Task | Status | Notes |
|---|---|---|---|
| 10.1 | Age rating questionnaire completed in ASC | 🔲 | Expected result: 4+. See listing.md for question-by-question answers |

---

## 11. Pricing & Availability

| # | Task | Status | Notes |
|---|---|---|---|
| 11.1 | Price: Free | 🔲 | In-app purchases not yet configured (Pro tier is future) |
| 11.2 | Availability: All territories (or select list) | 🔲 | |
| 11.3 | Release: Manual release (hold until you approve) or automatic | 🔲 | Recommend manual for first submission |

---

## 12. Build Submission

| # | Task | Status | Notes |
|---|---|---|---|
| 12.1 | Upload build to ASC via EAS: `eas submit --platform ios --profile production` | 🔲 | Requires Step 3.4 complete |
| 12.2 | Build appears in ASC under TestFlight | 🔲 | Processing takes 5–30 min |
| 12.3 | Select build in ASC version page | 🔲 | |

---

## 13. Review Notes

Review notes are shown to the App Store reviewer. Include:

```
The core breathing experience works without an account. Apple and Google sign-in are optional
and are used only to sync practice sessions and settings between the app and website. Reviewers
may use Sign in with Apple; no demo credentials are required. Users can delete an account from
the in-app account sheet; deletion is confirmed via an email link for account safety. The app's
UI is bundled locally into the binary (rendered in a local web view with no remote content
loaded). Apple sign-in uses the native ID-token flow with no web page; Google sign-in opens a
system authentication session to our own auth domain, which redirects to Google's login page.
```

> Wording verified against code 2026-07-22: deletion is initiated in-app but completed via an
> emailed confirmation link (`auth.ts` `sendDeleteAccountVerification`) — say so up front rather
> than let the reviewer discover it. The binary contains a WKWebView (Expo DOM component); the
> notes disclose it renders only bundled local content so a binary inspection doesn't look like
> a hidden remote-wrapper. Google sign-in's first page is `origin.deepbreathingexercises.com`
> (better-auth expo proxy), not Google — the old "only provider-controlled pages" phrasing was
> inaccurate.

| # | Task | Status | Notes |
|---|---|---|---|
| 13.1 | Demo account created | ✅ N/A | Optional Sign in with Apple is available to reviewers; no demo password account exists |
| 13.2 | Review notes drafted and entered in ASC | 🔲 | |

---

## 14. Submit for Review

| # | Task | Status | Notes |
|---|---|---|---|
| 14.1 | All ASC fields complete (no red warnings on version page) | 🔲 | |
| 14.2 | Click "Submit for Review" in ASC | 🔲 | |
| 14.3 | Answer additional export compliance and content rights questions if prompted | 🔲 | |

Expected review time: 1–3 business days for a first submission.

---

## Post-Submission

| # | Task | Status | Notes |
|---|---|---|---|
| 15.1 | Monitor ASC for reviewer feedback | 🔲 | Enable email notifications in ASC |
| 15.2 | If rejected: respond via Resolution Center within 24 hours | 🔲 | |
| 15.3 | Once approved: click "Release" (if manual release selected) | 🔲 | |
