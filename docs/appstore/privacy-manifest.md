# Privacy Manifest — PrivacyInfo.xcprivacy

Apple requires a `PrivacyInfo.xcprivacy` file in the app bundle for any app that uses "required reason" APIs.
For Expo-managed projects the file lives at:

```
apps/resonance-mobile-app/ios/DeepBreathing/PrivacyInfo.xcprivacy
```

If the `ios/` directory is not committed (bare workflow not yet run), place the file at the Expo config plugin level and verify it appears in the final build with `eas build --platform ios`.

---

## Required Reason API Analysis

### APIs used by this Expo app and its dependencies

| API category | Used by | Reason code | Justification |
|---|---|---|---|
| `NSUserDefaults` | `AsyncStorage` reads/writes settings and stats | `CA92.1` | Accessing user defaults to read and write app-level settings and session data that the user created within this app |
| `System boot time` | `expo-haptics`, React Native internals (uptime calculations) | `35F9.1` | Calculating time intervals within the app for animation timing and session duration; not used to derive a device fingerprint |
| `File timestamps` | `expo-file-system` (transitive dep) | `C617.1` | Managing local cache files created by the app itself |
| `Disk space` | Expo bundler runtime | `E174.1` | Determining whether sufficient space is available to store local session data |

**Verify before submission:** Run `npx expo-doctor` and review the `--platform ios` build log for any additional required-reason API warnings from SDK dependencies. EAS Build will flag missing declarations.

---

## Literal XML to Paste

Create (or replace) the file at `apps/resonance-mobile-app/ios/DeepBreathing/PrivacyInfo.xcprivacy` with exactly:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>

  <!-- ═══════════════════════════════════════════════════
       TRACKING
       ═══════════════════════════════════════════════════ -->

  <!-- This app does NOT track users across apps/websites for advertising. -->
  <key>NSPrivacyTracking</key>
  <false/>

  <!-- ═══════════════════════════════════════════════════
       TRACKING DOMAINS
       (none — we do not send data to advertising networks)
       ═══════════════════════════════════════════════════ -->

  <key>NSPrivacyTrackingDomains</key>
  <array/>

  <!-- ═══════════════════════════════════════════════════
       COLLECTED DATA TYPES
       ═══════════════════════════════════════════════════ -->

  <key>NSPrivacyCollectedDataTypes</key>
  <array>

    <!-- 1. Per-install analytics ID (random UUID in AsyncStorage, GA4 client_id) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeDeviceID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
      </array>
    </dict>

    <!-- 2. Email address — only if user creates an account (optional) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>

    <!-- 3. App activity (session events: mode, duration, completed) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeAppInteractions</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>

  </array>

  <!-- ═══════════════════════════════════════════════════
       REQUIRED REASON APIs
       ═══════════════════════════════════════════════════ -->

  <key>NSPrivacyAccessedAPITypes</key>
  <array>

    <!-- NSUserDefaults — AsyncStorage uses NSUserDefaults on iOS -->
    <!-- CA92.1: read/write user-generated or app-created data in user defaults -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>

    <!-- System boot time — used by React Native and Expo internals for uptime/timing -->
    <!-- 35F9.1: calculating time intervals within the app (not for fingerprinting) -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>35F9.1</string>
      </array>
    </dict>

    <!-- File timestamps — expo-file-system and bundler cache management -->
    <!-- C617.1: managing files created by the app itself -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>

    <!-- Disk space — Expo runtime checks for storage availability -->
    <!-- E174.1: displaying disk space to the user or making storage decisions -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>E174.1</string>
      </array>
    </dict>

  </array>

</dict>
</plist>
```

---

## Entry-by-entry justifications

| API | Reason Code | Why this code |
|---|---|---|
| `NSUserDefaults` (`CA92.1`) | Accessing user defaults to read and write data that the user created within this app | AsyncStorage persists settings (mode, speed, haptics, muted, theme) and session stats (total minutes, completed sessions). All written by this app for this app's own use. |
| `SystemBootTime` (`35F9.1`) | Calculate how much time has elapsed between events | React Native and Expo use `process.hrtime()` / `performance.now()` which internally reads the system boot clock. Used for animation frame timing and session duration. Not used to fingerprint the device. |
| `FileTimestamp` (`C617.1`) | Managing files created by the app | `expo-file-system` and Metro bundler cache reference file modification timestamps. All files are app-created local cache, not user media. |
| `DiskSpace` (`E174.1`) | Checking available disk capacity before writing session data | Expo and React Native runtime check available space before writing to avoid crashes on full disks. |

---

## Notes

- `NSPrivacyTracking` is `false`. ATT is not triggered and IDFA is not accessed.
- `NSPrivacyTrackingDomains` is empty. GA4 Measurement Protocol calls go to `www.google-analytics.com` but this is analytics, not cross-app tracking for advertising — no ATT domain entry needed.
- If you later add Crashlytics, Sentry, or a third-party ad SDK, revisit both this file and the app-privacy.md nutrition label.
- Apple's privacy manifest validation runs during TestFlight upload. Check the build report; it will list any required-reason API usage that lacks a declared reason code.
