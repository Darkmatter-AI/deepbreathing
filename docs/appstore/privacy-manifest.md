# Privacy Manifest — `PrivacyInfo.xcprivacy`

The Expo config at [`apps/mobile/app.json`](../../apps/mobile/app.json) is the
source of truth for the app privacy manifest. Expo SDK 56 writes these values
to the iOS app bundle during prebuild/EAS Build.

## Collected data declarations

These are Apple’s valid `NSPrivacyCollectedDataType` enum values and match the
current app behavior:

| Manifest value | What the app does | Linked | Tracking | Purpose |
|---|---|---:|---:|---|
| `NSPrivacyCollectedDataTypeDeviceID` | Random per-install analytics UUID, created only after the user opts in; removed when analytics is turned off | No | No | Analytics |
| `NSPrivacyCollectedDataTypeUserID` | Account identifier used to authenticate and sync an optional account | Yes | No | App Functionality |
| `NSPrivacyCollectedDataTypeName` | Name optionally shared by Apple or Google sign-in | Yes | No | App Functionality |
| `NSPrivacyCollectedDataTypeEmailAddress` | Email used for optional account access and recovery | Yes | No | App Functionality |
| `NSPrivacyCollectedDataTypeProductInteraction` | Session/mode/duration activity; optional GA4 analytics and signed-in practice sync | Yes | No | Analytics, App Functionality |

`NSPrivacyCollectedDataTypeProductInteraction` is Apple’s enum for product
interaction and is the value used in `app.json`.

The app does not use IDFA, does not request App Tracking Transparency, and does
not track users across apps or websites. `NSPrivacyTracking` remains `false`
and `NSPrivacyTrackingDomains` remains an empty array.

## Required-reason APIs

The current required-reason declarations remain:

| API category | Reason |
|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` — app-created settings/session data in AsyncStorage |
| `NSPrivacyAccessedAPICategorySystemBootTime` | `35F9.1` — calculate in-app timing intervals |
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `C617.1` — manage files created by the app |
| `NSPrivacyAccessedAPICategoryDiskSpace` | `E174.1` — make storage decisions |

## Build verification

Run the Expo config check and inspect the generated manifest in an iOS build:

```bash
npx expo config --type public --json
npx expo prebuild --platform ios --no-install
```

Before submission, inspect the generated `ios/**/PrivacyInfo.xcprivacy` and
confirm that every `NSPrivacyCollectedDataType` value is one of Apple’s
documented enums. Do not commit generated `ios/` output for this managed app.
