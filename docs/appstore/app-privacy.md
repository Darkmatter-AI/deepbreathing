# App Store Connect — App Privacy (Nutrition Label)

Complete this at: App Store Connect > App > App Privacy > Data Types.

The answers below are conservative and precise. When in doubt we declare rather than omit — Apple's review does not penalise disclosure, but misrepresentation can cause rejection or removal.

---

## Step 1: Does your app collect data?

**Yes.**

---

## Step 2: Data Types Collected

### 2a. Identifiers

#### Device ID / Per-install Analytics ID

| Field | Answer |
|---|---|
| Data type | **Other Data Types > Other Device IDs** |
| Description | A randomly generated UUID stored in AsyncStorage at first launch. Used as the `client_id` for GA4 Measurement Protocol analytics. Not the IDFA. Not shared with advertisers. |
| Linked to identity | **No** — the ID is random and per-install only. It is not linked to an Apple ID, email, or any personally identifiable identifier. |
| Used for tracking | **No** — tracking under ATT means cross-app/cross-site tracking. This ID is scoped to this app only and not combined with third-party data. |
| Purposes | Analytics |

---

### 2b. Contact Information

#### Email Address

| Field | Answer |
|---|---|
| Data type | **Contact Info > Email Address** |
| Collection condition | **Only if the user voluntarily creates an account.** Guests never provide an email. |
| Linked to identity | **Yes** — email is the account identifier for authenticated users. |
| Used for tracking | **No** |
| Purposes | App Functionality (account creation, session sync, account recovery) |

#### Name

| Field | Answer |
|---|---|
| Data type | Not collected. We do not ask for a display name or full name. |

---

### 2c. Usage Data

#### App Activity (session events)

| Field | Answer |
|---|---|
| Data type | **Usage Data > App Activity** |
| Description | Session start/stop/complete events, mode chosen, duration, platform. Sent to GA4 via Measurement Protocol using the per-install client_id. For authenticated users, session events are also written to the server for cross-device stats sync. |
| Linked to identity | **No** for guests (client_id only). **Yes** for authenticated users (linked to account). |
| Used for tracking | **No** |
| Purposes | Analytics, App Functionality |

---

### 2d. Data NOT collected

The following are **not collected** and should be answered No / Not Applicable:

- Health & Fitness data (HealthKit is not used; breathing sessions are not written to Apple Health)
- Location
- Contacts
- Photos or videos
- Audio data (microphone is not used; audio is playback-only)
- Browsing history
- Search history
- Purchases or financial information
- Sensitive info
- Crash data / Diagnostics (not using Crashlytics or similar SDK in the initial release; add here if you add one later)
- IDFA / Advertising Identifier (not requested, not used, ATT not triggered)

---

## Step 3: Tracking

**Does this app track users?** No.

No data collected by this app is combined with data from other apps or websites owned by other companies for the purpose of targeted advertising or advertising measurement. ATT prompt is not shown.

---

## Step 4: Summary Table (for quick entry in ASC)

| Data Type | Collected | Linked to User | Tracking | Purposes |
|---|---|---|---|---|
| Other Device IDs (per-install UUID) | Yes | No | No | Analytics |
| Email Address | Yes (accounts only) | Yes | No | App Functionality |
| App Activity (session events) | Yes | Conditional* | No | Analytics, App Functionality |

*Linked to identity for authenticated users; not linked for guests.

---

## Notes on the Existing Privacy Page

The current `/privacy` page at `deepbreathingexercises.com/privacy` covers the web product only and mentions "Vercel Analytics and Vercel Speed Insights." Before App Store submission, add a section to that page (or create a separate mobile addendum) covering:

1. **Mobile app analytics:** Per-install random UUID sent to GA4 via Measurement Protocol. Not the IDFA. Not used for advertising.
2. **Optional accounts:** Email collected only on voluntary sign-up. Google OAuth as an alternative. Data used for session sync and account management.
3. **Audio and haptics:** Used for local playback and device feedback only. No microphone access.
4. **Data deletion:** How to delete your account (required by App Store Guidelines 5.1.1(v)).

The support URL (deepbreathingexercises.com/support) is referenced in the App Store listing and must exist before submission.
