# App Store Submission Checklist

End-to-end ordered checklist from Apple account setup to "submitted for review."
Status key: ✅ Done | ⏳ Pending | 🔲 Not started

---

## 1. Apple Developer Account

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Apple Developer Program membership active ($99/yr) | ⏳ Verify | Must be active; check at developer.apple.com |
| 1.2 | Correct team selected in ASC (App Store Connect) | ⏳ Verify | Darkmatter AI Labs or personal account |

---

## 2. App Record in App Store Connect

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | New app record created in ASC | 🔲 | appstoreconnect.apple.com > My Apps > + |
| 2.2 | Bundle ID registered: `com.deepbreathing.app` | 🔲 | Must match `app.json`. Current value is `com.deepbreathing.resonance` — align these before building |
| 2.3 | App name set: `Deep Breathing Exercises` | 🔲 | 24 chars — fits 30-char limit |
| 2.4 | Primary language: English (US) | 🔲 | |
| 2.5 | SKU: `deep-breathing-exercises-ios` (or similar unique string) | 🔲 | Internal only, never shown to users |

> **Bundle ID conflict:** `app.json` currently uses `com.deepbreathing.resonance`. The task spec says `com.deepbreathing.app`. Decide which to use, update `app.json`, and register that exact bundle ID in the Apple Developer portal before building. This cannot be changed after the first build upload.

---

## 3. Signing & EAS Credentials

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Apple Distribution Certificate in Keychain / EAS credentials | ⏳ | `eas credentials` — EAS can auto-manage |
| 3.2 | App Store Provisioning Profile for `com.deepbreathing.app` | ⏳ | EAS auto-manages if using managed credentials |
| 3.3 | `eas.json` `submit.production` configured | ✅ | Entry exists; add `appleId` and `ascAppId` |
| 3.4 | App-specific password or ASC API key for submission | 🔲 | Needed for `eas submit`. Prefer API key (does not expire every 6 months). Set in EAS Secrets or `~/.npmrc` |

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
| 4.1 | `app.json` `version` and `ios.buildNumber` set correctly | ⏳ | EAS `autoIncrement: true` in eas.json handles build number; confirm version is `1.0.0` |
| 4.2 | `ITSAppUsesNonExemptEncryption = false` in `ios.infoPlist` | ✅ | Already set in `app.json` |
| 4.3 | `PrivacyInfo.xcprivacy` added to iOS target | 🔲 | See privacy-manifest.md for exact XML |
| 4.4 | Production build: `eas build --platform ios --profile production` | 🔲 | Creates `.ipa` and uploads to EAS |
| 4.5 | Build passes all Apple validations (check build log in EAS dashboard) | 🔲 | Privacy manifest warnings appear here |

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
| iPad Pro 12.9" (3rd gen+) | 2048 × 2732 px | Required **only** if `supportsTablet: true` — currently `true` in `app.json`. Either set to `false` or provide iPad screenshots. |

> **Recommendation:** Set `supportsTablet: false` in `app.json` for v1.0 unless the breathing orb layout is tested on iPad. Avoids the iPad screenshot requirement and reduces review surface.

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | iPhone 6.7" screenshots (min 3, up to 10) | 🔲 | Capture via Simulator or real device |
| 6.2 | iPhone 6.5" screenshots | 🔲 | Can reuse 6.7" in ASC if dimensions match |
| 6.3 | iPad 12.9" screenshots (if `supportsTablet: true`) | 🔲 | |
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
| 8.3 | Privacy page updated with mobile data section | 🔲 | See app-privacy.md notes — do not rewrite page, add a section |
| 8.4 | Support page created and live | 🔲 | `src/app/support/page.tsx` — deploy before submission |

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

> **2026-06-24 audit update:** the v1 binary has NO account/sign-in (the "optional account"
> was never built) and does NOT expose Wim Hof. So: no demo account, and do not mention a Wim
> Hof safety warning (none exists, because Wim Hof is not in v1). Corrected notes below.

```
This app requires no account or sign-in. All features (all breathing modes, audio, haptics,
timer, local stats, dark/light mode) are fully available to any user immediately on launch.
No demo credentials are needed. The app renders bundled local UI in an embedded view and does
not load any external website or allow web navigation.
```

| # | Task | Status | Notes |
|---|---|---|---|
| 13.1 | Demo account created | ✅ N/A | NOT needed — v1 ships no sign-in/account (audit 2026-06-24). Leave ASC sign-in toggle OFF, demo fields empty |
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
