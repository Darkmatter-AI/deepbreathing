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
| 2.3 | App name set: `Deep Breathing: Calm & Sleep` | ✅ | Verified in ASC 2026-07-28 (listing-FINAL name, not the old 2.3 draft) |
| 2.4 | Primary language: English (US) | ✅ | Verified in ASC 2026-07-28 |
| 2.5 | SKU: `deep-breathing-exercises-ios` | ✅ | Verified in ASC 2026-07-28 |

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
| 4.1 | `app.json` version and remote iOS build number are correct | ✅ | Version 1.0.0; production auto-increment assigned Build 17. |
| 4.2 | `ITSAppUsesNonExemptEncryption = false` in `ios.infoPlist` | ✅ | Already set in `app.json` |
| 4.3 | `PrivacyInfo.xcprivacy` added to iOS target | ✅ | Declared via `ios.privacyManifests` in `app.json` (UserDefaults CA92.1, SystemBootTime 35F9.1, FileTimestamp C617.1, DiskSpace E174.1); Expo generates the manifest at prebuild |
| 4.4 | GA4 env vars set for EAS production builds | ✅ | Done 2026-07-28: `EXPO_PUBLIC_GA4_MEASUREMENT_ID` (G-53DLCBMRL3, plaintext) and `EXPO_PUBLIC_GA4_MP_API_SECRET` (sensitive) created in the EAS `production` environment. Builds ≤10 shipped with analytics no-oping; build 11 is the first with live GA4. |
| 4.5 | Ears-on audio parity pass on a real device (TestFlight or dev build) | ⏳ | 2026-07-22: shared `@resonance/audio` engine runs natively (react-native-audio-api). RNAA setTargetAtTime warble found+fixed (8265f7b); Abi confirmed by ear in the simulator that mobile now sounds like the website. Remaining on-device: silent switch, screen lock/background continuity, phone-speaker balance. |
| 4.6 | Production build: `eas build --platform ios --profile production` | ✅ | Build 17 completed 2026-08-10 from clean release commit `bb9ff53` in `/Users/abi/Sites/deepbreathing-ios-v1-release`. EAS build id: `f3588d16-eb73-4120-8164-793f0632c2c5`. |
| 4.7 | Build passes all Apple validations (check build log in EAS dashboard) | ✅ | Build 17 finished successfully, uploaded successfully, and processed in App Store Connect as ready to submit. No blocking validation warning was shown. |

---

## 5. App Icon

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | 1024×1024 px PNG, no alpha, no rounded corners | ✅ | Verified 2026-07-28 via `sips`: 1024×1024, hasAlpha: no |
| 5.2 | Icon does not contain Apple imagery or simulate iOS UI | ✅ | Custom orb artwork |

---

## 6. Screenshots

Apple requires screenshots for every device size you support. Accepted current iPhone sizes include:

| Device | Size | Required |
|---|---|---|
| iPhone 6.9" | 1260 × 2736, 1290 × 2796, or 1320 × 2868 px | Optional when a valid 6.5" set is supplied |
| iPhone 6.5" (Plus/Max pre-14) | 1242 × 2688 or 1284 × 2778 px | Required when no 6.9" set is supplied; this release uses 1284 × 2778 |
| iPhone 5.5" (8 Plus and older) | 1242 × 2208 px | Required if supporting iOS 15 and earlier or if you want to support those devices explicitly |
| iPad Pro 12.9" (3rd gen+) | 2048 × 2732 px | Not required — `supportsTablet` is `false` in `app.json`. |

> ✅ Done — `supportsTablet: false` is set in `app.json` for v1.0. No iPad screenshots needed.

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | iPhone screenshots (min 3, up to 10) | ✅ | Six current RGB/no-alpha 1284×2778 marketing shots uploaded 2026-08-10 and verified in ASC in order 01→06. |
| 6.2 | iPhone 6.5" screenshots | ✅ | Refreshed 1284×2778 set is live in the accepted 6.5" slot. |
| 6.3 | iPad 12.9" screenshots (if `supportsTablet: true`) | ✅ N/A | `supportsTablet: false` — not required |
| 6.4 | Screenshots do not show status bar with wrong time/signal | ✅ | Composited marketing mockups |
| 6.5 | App Previews (optional video) | 🔲 | Not required; can skip for v1 |

---

## 7. Listing Copy

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | App name entered | ✅ | Verified in ASC 2026-07-28: "Deep Breathing: Calm & Sleep" |
| 7.2 | Subtitle entered | ✅ | Verified 2026-07-28: "Box, 4-7-8 & Calm Breathing" |
| 7.3 | Promotional text entered | ✅ | Verified 2026-07-28 (163/170 chars) |
| 7.4 | Description entered | ✅ | Verified 2026-07-28 (2017/4000 chars, matches listing-FINAL) |
| 7.5 | Keywords entered | ✅ | Verified 2026-07-28 (98/100 chars, matches listing-FINAL) |
| 7.6 | Support URL: `https://deepbreathingexercises.com/support` | ✅ | Entered in ASC; page live (HTTP 200) |
| 7.7 | Marketing URL: `https://deepbreathingexercises.com` | ✅ | Entered in ASC |
| 7.8 | Copyright: `© 2026 Darkmatter AI Labs` | ✅ | Entered in ASC |
| 7.9 | Category: Health & Fitness (secondary: Lifestyle) | ✅ | Verified in ASC 2026-07-28 |

---

## 8. Privacy

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | App Privacy nutrition label completed in ASC | ✅ | Republished 2026-07-28 per app-privacy.md account update: added Name + Email (App Functionality, linked), Product Interaction now linked + App Functionality purpose; Device ID unchanged (Analytics, not linked); tracking No everywhere |
| 8.2 | Privacy Policy URL set in ASC | ✅ | `https://deepbreathingexercises.com/privacy` — verified in ASC 2026-07-28 |
| 8.3 | Privacy page updated with mobile data section | ✅ | Account, sync, analytics, device features, deletion |
| 8.4 | Support page created and live | ✅ | Verified live (HTTP 200) 2026-07-28, incl. /privacy. Prod better-auth + Google social sign-in endpoints also verified live 2026-07-28 |

---

## 9. Export Compliance

| # | Task | Status | Notes |
|---|---|---|---|
| 9.1 | `ITSAppUsesNonExemptEncryption = false` in infoPlist | ✅ | Already in `app.json` — no export compliance review needed |

---

## 10. Age Rating

| # | Task | Status | Notes |
|---|---|---|---|
| 10.1 | Age rating questionnaire completed in ASC | ✅ | Verified 2026-08-10: **Health or Wellness Topics = Yes** and **Medical or Treatment Information = None/No**. ASC shows 9+ in 172 countries/regions, 12+ in Brazil and Vietnam, and All in South Korea; older operating systems use the legacy rating. |

---

## 11. Pricing & Availability

| # | Task | Status | Notes |
|---|---|---|---|
| 11.1 | Price: Free | ✅ | Verified 2026-07-28: $0.00 across all 175 regions |
| 11.2 | Availability: All territories | ✅ | 175 regions available |
| 11.3 | Release: Manual release | ✅ | "Lançar manualmente" selected on version page |

---

## 12. Build Submission

| # | Task | Status | Notes |
|---|---|---|---|
| 12.1 | Upload the release build to App Store Connect | ✅ | Build 17 uploaded through EAS Submit on 2026-08-10; submission id `c3f5b3ca-e230-4890-9589-1fc9b24896c7`. |
| 12.2 | Build appears in App Store Connect/TestFlight | ✅ | Build 17 processed successfully and appeared as ready to submit. |
| 12.3 | Select the release build on the version page | ✅ | Replaced Build 14 with Build 17 and saved the version page on 2026-08-10. |

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
| 13.1 | Demo account created | ✅ N/A | Optional Sign in with Apple is available to reviewers; no demo password account exists. "Sign-in required" toggle verified OFF; contact info filled |
| 13.2 | Review notes drafted and entered in ASC | ✅ | Entered + saved 2026-07-28 (replaced the stale "no sign-in exists" paragraph) |

---

## 14. Submit for Review

| # | Task | Status | Notes |
|---|---|---|---|
| 14.1 | All ASC fields complete (no red warnings on version page) | ✅ | Metadata, six screenshots, review notes, Build 17, 9+ rating, trader declaration, and not-a-regulated-medical-device declaration verified. |
| 14.2 | Click "Submit for Review" in ASC | ✅ | Submitted 2026-08-10. ASC submission `3668ff50-60a3-4efd-8623-deff0100f8c1` is **Waiting for Review**. Manual release remains selected. |
| 14.3 | Answer additional export compliance and content rights questions if prompted | ✅ | No additional prompt appeared. Content rights already state that the app does not contain or access third-party content; `ITSAppUsesNonExemptEncryption` is false. |

Expected review time: 1–3 business days for a first submission.

---

## Post-Submission

| # | Task | Status | Notes |
|---|---|---|---|
| 15.1 | Monitor ASC for reviewer feedback | 🔲 | Enable email notifications in ASC |
| 15.2 | If rejected: respond via Resolution Center within 24 hours | 🔲 | |
| 15.3 | Once approved: click "Release" (if manual release selected) | 🔲 | |
