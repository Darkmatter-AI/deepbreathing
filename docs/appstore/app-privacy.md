# App Store Connect — App Privacy (Nutrition Label)

> ⚠️ **2026-08-13 Build 18 update:** v1 includes optional Apple and Google sign-in
> plus cross-device practice sync. The ASC label should include User ID, Email
> Address, Name, and Product Interaction for App Functionality. Guest breathing
> and analytics-declined use remain available.

Complete this at: App Store Connect > App > App Privacy > Data Types.

The answers below are conservative and precise. When in doubt we declare rather than omit — Apple's review does not penalise disclosure, but misrepresentation can cause rejection or removal.

---

## Step 1: Does your app collect data?

**Yes.** Optional account data and signed-in practice sync are collected for
app functionality. Analytics is separately opt-in and is not collected before
the user allows it.

---

## Step 2: Data Types Collected

### 2a. Identifiers

#### Device ID / Per-install Analytics ID (optional analytics)

| Field | Answer |
|---|---|
| Data type | **Other Data Types > Other Device IDs** |
| Description | A randomly generated UUID stored in AsyncStorage only after the user chooses **Allow analytics**. Used as the `client_id` for GA4 Measurement Protocol analytics. It is removed when analytics is turned off. Not the IDFA. Not shared with advertisers. |
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

#### User ID

| Field | Answer |
|---|---|
| Data type | **Identifiers > User ID** |
| Collection condition | Only for an optional signed-in account. |
| Linked to identity | **Yes** |
| Used for tracking | **No** |
| Purposes | App Functionality (authentication and practice sync) |

#### Name

| Field | Answer |
|---|---|
| Data type | **Contact Info > Name** |
| Collection condition | Only if Apple or Google shares a name during voluntary sign-in. |
| Linked to identity | **Yes** |
| Used for tracking | **No** |
| Purposes | App Functionality (account display and management) |

---

### 2c. Usage Data

#### Product Interaction (session events)

| Field | Answer |
|---|---|
| Data type | **Usage Data > Product Interaction** |
| Description | Session start/stop/complete events, mode chosen, duration, and platform. Sent to GA4 via the server Measurement Protocol proxy only after analytics consent. For authenticated users, session events are also written to the server for cross-device stats sync. |
| Linked to identity | **Yes** for authenticated users (sync is linked to the account); analytics events are pseudonymous. |
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
| Other Device IDs (per-install UUID) | Only after analytics opt-in | No | No | Analytics |
| User ID | Yes (accounts only) | Yes | No | App Functionality |
| Email Address | Yes (accounts only) | Yes | No | App Functionality |
| Name | Yes (accounts only, if provider shares it) | Yes | No | App Functionality |
| Product Interaction (session events) | Yes | Yes for signed-in sync; analytics is opt-in | No | Analytics, App Functionality |

Analytics consent is requested on first launch. The native app’s **Privacy**
control reopens the choice at any time; choosing **Turn analytics off** stops
future analytics requests and deletes the local analytics ID. Declining or
withdrawing consent does not disable breathing, local stats, audio, haptics, or
optional account sync.

---

## Notes on the Existing Privacy Page

The current `/privacy` page at `deepbreathingexercises.com/privacy` covers the web product only and mentions "Vercel Analytics and Vercel Speed Insights." Before App Store submission, add a section to that page (or create a separate mobile addendum) covering:

1. **Mobile app analytics:** Optional, consent-gated usage events sent through a server-held GA4 Measurement Protocol proxy. The per-install random UUID is created only after opt-in and removed on withdrawal. It is not the IDFA and is not used for advertising.
2. **Optional accounts:** Email and provider-shared name collected only on voluntary Apple or Google sign-in. Data used for session sync and account management.
3. **Audio and haptics:** Used for local playback and device feedback only. No microphone access.
4. **Data deletion:** How to delete your account (required by App Store Guidelines 5.1.1(v)).

The support URL (deepbreathingexercises.com/support) is referenced in the App Store listing and must exist before submission.
