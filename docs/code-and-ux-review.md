# Real Love: code and user experience review

Reviewed October 8, 2026, against imported main `dbdcfc8` plus the local voice-recorder fix. This review recommends incremental improvements to the existing app. Its purpose remains friendship through shared interests, thoughtful conversation, and mutual care; romance and photo sharing remain optional.

Implementation update: the four first priorities below have now been addressed locally: mobile conversation layout, voice-label contrast, inbox destinations, and compact discovery. The findings describe the original behavior. See [release checks](release-checks.md) for current verification. These changes have not been published to the live site; later recommendations remain outstanding.

October 9 update: circle fetches now preserve unread notifications until a focused reader reaches the latest messages; photo-preview errors now have an explicit retry. Both have regression and Chromium checks recorded in the release document. Other P2 recommendations below remain outstanding.

October 10 update: free-text location is now a structured broad area with optional connection-based confirmation. Exact location is never requested or stored, manual entry remains available, confirmation expires, and it does not affect interest-first ranking. Hosted request metadata still needs a smoke test after publishing.

## Scope and evidence

The repository contains 243 tracked files. Review covered the application screens and helpers, API authorization and storage paths, database schema and migrations, notification and service-worker behavior, automated-test coverage, and build/setup configuration. TypeScript source and dependency inventories included the generic UI components; those largely unused library primitives were not individually audited. This is a product/code review, not a security certification.

Native Chromium was used at 320px, 390px, and 1440px widths for discovery, conversations, direct chat, circles, profile, and settings. A 390×500 viewport approximated reduced space while composing; it does not replace real phone-keyboard testing. Discovery measurements used demo examples, not a production population. No horizontal page overflow appeared on those checked screens.

Current validation: all 23 automated test files pass, TypeScript checks pass, and the production build passes. `npm run lint` fails with 266 errors and 31 warnings, including explicit `any` types and React-hook rules. Passing tests do not imply a clean lint baseline.

## Fundamentals to borrow

| Familiar pattern | Apply it here | Preserve this boundary |
| --- | --- | --- |
| Social app navigation | Keep Discover, Conversations, and Profile predictable; consider a compact mobile bottom bar after testing safe areas and keyboard behavior. | Keep circles discoverable without multiplying top-level destinations. |
| Dating app introductions | Show one shared-interest reason, a short prompt answer, and a clear invitation action. | Do not make photos, identity disclosure, or appearance scores prerequisites. |
| Messaging reliability | Consistent drafts, sending states, retry explanations, readable history, and accessible playback controls. | Do not add public read receipts, presence pressure, or reply deadlines. |
| Filter sheets | Compact summary of active filters; advanced controls in one accessible panel. | Never silently widen preferences or change interest-first ranking. |
| Notification destinations | Open the exact request, conversation, or circle that needs attention. | Keep push content generic and notifications optional. |
| Safety controls | Make decline, close, report, and block easy to find and understand. | Mutual acceptance and server authorization remain the gates to conversation and photos. |

## First priorities

### 1. Give mobile conversations a usable viewport — browser verified

In direct chat at 390×500, the message transcript shrank to about **24px**. Fixed-size guidance and surrounding page chrome compete with the composer and transcript. At 390×844, the initial direct-chat composer extended below the viewport; circles took still more page space. Page scrolling is possible, but the combination of page and transcript scrolling makes conversation unnecessarily difficult.

Sources: [mobile chat CSS](../app/globals.css), [direct conversation](../app/conversation.tsx), [circles](../app/circles.tsx).

Give conversation screens one coherent viewport layout, reserve space for the composer, and collapse optional ideas/help into a toolbar or disclosure. Account for surrounding navigation and banners rather than subtracting a single fixed height. Keep safety actions accessible.

Acceptance: at 320px width, 390×500, landscape, and on real phone keyboards, users can reach Send and read a useful portion of history without fighting nested scrolling. Test focus, zoom, safe areas, and both direct and circle chat.

### 2. Fix sent voice-note label contrast — browser verified

The sent-message voice label inherits `#606276` on the `#292e72` bubble: approximately **2.03:1** contrast. Normal text needs 4.5:1 for WCAG AA. The playback-status override does not also cover the label.

Sources: [voice bubble](../app/chat-bubble.tsx), [message styles](../app/globals.css).

Use a readable foreground token for every text element on sent bubbles, then check labels, timestamps, reply excerpts, edit states, and errors in both incoming and outgoing messages. Keep native audio controls and the existing playback retry.

### 3. Route invitations to the correct inbox section — source confirmed

`inboxTab` initializes to `Chats`. Both “Review invitations” and “View sent invitations” navigate only to `conversations`; they do not select Requests or Sent. The invitation-success navigation has the same ambiguity. Users can arrive at an apparently empty chat list after an action specifically about requests.

Sources: [onboarding destinations](../app/onboarding.ts), [inbox state and navigation](../app/love-app.tsx), [notification destinations](../app/notification-server.ts).

Represent the intended inbox section in navigation state or a validated subroute. Incoming actions should open Requests; sent confirmations should open Sent. Verify browser Back, refresh, notification entry, and switching accounts without carrying private state between accounts.

### 4. Put discovery results closer to the top — browser verified in demo mode

With the tested demo state, the first profile began around **1543px** down at 390×844, **1586px** at 320×844, and **1020px** at 1440×844. Repeated explanations, modes, preferences, and other controls precede the actual people. The first mobile card itself was about 774px tall at 390px width.

Sources: [discovery screen](../app/love-app.tsx), [discovery details](../app/discovery-details.tsx), [styles](../app/globals.css).

Make the default view a compact heading, filter summary, and results. Put advanced filters and explanations behind clear controls. Make cards lead with a shared interest and short introduction, with deeper answers in the profile view. Keep demo labeling explicit.

Acceptance: a first result is visible on a normal 390×844 default screen when results exist. Validate again with a real admitted pool, empty results, long names, and expanded filters. Preserve the current ranking and user-selected filters.

## Next improvements

| Priority | Finding and source | Recommended change |
| --- | --- | --- |
| P2 | Direct and circle conversations differ in offline handling, jump-to-latest behavior, history focus, and delivery explanations: [conversation](../app/conversation.tsx), [circles](../app/circles.tsx). | Share the conversation shell and delivery states while retaining distinct membership/authorization policies. Explain unconfirmed sends and retain idempotent retry identifiers. |
| P2 | Circle conversation polling also clears notifications, whereas direct chat has more deliberate visibility/read handling: [circle API](../app/api/circles/route.ts). | Avoid clearing unseen activity merely because a background request ran. Define local unread behavior without adding public read receipts. |
| P2 | Several general API operations have no deadline; voice uploads already have bounded waits: [app](../app/love-app.tsx), [circles](../app/circles.tsx), [profile editor](../app/profile-editor.tsx). | Introduce a typed API helper with deadlines and stale-read cancellation. A timeout must not imply that a mutation failed to save; never blindly replay it. |
| P2 | Optional identity fields precede required location in initial profile basics; photo management occupies prominent space before editing: [profile editor](../app/profile-editor.tsx). | Emphasize interests and introduction. Put optional identity and photos in clearly labeled sections; preserve every sharing choice. Avoid completeness scores that pressure disclosure. |
| P2 | Profile preview has a failure-state setter that is never wired to thumbnail errors: [preview photo](../app/profile-preview-photo.tsx), [interactive photo](../app/interactive-photo.tsx). | Wire an error fallback and retry; confirm with a failed image response. This is source-confirmed, not browser-reproduced in this review. |
| P2 | Circle reporting depends on membership/report-target availability even for visible discovery cards: [circle API](../app/api/circles/route.ts), [report API](../app/api/reports/route.ts). | Consider reports of visible circle metadata without joining. This requires a deliberate policy decision and server validation; it must not expose private messages. |
| P2 | App, circle, and notification polling run separately: [app](../app/love-app.tsx), [circles](../app/circles.tsx), [notifications](../app/notification-center.tsx). | Consolidate invalidation and pause unnecessary work when hidden. Preserve timely safety/access revocations and avoid introducing tracking. |

## Code and operational improvements

1. **Make the development contract accurate.** [README](../README.md) still describes a starter and an empty schema. The actual project uses pnpm 11.25.0, D1 migrations, R2 voice storage, and specific authentication paths. Document tested install, local migration, dev, build, test, and type-check commands; explain local mock authentication versus deployed authentication. Add explicit `test` and `typecheck` package scripts and CI checks. Keep secrets out of examples.
2. **Establish a realistic lint baseline.** Classify current errors before enabling lint as a merge gate. Fix hook correctness issues first, then replace boundary `any` types with validated request/response models. Do not blanket-disable lint to claim it passes.
3. **Decompose incrementally.** [love-app.tsx](../app/love-app.tsx) is about 70KB in 146 lines; [globals.css](../app/globals.css) is about 72KB with repeated overrides. Extract navigation, discovery, inbox, and account screens in small changes. Consolidate style tokens and duplicate selectors only with browser checks. The app does not need a framework rewrite.
4. **Measure data growth before changing queries.** [app API](../app/api/app/route.ts) loads an unbounded eligible-profile pool and performs per-connection work. Conversation revisions scan message/reaction history; [circle API](../app/api/circles/route.ts) has bounded lists that need intentional pagination as membership grows. Benchmark representative fixtures, then batch queries, introduce scoped pagination, and make unchanged polling cheaper. Preserve ranking order, block filtering, and authorization on every page.
5. **Update old product documentation.** [earlier UX review](ux-review.md) contains assumptions that no longer match current defaults and photo behavior. Describe actual behavior instead of changing code to match stale prose.

## Voice work already verified

Native Chromium recording, preview, direct/circle upload, playback, byte-range responses, permission rejection, cancellation, retry, and microphone cleanup were exercised with a synthetic microphone and local D1/R2. A native track-termination bug was reproduced and fixed: recorder shutdown now records elapsed duration and resets the recording intent so another note can start. A regression test covers that lifecycle.

Access checks included anonymous denial, wrong-scope denial, stale access rejection, and private/no-store audio responses. Retry after a lost response stored one message rather than duplicating it. See [release checks](release-checks.md) for details and limitations. Physical microphones, Safari/iOS, Android, and an independently authenticated recipient still need real-device checks.

## Suggested delivery order

1. Fix mobile chat layout, voice contrast, and invitation destinations. Verify both conversation types and account switching in Chromium and real phones.
2. Compact discovery and profile editing while preserving filters, ranking, and optional disclosure. Test empty states and long content before removing old layout rules.
3. Share messaging infrastructure, improve API outcomes, and clean up setup documentation/lint. Optimize data queries only after measuring representative workloads.

Each change should have a small diff and explicit acceptance checks. Existing photo consent, access revocation, request acceptance, account isolation, and voice lifecycle tests remain regression gates.
