# iOS 1.0.1 privacy correction

Apple rejected build 21 on September 10, 2026 under Guideline 5.1.2(i).
Submission ID: `25d9e328-3741-464a-b019-843bcbc7a83a`.

## Target

- App: Deep Breathing: Calm & Sleep
- App Store Connect app: `6786431781`
- Bundle: `com.deepbreathing.app`
- Apple team: `M29XZH5LMJ`, Reentry Systems Unipessoal Lda
- Expo owner: `abiabiassi`
- Expo project: `c5bbb03a-2e8d-44fd-90a6-fe6ab08197a4`
- Source checkout: `/Users/abi/work/deepbreathing-ios-no-tracking`
- Branch: `fix/ios-remove-tracking`
- Base: `4dd1c69b29f20dc510e17b362f4bcec101ac7549`

## Correction

Metro resolves `ga4-mp.ios.ts` for iOS. That module has no analytics endpoint,
identifier creation, or network transport. It deletes the previous analytics
identifier and saved consent. The host does not display the custom analytics
prompt or the control that reopens it. Web and Android analytics stay unchanged.

Guest practice and settings remain local. Optional sign-in and practice sync
still collect account data for app functionality. The app does not use IDFA,
advertising attribution, or tracking across other companies' apps and websites.

## Current iOS App Privacy answers

Data collection remains **Yes** because of optional accounts and practice sync.
Tracking remains **No**. Remove the per-install analytics Device ID declaration
and remove Analytics from Product Interaction's purposes.

| Data type | Collection | Linked to user | Tracking | Purpose |
|---|---|---|---|---|
| User ID | Optional accounts | Yes | No | App Functionality |
| Email Address | Optional accounts | Yes | No | App Functionality |
| Name | Optional account provider supplies it | Yes | No | App Functionality |
| Product Interaction | Signed-in practice sync | Yes | No | App Functionality |

Recheck the saved App Store Connect label before submission. The new iOS policy
is `public/ios-privacy.html`, linked from the iOS account sheet. Deploy it through
the GitHub main workflow and verify `https://deepbreathingexercises.com/ios-privacy.html`
before building and resubmitting. Set the iOS App Store Connect Privacy Policy
URL to that address. The existing `/privacy` page stays available for the website.

The project production provenance guard requires separate authorization for a
web production deployment. The mobile resubmission request does not grant it.

## Review Notes draft

Use this text only after the exact candidate has passed verification:

> This update removes usage analytics and the custom analytics permission prompt
> from the iOS app. The iOS app no longer creates or sends analytics identifiers
> or usage analytics events, including for users who previously opted in.
> Existing local analytics identifiers and preferences are deleted on launch.
> The app does not track users across other companies' apps or websites and does
> not use the advertising identifier. No tracking permission request is present.
> Optional Apple and Google sign-in remain available solely for account access
> and practice sync. Guest breathing, local stats, audio, and haptics work without
> sign-in. The UI is bundled locally and rendered in an Expo DOM web view.

## Release record

- Source commit: pending
- Native launch and settings screenshots: pending
- Production EAS build and build number: pending
- App Store processing: pending
- App Privacy readback: pending
- Review Notes saved: pending
- Resubmission status: not submitted
- Release timing: preserve the existing manual release setting
