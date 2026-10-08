# Real Love pilot release checks

## Verified automatically

- TypeScript compilation, production build and current test suite.
- API flows use real SQLite with mocked trusted identity; permission, block, report, circle-history, photo-review, stale-account and send-time revocation cases pass.
- Latest-request gating rejects older responses after refresh/mutation/unmount.
- Dialog unit tests cover visible controls, focus wrapping/restoration, background inert state and busy Escape handling using controlled DOM objects.
- Service-worker tests confirm private APIs, photos and POSTs bypass interception; offline navigation returns a generic no-store page.

## Pending browser and device checks

Test desktop keyboard, iOS Safari and Android Chrome. Include 320px width, landscape, 200% text, 400% browser zoom and reduced-motion settings. No browser/device results have been recorded yet.

- Navigate every page with Tab/Shift+Tab/Enter; visible focus and clear control names; skip link reaches main content.
- Open profile/report dialogs; background unreachable; Escape and close work when idle; busy controls cannot dismiss; focus returns to opener.
- At narrow widths and zoom, all navigation, filters, forms, profile sections, requests and safety actions remain reachable without horizontal page scrolling.
- With the phone keyboard open, direct/group composer, errors, send and remaining text count stay reachable. Check long names and long messages.
- With VoiceOver/TalkBack or a desktop screen reader, check headings, inputs, required/error messages, loading/status notices, dialogs and message updates. Record contrast/touch-target measurements rather than inferring compliance from CSS.
- Reload, use back/forward and deep links, background/resume, disconnect/reconnect and retry. Unsent drafts remain scoped to the account/conversation; submitted actions do not duplicate.
- Confirm install/update/offline behavior on a real device. Offline screen must not display cached private content.

## Pending two-account pilot

Use two independently admitted adult test members and an independent reviewer. Access must be deliberately granted before this walkthrough; current owner-only access is unchanged. Use invented profile details and non-sensitive messages.

1. Complete profiles; discover by shared interests, city/remote and optional filters; hide/pause and confirm counterpart visibility/access.
2. Invite, withdraw, decline, accept and send messages in both directions; verify reloads and unread behavior without assuming delivery/read guarantees.
3. Propose/agree a circle; a third test member requests; host admits/removes; verify history and leave/close behavior.
4. Request reviewed photo sharing, mutually agree and revoke. Replace photo and verify new review/consent; no photos appear in discovery/circles.
5. Block/report; confirm no new contact, inaccessible private photo, retained permitted history and reviewer conflict restrictions. Never test using real abusive or intimate material.
6. Switch accounts/sign out; confirm drafts and previously visible content do not cross accounts. Exercise deletion and reviewer decisions only on disposable test accounts.

Record device/browser, date, tester, expected/actual result and reproduction steps for each failure. Fix blockers before widening access. Moderation coverage, response times and escalation ownership also need an operational rehearsal; code checks cannot validate them.

## Early-access preparation — October 5

Direct and circle sends reuse an account-and-conversation-scoped attempt identifier for an unchanged draft. SQLite primary-key conflict handling prevents concurrent retries inserting the same attempt twice; a changed body under an existing identifier is rejected. Attempts survive same-tab reload and clear on confirmed sending, sign-out, explicit draft cleanup, ending direct contact or leaving/closing a circle. Older clients without attempt identifiers retain their previous behavior and should refresh before testing. Regression checks cover direct/group retries, changed payloads, unauthorized senders and local attempt separation. No schema migration is needed.

Admission remains required. Access has not been widened; tester identities and an independent reviewer are still needed for the invited pilot. No social posts or invitations were sent. Real-device validation remains pending.

## Owner hierarchy

Owner → Reviewer → Member. Owner identity is resolved on the server from the configured owner account, never from a browser-supplied role. Owners can see and decide on all pending photos (including self and connected members), admissions and open reports despite conflicts. Reviewers retain conflict restrictions and cannot assign roles. Stale-photo tokens, expired/closed evidence, expected-account checks and audit reasons remain enforced for every role. Owner overrides replace the former universal independent-review rule. No submissions were automatically approved.

## Signup photos and conversation avatars

Optional photo selection appears in the final signup step, with review consent and a local preview. Saving first stores the profile, then uploads the selected photo; a photo failure preserves the profile and offers a retry. File selections are not persisted across reload or account changes. Pending applicants can upload with the current agreement; photo approval never admits them. Pending/admitted submitted images enter the review queue. Paused admitted and restricted accounts retain upload restrictions.

Conversation headers and accepted-chat inbox rows show a circular profile image only when the photo is approved and both participants consent to sharing. Otherwise an initial appears. Image errors fall back to the initial. Existing server checks still enforce admission, active accounts, acceptance, blocking, revocation, replacement reset and no-store responses. Tests cover pending applicant upload/review, approval without admission/sharing, and avatar rendering for shared, unapproved and revoked states. Device rendering remains unverified.

## Photo approval removed

Manual pre-sharing photo review is no longer part of signup or photo management. New uploads store photoPending=false. Migration 0010 clears the old waiting state on existing uploaded photos without changing admission, visibility, pause state or connection consent. UI says uploaded/ready to share instead of approved. The pre-review queue is removed from the visible dashboard; review of reported photo evidence and removal remain supported. Legacy review endpoints remain for historical regression compatibility, but uploads no longer enter their queue.

Validation covers sharing a new upload without approval, admission remaining pending after signup upload, mutual consent and blocked/paused account checks, and migration preserving consent values. Historical review tests explicitly seed legacy waiting records; they do not describe the new upload flow.

## Discover excludes accepted connections

The Discover candidate list excludes accepted connections, including temporarily unavailable contacts. Conversations, member profile routes and Saved retain their underlying data. Pending invitations and closed connections retain their existing behavior; demo profiles are unchanged. The list recalculates on acceptance and refresh. Regression checks cover accepted, pending, closed and new candidates without mutating the saved/profile source.
