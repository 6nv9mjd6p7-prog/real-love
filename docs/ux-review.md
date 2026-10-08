# Real Love: design consistency and efficiency review

Reviewed October 5, 2026. Scope: every current member-facing screen, review tools, installation, and their loading/empty/error states. This is a source-based UX review with calculated color contrast and automated flow checks, not a rendered browser audit, accessibility certification, or study of real users.

## Page-by-page review

| Surface | Assessment and changes | Remaining validation |
|---|---|---|
| Entry and admission | Clear sign-in, adult-only pilot, and three-step onboarding. Initial API failure now offers retry rather than suggesting that a saved profile is missing. | First-time comprehension and sign-in friction. |
| Discover | Shared-interest default and explicit Any interest option. Filters remain strict. Common control sizing, readable tags, and keyboard focus now match the rest of the app. | Can people recognize why someone appears? Test on a narrow phone with long names and topics. |
| Saved | Uses the same cards as Discover; includes all interests and explains unavailable profiles. | Whether people understand that saved profiles can become unavailable. |
| Member profile | Introduction, optional detail, and one invitation action. Report/block/save controls now remain available when an invitation is pending or accepted. | Invitation quality and understanding that acceptance opens conversation only. |
| Conversations inbox | Separates incoming requests, accepted conversations, and collapsed sent/closed history. Consistent buttons and wrapping rows. | Whether unread and request counts are understood. |
| Direct conversation | Existing delivery handling preserves an unconfirmed draft and avoids suggesting that a confirmed send failed. Added immediate retry for refresh errors; corrected offline wording. Standardized timestamp contrast. | Long threads, keyboard opening, screen-reader announcements, and draft loss when leaving the screen. |
| Profile creation/editing | Three creation steps; optional material stays collapsed. Section selection is announced; keyboard focus follows step changes. Selected activity buttons expose their state. | Completion time, abandonment per step, and unsaved-edit expectations. |
| Photo management | Optional, reviewed, then mutually shared; status remains explicit. Uses the common field/control baseline. | Upload cancellation, rejected photos, and comprehension of replacement resetting permission. |
| Circles discovery/joined/requests | Added relevant empty states for each tab and search, with clear-search/discovery actions. Loading errors offer retry. | Can hosts distinguish membership requests from mutual founding proposals? |
| Circle conversation | Added a loading state so an unfetched conversation does not appear empty. Consistent top-level heading, close target, composer, and timestamps. | Joining/history boundaries, long participant lists, and permission changes across two real accounts. |
| Settings/privacy | Shared panel styles, readable text, larger controls, and wrapping blocked-member actions. Pause/delete remain distinct. | Policy comprehension, 200% zoom, and keyboard traversal of nested disclosures. |
| Safety review | Shares field, button, error, and panel styles. Existing per-person admission confirmation, fresh decision reasons, loading/retry, and conflict filtering retained. Unauthorized deep links now show a useful access message. | Independent reviewers should test evidence and decision workflows with separate accounts. |
| Report/preview dialogs | Existing focus trap and Escape dismissal retained; close buttons enlarged to 44px. | Actual focus return, scroll behavior, and mobile keyboard overlap. |
| Installation | Delayed until engagement; optional instructions, no interruption of onboarding. Desktop alignment now matches sidebar width. | Safari/Chrome installation on real devices. |

## Measured and inspectable evidence

- Three primary destinations: Discover, Conversations, Profile. Settings stays available as a secondary destination.
- Three profile-creation steps: Basics, Interests, Introduction. These are structural counts, not measured task times.
- Common buttons and disclosure summaries now have a CSS minimum height of 44px; buttons also have a minimum width of 44px. Native checkbox inputs are smaller but are wrapped by labels with a 44px minimum height. This is a design target; rendered hit areas and exceptions still need browser validation.
- Common inputs and primary action text use 16px at the default browser font size; ordinary metadata uses 14px. The remaining decorative tagline is 12px. Zoom/reflow needs device testing.
- Main navigation exposes the current destination; selection controls expose their pressed state. A skip link and route/step focus handling reduce repeated keyboard traversal.
- Global, direct-conversation, circle-list, and moderation refresh failures expose explicit retry actions. Initial load failure is distinguished from an empty account.
- Polling is currently every 30 seconds for the member shell/circle list and every 12 seconds for an open conversation, gated by page visibility. This is an implementation interval, not delivery latency or a real-time guarantee.

### Calculated text contrast

Ratios use the WCAG sRGB relative-luminance formula and declared solid colors; they do not account for every rendered/background/state combination.

| Text example | Before | After |
|---|---:|---:|
| Message timestamp on own message (#e9e9ff) | 2.87:1 | 4.44:1 → corrected to a darker timestamp color, 5.01:1 |
| Footer on app background (#f5f6fa) | 3.40:1 | 4.92:1 |
| Conversation opening note on #f3f3fb | 4.11:1 | 4.81:1 |
| Eyebrow on app background | 3.84:1 | 4.92:1 |
| Shared-interest tag | 6.34:1 | 6.34:1 (unchanged) |
| Body text on white | 14.33:1 | 14.33:1 (unchanged) |
| White primary-action text | 12.15:1 | 12.15:1 (unchanged) |

WCAG normal text requires 4.5:1; large text requires 3:1. WCAG 2.2 AA target size is 24×24 CSS pixels with specified exceptions. This app's 44px target is our more generous design choice, not the AA minimum.

## Efficiency targets for the pilot

These are proposed acceptance targets, not current results or universal industry benchmarks. Run moderated sessions with five to eight invited adult testers, including keyboard use and narrow phones. Keep task observations separate from private chats/profile answers. Do not add tracking of sensitive content or public character ratings.

| Metric | Proposed target | How to measure |
|---|---|---|
| Unassisted core-task completion | At least 90% across discovery, invitation, conversation, and reporting | Record successful tasks/attempts and blockers; with a small sample, report raw counts alongside percentages. |
| Profile creation | Median no more than 3 minutes, excluding sign-in and admission review | Time from first profile step to successful save; record step-level abandonment. |
| Discovery relevance | At least 4 of 5 testers can explain why a profile appears | Ask participants to describe one exact or related interest; do not score the person's worth or character. |
| Filter comprehension | Everyone recognizes when a strict filter leaves no results | Ask them to switch to Any interest and then find their area without assistance. |
| Reporting | Complete a report in no more than 60 seconds from a profile/chat | Observe report submission and receipt; measure review response separately. |
| Error recovery | All testers recover from a failed refresh without losing an unsent message or resending a confirmed message | Simulate offline/refresh errors during a supervised test. Drafts still do not survive navigation/reload. |
| Perceived usability | Median task ease at least 5/7 | Ask one ease question immediately after each task. |
| Meaningful connection | Track mutual replies and participants' own reports of useful connection | Review after 7–14 days; do not set an arbitrary compatibility guarantee or optimize for scrolling. |

## Performance targets, not yet measured

Google's good Core Web Vitals thresholds are LCP ≤2.5 seconds, INP ≤200 milliseconds, CLS ≤0.1 at the 75th percentile, segmented by mobile/desktop. No production field data or authenticated browser benchmark was available for this review. Passing a build does not establish any of these results. Measure cold load, discovery filtering, opening profiles, opening conversations, and returning from settings on representative devices/networks.

## Validation and next decision

TypeScript, matching/filter checks, API safety/connection/circle/photo checks, message-delivery checks, diff validation, and production build are required for this update. These checks use mocked authentication with SQLite; they are not live multi-user tests.

Do a real-device pilot before expanding features. Highest remaining risks to efficient use: unsaved drafts on navigation, uncertain empty-state comprehension in a small membership pool, same-area matching based on entered names rather than distance, long policy/review content, and unmeasured network/render performance. A 200% zoom and screen-reader walkthrough is still required.

Sources:
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://web.dev/articles/vitals

## Step 1 — unfinished work (2026-10-05)
- Profiles, per-member invitation openings, direct messages, and circle messages recover within the current browser tab after navigation or refresh.
- Tab storage is partitioned by authenticated account and destination; previous-account drafts are purged on account changes. Stale-account app/circle submissions are rejected.
- No unsent draft is uploaded. Browser storage is not encrypted; tab drafts expire on retrieval after 24 hours. Browser session restoration can retain tab storage. When storage is unavailable, in-memory navigation recovery works but refresh recovery cannot be guaranteed.
- Confirmed saves/sends clear the matching draft. Failed saves/sends retain it. Sign-out, profile deletion, and Settings → Clear unfinished drafts clear tab drafts. Ending/blocking direct connections and leaving/closing circles clear their message draft.
- Existing photo and visibility metadata are loaded from the server rather than restored from profile drafts. Editing is disabled while submitting, preventing new text from being cleared by a completed send/save.
- Storage isolation/expiry/clearing/fallback, stale-account API guards, message delivery, profile validation, and existing SQLite safety flows tested. Live multi-account/mobile walkthrough remains outstanding.

## Step 2 — discovery preferences (2026-10-05)
- Member discovery remembers interest mode, topic, location mode, age filters, activity, availability, ace-spectrum filter, and search on this browser. Local preferences are partitioned by authenticated account; sign-out, account change, and profile deletion clear them. They are not synced to other devices.
- Demo filters use separate in-memory state and never change remembered member preferences.
- A visible discovery choices panel shows mode and removable filter chips. Reset discovery returns all discovery controls to defaults, including My interests, and persists that reset. Existing profile age ranges, reciprocal eligibility, admission, blocks, and privacy boundaries continue to apply.
- Empty results explain filter adjustment without automatic widening. Storage denial falls back to working in-memory controls with accurate refresh limitations. Invalid, obsolete, oversized, and malformed stored preferences normalize safely.
- Preference restoration/reset/isolation/validation/storage-denial tests, existing matching checks, type check and production build validated. Live device/browser walkthrough remains outstanding.

## Step 3 — visibility and interaction (2026-10-05)
- Settings separates discovery visibility (profile JSON `discoverable`, default true for legacy profiles) from full pause (existing `profiles.active` field). No new database migration is required.
- Hiding removes the member from discovery/saved discovery candidates and denies new invitations in either direction, including direct requests with a known ID. Previously pending invitations remain actionable; accepted chats, mutual photo sharing, and circles remain available. Group names/messages remain visible under normal group permissions.
- Full pause stops direct/circle conversation reads and sends, new participation, and shared-photo access. Membership/message history is retained. Paused members see only their existing circles for reporting/leaving and can report/block/end existing direct connections. These exit actions remain available.
- Resuming keeps discovery visibility unchanged. Profile saves preserve both controls, ignoring stale client access flags. Show/resume cannot bypass admission, updated-rule agreement, suspension, or bans. Invitation insertion rechecks both profiles' visibility within the SQL write to handle a concurrent hide.
- Settings, admission notices, profile editor, invitation composer, and paused conversation/circle states explain the same behavior. No character, safety, or compatibility claims are added.
- SQLite flow tests cover default/hidden discovery, known-ID invitation attempts, hidden senders, existing pending acceptance, chat/group continuity, photo continuity, full pause, stale profile saves, resume-with-hidden-state, independent safety actions, and moderation restrictions. Type/matching/draft checks passed; live mobile and multiple real-account testing remains outstanding.

## Step 4 — first-use guidance (2026-10-05)
- Guest entry explains the three stages: short profile, admission review, then a mutually accepted invitation. Friendship is the starting point; wider community membership is optional.
- State-specific guidance prioritizes restrictions, profile creation, pending admission, updated rules, pause, and invitations. Updated-rule actions now lead directly to the editable profile agreement. Pending admission offers preview, editing, and fictional examples with no promised review time or character certification.
- First-connection help appears on discovery only before an accepted connection and adapts to incoming or sent invitations. It is collapsible; it adds no mandatory tour or completion pressure.
- Profile setup labels required basics and the single introduction, names the next step on Continue buttons, supports clicking earlier steps, validates each required stage, and keeps deeper answers optional/collapsed. Visible/privacy/paused behavior is explained before saving. Existing admitted accounts receive accurate create wording rather than a review promise.
- All profile controls are disabled during a save so an in-flight submission cannot discard newly edited fields.
- Next-action state tests, step validation/profile-draft tests and type checking passed. Production build validates rendering compilation; live mobile/new-member usability testing remains outstanding.

## Step 5 — discovery explanations (2026-10-05)
- Discovery cards surface exact shared interests first, including matches in legacy `topics` or later selections, with visible Shared labels. Counts and explanations distinguish exact overlap, explicitly related broad areas, and discovery across unrelated interests.
- Member profiles separate exact interests, the actual broad-area/topic selections behind related overlap, entered areas, online preference, activities, and concrete availability. Neutral discussion cues show differing schedules, nonoverlapping listed activities, and differing future sexual expectations without excluding friendship or implying agreement.
- A collapsible explanation describes mode eligibility, ordering, explicit filters, reciprocal/private age boundaries, and self-report limitations. Identity fields, photos, faith answers, and private romantic openness are not used for ranking; Religion as a selected interest can still produce a topic match.
- Same-area explanations now use the same case/whitespace normalization as ordering. Location remains exact entered-place matching, with no GPS, distance, country/region disambiguation, or proximity claim. Members are prompted to confirm ambiguous place names. No radius filter is added.
- Duplicate activities no longer inflate ordering. Exact/related interest rules, privacy eligibility, independent thought, and friendship-first behavior are preserved. Discovery still operates over the existing bounded candidate pool; large-scale retrieval remains future work.
- Matching/explanation edge cases, rendered profile labels, static own-preview behavior, and existing SQLite safety/photo/pause flows validated. Type check/build passed; live mobile usability remains outstanding.

## Step 6: personal invitations and clear states

- Members may attach one voluntarily shared public interest or profile answer and write their own opening. The introduction/activity panels offer explicit reply buttons; interest tags still browse people. Selecting context never overwrites the opening.
- Opening and context drafts remain account- and recipient-scoped in the existing 24-hour tab storage. Confirmed sends clear both; failures preserve both; blocking clears both. Sign-out/deletion/clear-drafts use the existing namespace cleanup.
- Server validates the chosen key and exact current public answer, saves a canonical snapshot, and rejects private fields or changed/fabricated quotes. Context stays with the two participants, including after answer edits, with this retention disclosed before sending and in Settings. Profile deletion removes associated connections.
- Incoming and sent invitations show context, opening, sent date, profile access, and response status. Closed records distinguish declined, withdrawn, and ended for new actions; historical records use “Closed” without guessing. No explanation is required. Acceptance opens conversation only; contact restrictions persist.
- The composer shows remaining attempts in the existing five-per-rolling-24-hours limit and next expiry; failed attempts can consume the limit. No countdown pressure, automatic resend, paid bypass, or second invitation after a decline.
- Migration 0008 adds two constant-default text columns; prior migrations remain unchanged. Type checking, profile rendering, context/status checks, draft checks, and real-SQLite API flows validate the update. Real-device and live multi-account QA remain outstanding.

## Step 7: thoughtful, reliable conversations

- Direct chats prioritize the message thread. A labeled, collapsed panel retains the invitation snapshot and photo choices; a visible profile button opens the existing authorized profile view. Photo review/mutual-consent gates remain unchanged.
- Date dividers, sender labels, timestamped “Sent” metadata, a visible composer label, and character count clarify the thread. “Sent” means saved by the app, never read by the recipient. No read receipts, last-seen tracking, or reply deadlines are added.
- Conversation prompts are optional and collapsed. One can use an exact shared interest; other prompts ask about everyday interests and communication pace. Choosing a prompt appends to the unfinished draft without sending or truncating it. All draft isolation and expiry rules remain in place.
- Incoming updates follow only when near the bottom. While reading earlier messages, a new-message button offers an explicit return to the latest; only the message pane scrolls. The chat exposes a labeled keyboard-focusable log.
- Refresh failures and send outcomes are separate. A failed/unconfirmed send keeps the draft and warns to refresh/check before sending again; polling cannot erase this warning. A confirmed send clears its draft even if subsequent retrieval fails. Requests started before a send cannot overwrite its refreshed result. Repeated polling does not create new-message counts.
- Existing 12-second foreground polling and latest-200-message limit remain; the UI states these practical limits. Offline initial loading does not claim there is an empty conversation.
- Type checking, SSR labels/loading/privacy checks, draft/prompt/scroll decisions, delivery-failure tests, and the existing real-SQLite API safety flows pass. Automated tests do not establish real-device scroll behavior, keyboard usability, or live multi-account delivery; those remain in the final walkthrough.

## Step 8: circle agreement, joining, and host controls

- Circles explain their three steps: an accepted connection proposes, both founders agree, then hosts review join requests. Cards separate status, purpose, tags, next activity, and participant count. Discover, Joined, and Requests use membership-aware labels instead of a universal “request to join.”
- Requests separate founder proposals, requests to your hosted circles, and your outgoing requests. A visible host review button opens participants/requests directly. Pending proposals never enter discovery; the recipient agreement label remains accurate while paused, with approval disabled.
- Before opening a proposal, the recipient reviews which circle details become discoverable and both hosts’ powers. Before requesting membership, a review panel explains name visibility, approval, message history from admission, private profile/photo separation, leaving, and retained group messages. Reviewing does not send a request. Stale reviews cannot request membership for existing or removed members.
- A visible Leave action in the conversation and cards opens a focused inline confirmation, returning focus on cancellation. It explains posted-message retention and that a circle continues while another host remains. Closing the circle separately warns that access ends for everyone. Group purpose/activity remain available inside the conversation.
- Actionable request counts now use the same active-member/block eligibility for the circle list and global alerts. A request unavailable due to account state or a block involving a current participant cannot be approved; the UI does not reveal the reason. Existing server authorization remains the source of truth.
- Proposal controls lock during submission; loading, empty, withdrawal, and unavailable states remain distinct. No schema migration or paid safety gate is added.
- Type checks, card-render/disclosure tests, status/group/search tests, and real-SQLite API flows pass, including private proposals, paused founder agreement, unavailable request counts, withdrawal, and one/last-host leaving. Live multi-account and real-device interaction testing remain outstanding.

## Step 9: safety and privacy boundaries

Reviewed discovery/profile projection, pending and accepted contact, blocking/recontact limits, direct/group message access, circle admission/exit, photo upload/review/exchange/report evidence, reporting/appeals, reviewer conflicts, account switching, moderation, deletion, and draft cleanup. This is an implementation review, not a security certification or a guarantee of member behavior.

Changes:
- Reporting no longer collects a current hidden profile just from a supplied member ID. Eligible discovery/live-contact reports may attach visible profile fields; previous contacts, blocks, and shared-circle history allow a written concern without copying a hidden current profile. Photo evidence requires current mutual sharing, active admitted participants, and no block. Appeals must concern the reporter’s own account.
- Circle-message evidence is bounded by admission and exit. Applicants cannot attach group messages; new former-member records can attach messages from their permitted period, never future messages. Historical exits with no recorded upper bound fail closed for message attachment; written circle/host concerns remain available. Migration 0009 adds one constant-default upper-history column without rewriting prior migrations.
- Reports never unlock a replacement profile photo. Expired frozen photo evidence is denied at read time before lazy cleanup. Reviewers must load a version-specific photo token before approval/rejection; stale tokens and changed images are rejected. Photo updates change only photo fields and reset mutual permission atomically, preserving concurrent privacy/profile choices. Conflicting uploads or a deleted/paused profile do not leave an accepted new photo reference. Removal is not subject to the upload cap.
- Reviewer conflict checks include app connections to either reporter or subject, blocks, self-involvement, and circle participation; no owner bypass is added. Closed or expired reports cannot be reused for review actions. Independent admission and photo review remain required.
- New invitations and acceptance also recheck current admission/activity/block permissions in their write. Direct and group sends recheck connection/membership, account admission, activity, and current rules in the insertion statement, so revocation during a send prevents the message being stored. Contact restrictions, block/ban/removal persistence through profile recreation, and private-photo gates remain intact.
- Unavailable contacts retain minimal name/ID history and reporting/blocking/ending controls; full current profile and photo access remain unavailable. Report/photo/moderation mutations protect against stale signed-in accounts; circle/reviewer reads identify their account. Report controls lock during submission, and blocking through the report dialog uses the same targeted draft cleanup.

Validation: type checking; existing profile/photo/circle/admission/ban/deletion flows; adversarial real-SQLite report history and known-ID checks; conflicts involving a connected reporter; expiry without cleanup; stale account mutations; insertion races after connection/membership revocation; concurrent photo/privacy changes; stale photo review; and safety access after another member pauses.

Remaining verification: real-device accessibility/scroll/keyboard behavior, live multi-account sign-in/delivery/revocation, and operational moderation coverage. Text filters are a limited pilot guard, not a reliable detector of all harassment, scams, or sexual pressure. Admission/review cannot certify character. The owner-only deployment is preserved.

## Step 10: device, accessibility, and reliability readiness

Implemented mobile navigation reflow, non-sticky small-screen navigation/composers, safe-area dialog padding, dynamic viewport dialog/message limits, wrapping group/reviewer content, stronger secondary text and keyboard focus styling, and reduced-motion handling. Dialog focus now skips hidden/disabled controls, traps keyboard focus with an empty-dialog fallback, makes background controls inert, restores prior focus/scroll state, and prevents dismissal during a pending report. Main and circle refreshes ignore superseded responses; group polling waits during initial loading and mutations.

Automated validation: TypeScript, production build, all existing SQLite/API and rendered-component tests, plus deferred response cancellation, dialog focus lifecycle against controlled DOM objects, and service-worker offline/private-data routing tests. These unit tests do not verify actual browser focus, visual layout, screen-reader announcements, or touch behavior.

Browser QA could not run because the required control-browser skill is unavailable. Real-device and live two-account testing remain outstanding. The deployment stays owner-only; no invitation or access change was made. See release-checks.md for the remaining pilot gate. Step 10 is partially verified, not a claim of accessibility compliance or production readiness.
