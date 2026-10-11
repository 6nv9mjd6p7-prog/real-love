# Real Love iPhone build handoff

## Current status

The repository includes a Capacitor 8 iOS project in `ios/`, using bundle identifier `app.reallove.connections` and iOS 15 or newer. It preserves the existing hosted application and adds native lifecycle, keyboard, status-bar, external-browser, custom-link, launch-screen, app-icon, and permission behavior.

This is suitable for physical-device QA and an internal TestFlight milestone. It is not yet a recommended public App Store submission: `capacitor.config.ts` currently loads the deployed application with `server.url`. Capacitor documents that option for live-reload use, and Apple may reject an app that is principally a remote website wrapper. A public release should first ship a local application shell/client bundle that calls the hosted APIs. Do not remove `server.url` until that client exists; doing so now would leave only the offline fallback shell.

## Prerequisites

- macOS with the current stable Xcode and command-line tools
- Node.js 22.13 or newer and pnpm
- An Apple Developer Program team controlled by Real Love
- A deployed HTTPS version of Real Love reachable from the test phone

Never commit Apple credentials, signing certificates, provisioning profiles, API keys, or Supabase secrets.

## Open and run on an iPhone

```sh
pnpm install --frozen-lockfile
pnpm native:sync
pnpm native:open:ios
```

In Xcode:

1. Select the **App** target, then **Signing & Capabilities**.
2. Choose the Real Love Apple Developer team. Keep `app.reallove.connections` if it is available, or change both the Xcode bundle ID and `appId` in `capacitor.config.ts` before creating the App Store record.
3. Connect an iPhone, trust the development certificate when prompted, select that device, and Run.
4. Increase `CURRENT_PROJECT_VERSION` for every uploaded build and update `MARKETING_VERSION` for releases.

`pnpm native:sync` must be run after changing Capacitor dependencies, configuration, `native-shell/`, or plugin settings. Normal hosted web changes appear after deployment because this milestone loads the hosted URL.

## Required physical-device QA

- Sign in, sign out, session restoration, and switching accounts
- Record, stop, preview, cancel, send, receive, and play a voice note; deny microphone permission once and retry after enabling it in Settings
- Choose and take an optional profile photo; verify it is still hidden until both people consent, and that revocation removes access
- Direct and circle chat with the keyboard open in portrait and landscape
- Notification center behavior: in-app activity works, while the app honestly states that native phone alerts are not yet available
- `reallove://discover`, `reallove://conversations/requests`, and rejected malformed/external links
- Offline launch, return from background, external links, report/block/delete flows, Dynamic Type, VoiceOver, and reduced motion

Use two independently authenticated accounts for consent, block, report, photo, and conversation tests. Do not use production private conversations as test fixtures.

## Work still required for a public App Store release

1. Build a local Capacitor client shell instead of relying on remote `server.url`, while keeping all sensitive authorization on the existing server APIs.
2. Activate independent email sign-in from `EMAIL_SIGNIN_SETUP.md` or add Sign in with Apple. Confirm cookie/OAuth behavior inside the iOS WebView.
3. Add native APNs notifications through a chosen provider. Existing browser Web Push subscriptions cannot receive iOS native pushes. Keep notification text generic and never include private messages or photos.
4. Host an `apple-app-site-association` file on a controlled domain and add the Associated Domains capability before enabling HTTPS universal links. The private `reallove:` scheme is already restricted to known in-app routes.
5. Create the App Store Connect record, privacy policy/support URLs, privacy nutrition labels, age rating, screenshots, review notes, and a reviewer account. Confirm user-generated-content moderation, reporting, blocking, and account deletion during review.
6. Revisit the encryption declaration if cryptography beyond ordinary system TLS is added. It is currently declared as exempt.
7. Complete TestFlight testing on supported iPhone sizes and receive the final App Review decision. Only Apple can issue/sign the distributable build.

The native build hides external Ko-fi contribution links to avoid mixing donation/payment prompts into the iOS submission. This does not change web behavior or account eligibility.
