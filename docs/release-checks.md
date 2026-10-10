# Real Love pilot release checks

## Validated places and nearby radius — October 10, 2026

- Profile location entry now searches real cities, towns, and general areas through the app server using OpenStreetMap-backed Photon. Search waits 450 ms after typing, requires at least three characters, returns at most eight normalized suggestions, rate-limits signed-in members, and caches repeated queries in the running server process. Typed text alone does not change the profile; the member must choose a returned place.
- A selected place stores the broad city/region/country plus a private general-area point and provider place identifier. Street addresses, browser geolocation, precise GPS, IP addresses, and live location are not requested or stored. Public profiles omit the point and provider identifier; other members receive only the broad area and a rounded approximate mile distance.
- Discovery has an adjustable nearby radius from 5–100 miles, defaulting to 25 miles. Shared-interest strength remains the first ordering signal; when interest overlap is equal, same-area and nearer general areas can rank earlier. “Nearby + online” includes people inside the selected radius or people where both profiles allow online connections; “Nearby only” applies only the selected radius.
- Existing profiles without a place point remain usable and fall back to the previous same-area rule. The radius control explains that the member should reselect their saved location to enable mile-based matching.
- “Find my connection area” still uses only Cloudflare's broad request location. It now fills the place search rather than directly changing the profile; the member must choose the matching suggestion before saving. Optional confirmation compares the chosen structured area with that broad connection area, expires after 90 days, and does not prove residence, identity, safety, or willingness to meet.
- Automated coverage now checks Haversine distance, 5–100 mile filtering, nearby-city eligibility, legacy fallback, Photon result normalization/deduplication, radius preference persistence, public-coordinate omission, and updated profile/location presentation. The existing location-confirmation and account-flow checks remain regression gates.
- The public Photon service is appropriate for this zero-cost pilot but is an external best-effort dependency. Before wider scale, validate production request volume and reliability and be prepared to move to a dedicated provider or self-hosted instance.
- Still pending: a rendered browser pass for autocomplete keyboard/touch behavior and mobile layout, a hosted connection-area smoke test, and a full two-account nearby-discovery walkthrough.

## Remaining GitHub review fixes — October 9, 2026

- Circle conversation and older-history fetches no longer mark notifications read. A separate, membership-authorized acknowledgement clears only that member's circle message/reaction/joined/opened notifications through the fetched snapshot. Later notifications, other circles, other members, and host join-request alerts remain unread.
- The circle UI acknowledges only while visible, focused, online, and at the latest messages. Returning to the latest messages or refocusing can acknowledge the fetched snapshot. These are private notification states, not public read receipts. Unchanged-message caching retains fresh notification cursors.
- Profile-photo previews now handle thumbnail failures and offer Retry photo. Retry remounts the image; a changed photo source does not inherit an earlier failure. Server photo authorization is unchanged.
- SQLite API regression checks cover read-only fetches, cursor boundaries, unrelated alerts, invalid cursors, and nonmember rejection. Lifecycle checks cover photo error/retry/source changes and notification cursors on cached history.
- Native Chromium checks with controlled response fixtures verified acknowledgement at the latest messages, no acknowledgement while reading older history or while the document is hidden, acknowledgement on visibility restoration, and thumbnail failure followed by successful native image loading on retry. Fixtures simulated response failures and notification cursors; they did not alter production accounts or data.
- All 23 automated test files pass. TypeScript and the production build pass. Physical-device and independently authenticated two-account checks remain pending. Publishing to the live site is a separate step.

## Priority UX improvements — October 8, 2026

- Direct and circle conversations use one mobile viewport, with optional conversation ideas and feedback inside help. Support and redundant circle-navigation chrome no longer compete with the mobile transcript. Context, participants, photo controls, and safety actions remain accessible in the scrollable context area.
- Native Chromium at 390×844: both transcripts measure about 411px. At 390×500: both measure about 153px; at 320×500: direct 153px, circle 131px. At 844×390 landscape: both measure about 120px. Send stays inside the viewport; no horizontal page overflow appeared in these checks. Expanded help and conversation ideas were exercised. Reduced viewport checks approximate keyboard space; physical phone keyboards remain pending.
- Sent voice labels now use `#eef0ff` on the indigo bubble, verified through browser computed styles.
- Incoming guidance/new invitation notifications open `#conversations/requests`; sent guidance and successful invitations open `#conversations/sent`. Older invitation notifications also resolve to Requests. Chromium verified deep links, tab navigation, refresh, and Back.
- Discovery explanations and preference details now live inside Filters; compact cards summarize introductions and keep full answers in View profile. First demo results appear within the initial 390×844 viewport. Member age-filter persistence across refresh was verified; demo filters remain separate.
- All 23 automated test files pass, including incoming/sent guidance destination checks. TypeScript and production build pass. Existing lint failures remain outside this change.

## Verified automatically

- TypeScript compilation, production build and current test suite.
- API flows use real SQLite with mocked trusted identity; permission, block, report, circle-history, photo-review, stale-account and send-time revocation cases pass.
- Latest-request gating rejects older responses after refresh/mutation/unmount.
- Dialog unit tests cover visible controls, focus wrapping/restoration, background inert state and busy Escape handling using controlled DOM objects.
- Service-worker tests confirm private APIs, photos and POSTs bypass interception; offline navigation returns a generic no-store page.

## Pending browser and device checks

Test desktop keyboard, iOS Safari and Android Chrome. Include 320px width, landscape, 200% text, 400% browser zoom and reduced-motion settings. Desktop Chromium voice-flow results are recorded below; the broader browser/device checks remain pending.

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

## Desktop Chromium voice checks — October 8, 2026

Tested by Codex using headless Chromium 151.0.7922.173 on Linux, the portable local development server, disposable admitted local members, local D1/R2, and Chromium's synthetic microphone. Recording used native `getUserMedia` and `MediaRecorder`; preview and saved-message playback used native audio decoding. Playback progress was checked through advancing `currentTime`, not audible speech quality. No production accounts or data were used.

Passed:

- Direct and circle recording, Stop, playable preview, successful upload, and playback through the protected voice API.
- Microphone tracks end after Stop, Cancel, and navigating away. Cancelling a delayed microphone request also stops its eventual stream without creating a preview.
- Native microphone permission denial explains the problem and restores the recording control.
- Ending all microphone tracks during recording produces a playable, sendable preview and allows another recording afterward.
- A deliberately lost upload response preserves the recording. Retrying uses the same attempt ID and stores exactly one message, even when the first request already succeeded.
- A failed playback request exposes Retry playback; retry loads and plays the saved audio.
- Anonymous playback returns 401, wrong-conversation access returns 403, and stale-account sending returns 409. A two-byte playback range returns 206 with two bytes and `private, no-store` caching.

Verified bug and fix: an ended microphone stream bypassed the Stop button, leaving the upload duration at zero (or a previous recording's duration) and the internal recording guard active. Chromium displayed a playable preview, but the API rejected its upload with 400; the next recording could not start. The native stop handler now releases the guard and records the elapsed duration when Stop did not already do so; each new recording resets its duration. The lifecycle regression test covers an automatic stop following earlier recordings, successful sending, and starting another recording. Browser reproduction using native track shutdown passes after the fix.

Post-fix validation: all 23 automated test files pass, TypeScript passes, and the production build passes. Physical microphone quality, iOS Safari, Android Chrome, independently authenticated recipient playback, the real-device 60-second limit, and the broader accessibility/layout checklist remain unverified.

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
