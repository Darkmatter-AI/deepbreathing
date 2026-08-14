# App Store Submission Checklist — Build 18 correction

End-to-end ordered checklist from Apple account setup to a manually held Build 18 submission.
Status key: ✅ Done | ⏳ Pending | 🔲 Not started | 🚫 Blocked

> **Build 18 is a new candidate, not a production action.** Build 17 is historical evidence
> only and must not be reused as the selected binary, screenshot source, or proof that the
> corrected metadata passed review. Do not upload, submit, or release anything while the
> physical-device gate and the support-page deployment below are pending.

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
| 2.6 | Regulated Medical Device status declared | ⏳ | For a new Health & Fitness app, answer the App Store Connect declaration before submission. This app is not represented as a regulated medical device, so select **No** after owner confirmation and retain a screenshot of the saved answer. |
| 2.7 | EU Digital Services Act trader status confirmed | ⏳ | Confirm the legal entity's trader/non-trader status in ASC and complete any required contact verification before distribution in the EU. Do not infer or change this account-level declaration from repository data. |

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
| 4.1 | `app.json` version and remote iOS build number are correct | ⏳ | Version 1.0.0 remains the candidate version. Build 18 must be created by EAS remote auto-increment and recorded with its EAS build id and source commit; Build 17 is superseded. |
| 4.2 | `ITSAppUsesNonExemptEncryption = false` in `ios.infoPlist` | ✅ | Already set in `app.json` |
| 4.3 | `PrivacyInfo.xcprivacy` added to iOS target | ✅ | Declared via `ios.privacyManifests` in `app.json` (UserDefaults CA92.1, SystemBootTime 35F9.1, FileTimestamp C617.1, DiskSpace E174.1); Expo generates the manifest at prebuild |
| 4.4 | GA4 relay credentials migrated and exposed client secret rotated | ⏳ | Before Build 18: deploy `/api/v1/analytics` with server-only `GA4_MEASUREMENT_ID` and a newly rotated `GA4_MP_API_SECRET`; remove the obsolete `EXPO_PUBLIC_GA4_*` values from EAS. Build 17 embedded the previous secret, so it must be treated as public and revoked. Verify the consented relay path and the opt-out path without logging the replacement secret. |
| 4.5 | Ears-on audio parity pass on a real device (TestFlight or dev build) | ⏳ | Build 18 gate required: verify speaker balance, silent switch, background/lock continuity, cue timing, mute, and haptics on a physical iPhone. Simulator evidence is not sufficient. |
| 4.6 | Production build: `eas build --platform ios --profile production` | ⏳ | Run only after the CI gate is green and the worktree is clean. Record the Build 18 EAS build id, source commit, Expo SDK, and artifact checksum here; do not generate screenshots in this step. |
| 4.7 | Build passes all Apple validations (check build log in EAS dashboard) | ⏳ | Confirm the Build 18 artifact processes successfully before selecting it. Record warnings and their disposition; a successful Build 17 upload does not satisfy this row. |

---

## Build 18 physical-device gate (required before screenshots or ASC entry)

Run this gate against the exact Build 18 artifact on at least one physical iPhone. A simulator
pass is useful during development but cannot close this gate. Record the device model, iOS
version, Build 18 number, test date, tester, and any EAS/TestFlight diagnostic link.

| Area | Pass condition | Evidence to record |
|---|---|---|
| Fresh install / launch | Installs from the candidate artifact, shows the real icon, and reaches the breathing screen without a redbox or fatal error | Device + OS + build number; launch result |
| Guest session | Core flow works without sign-in; start, pause, resume, stop, and completion behave as labeled | One completed session and one interrupted session |
| Durations | Duration selector exposes **1, 3, 5, and 10 minutes**; no 30-second or open-ended store promise is visible | Device capture of the selector; observed auto-stop |
| Audio / haptics | Cue timing, mute, speaker balance, silent switch, background/lock continuity, and phase haptics match the intended behavior | Ears-on notes; silent-switch and lock-screen results |
| Settings / persistence | Speed, mode, duration, mute, theme, and keep-awake choices persist across a relaunch where intended | Before/after values; relaunch result |
| Account (optional) | Apple/Google sign-in remains optional; signed-in sync and account deletion handoff work if exercised | Provider path and deletion confirmation result; no demo password invented |
| Accessibility | With VoiceOver enabled, all primary breathing controls and changing phase guidance are discoverable and operable; repeat at the largest supported Dynamic Type size and with Reduce Motion enabled | VoiceOver focus/order notes, phase announcement result, large-text captures, and Reduce Motion result from the physical device |
| Copy / safety | No clinical outcome promise, no Wim Hof claim, and the safety disclaimer remains visible in the reviewed surfaces | Wording checklist + reviewer notes |

**Stop conditions:** any crash, redbox, broken audio/haptics, duration mismatch, mandatory sign-in,
or health-outcome promise blocks screenshots and ASC entry. Fix or explicitly disposition the
issue, then rerun the whole gate on the final artifact.

## Rollback and observability decisions

- **Release control:** keep App Store Connect on manual release. Do not click Release while
  Build 18 is under observation. No production or App Store action is part of this checklist change.
- **Rollback:** if Build 18 fails review or the post-submit smoke check, stop the manual release and
  use the last approved binary only if the owner confirms it is still available in ASC. Do not use
  an OTA update to paper over a native binary, privacy, entitlement, or store-metadata problem;
  prepare a new EAS build instead.
- **Observation window:** for the first 24 hours after an owner-approved release, check launch,
  session-start, session-end, completion, sign-in/sync, and support-route signals at least once
  per business day. Compare event volume with the pre-release baseline and record the EAS/ASC
  build number beside each check.
- **Limits:** the initial app has no crash-reporting service in this repository. Treat missing
  analytics as an observability gap, not evidence of zero crashes; use TestFlight feedback,
  reviewer messages, and device reproduction logs as additional signals.

## Support contact deployment (blocking)

`deepbreathingexercises.com` currently has no MX record. It can serve the support web route, but
mail sent to an `@deepbreathingexercises.com` address cannot reach a human. The candidate source now
uses the established receiving mailbox `hi@abiassi.com`; DNS inspection on 2026-08-13 confirmed
that `abiassi.com` has inbound MX. The currently deployed support page still advertises the old,
non-receiving address, so this gate remains blocked until the web change is deployed and a fresh
read of `https://deepbreathingexercises.com/support` confirms the new `mailto:` target.

**Decision:** ✅ receiving address selected and generated content updated. **Deployment:** 🚫 pending.

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
| 6.1 | iPhone screenshots (min 3, up to 10) | 🚫 | Existing checked-in captures and marketing compositions are pre-gate references. Do not upload or call them final. Capture a fresh set only after the Build 18 physical-device gate. |
| 6.2 | iPhone 6.5" screenshots | ⏳ | Target 1284×2778 (or another accepted 6.5" size) from the approved Build 18 binary. Verify the timer chips read 1/3/5/10 minutes and match the listing. |
| 6.3 | iPad 12.9" screenshots (if `supportsTablet: true`) | ✅ N/A | `supportsTablet: false` — not required |
| 6.4 | Screenshots do not show status bar with wrong time/signal | ⏳ | Check the fresh device captures and record the device/OS/build used. Composited marketing mockups are not proof of this row. |
| 6.5 | App Previews (optional video) | 🔲 | Not required; can skip for v1 |

---

## 7. Listing Copy

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | App name entered | ⏳ | Existing ASC value is historical evidence only; recheck the Build 18 draft after the gate. |
| 7.2 | Subtitle entered | ⏳ | Existing ASC value is historical evidence only; recheck the Build 18 draft after the gate. |
| 7.3 | Promotional text entered | ⏳ | Existing ASC value is historical evidence only; recheck the Build 18 draft after the gate. |
| 7.4 | Description entered | ⏳ | Use the gated Build 18 draft only after physical-device and wording review; do not copy the historical `listing.md` feature block. |
| 7.5 | Keywords entered | ⏳ | Recheck the final 100-character field against the approved Build 18 copy before entry. |
| 7.6 | Support URL: `https://deepbreathingexercises.com/support` | 🚫 | Candidate source uses the receiving `hi@abiassi.com` mailbox, but the live page still advertises the non-receiving branded address. Deploy and verify the new `mailto:` before metadata entry. |
| 7.7 | Marketing URL: `https://deepbreathingexercises.com` | ⏳ | Recheck the URL and its current deployment immediately before Build 18 metadata entry. |
| 7.8 | Copyright: `© 2026 Darkmatter AI Labs` | ⏳ | Owner must confirm the ASC legal entity / configured DBA before entering this field. |
| 7.9 | Category: Health & Fitness (secondary: Lifestyle) | ✅ | Verified in ASC 2026-07-28 |

---

## 8. Privacy

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | App Privacy nutrition label completed in ASC | ⏳ | Recheck the existing label against the Build 18 binary and `app-privacy.md` before entry; no ASC change is made by this checklist. |
| 8.2 | Privacy Policy URL set in ASC | ✅ | `https://deepbreathingexercises.com/privacy` — verified in ASC 2026-07-28 |
| 8.3 | Privacy page updated with mobile data section | ✅ | Account, sync, analytics, device features, deletion |
| 8.4 | Support page created and live | ⏳ | Route is present in the source tree; verify the public URL immediately before submission. The apex no-MX blocker affects replies, not route rendering. |

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

## 12. Build 18 Submission (manual; pending)

| # | Task | Status | Notes |
|---|---|---|---|
| 12.1 | Upload Build 18 to App Store Connect | ⏳ | Only after CI, the clean-commit guard, the physical-device gate, and support-page deployment pass. Do not perform this upload as part of the docs change. |
| 12.2 | Build 18 appears in App Store Connect/TestFlight | ⏳ | Record processing result, warnings, build id, and source commit. Build 17 processing is historical and does not satisfy this row. |
| 12.3 | Select Build 18 on the version page | ⏳ | Manual release remains required. Select only the processed Build 18 artifact after metadata and fresh screenshots are verified. |

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
| 13.1 | Demo account created | ✅ N/A | Optional Sign in with Apple is the review path; no demo password account exists. Recheck the optional sign-in flow on Build 18; do not claim a login wall. |
| 13.2 | Review notes drafted and entered in ASC | ⏳ | Draft is retained here for Build 18 review. Enter only after the physical-device gate; no ASC mutation is made by this checklist. |

---

## 14. Submit Build 18 for Review (manual; pending)

| # | Task | Status | Notes |
|---|---|---|---|
| 14.1 | All ASC fields complete (no red warnings on version page) | 🚫 | Blocked until the Build 18 physical-device gate, fresh screenshots, wording review, and support-page deployment are complete. |
| 14.2 | Click "Submit for Review" in ASC | ⏳ | Manual release only. This checklist does not submit anything; record the future Build 18 submission id and timestamp if the owner approves. |
| 14.3 | Answer additional export compliance and content rights questions if prompted | ⏳ | Recheck against the Build 18 artifact. `ITSAppUsesNonExemptEncryption` remains false in source; no production state is changed here. |

Do not estimate review time until Build 18 is actually submitted.

---

## Post-Submission

| # | Task | Status | Notes |
|---|---|---|---|
| 15.1 | Monitor ASC for reviewer feedback | 🔲 | Enable email notifications in ASC |
| 15.2 | If rejected: respond via Resolution Center within 24 hours | 🔲 | |
| 15.3 | Once approved: click "Release" (if manual release selected) | 🔲 | |
