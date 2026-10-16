# From connection to cooperation

Real Love helps people find their people, then gives them voluntary ways to help, do things and build together. The product test is **Talk → Help → Do → Build**. Friendship remains valuable without participation in another activity. Reciprocity is not a debt, score or obligation.

## First implementation

Inside an accepted, open circle conversation, expand **Circle tools**, then **Together**. Members can post an **Offer**, **Request**, **Activity** or **Project**, with a description and optional timing. A post appears in Together and the existing circle chat. Discuss in chat prepares a reply; it does not send a message or enroll anyone. Authors or hosts can mark a visible post closed. Closing does not delete discussion or certify completion.

Together posts are classified `circle_messages`, not a second group system or a public feed. Migration `0021_circle_together.sql` adds `cooperation_kind` and `cooperation_status` with defaults that preserve existing messages. Reusing message records preserves existing reporting/evidence, author editing/deletion windows, replies, notifications, blocking, account deletion and retention behavior. There are no popularity counts, help rankings or generosity badges.

The circle API exposes `together_list`, `together_post` and `together_close` after its existing active-account, open-circle and accepted-membership guards. Lists omit blocked senders, deleted content and inactive/non-admitted authors. They use the member’s admission history cutoff and cursor pagination. Post insertion rechecks membership, account eligibility and circle state inside the SQL write; retries reuse the existing account/circle-scoped message attempt. Closure rechecks author/host authority and current permissions at write time. Closure updates the viewer-visible conversation revision.

Drafts stay in the existing account- and circle-scoped tab storage with its expiry/cleanup behavior. Sign-out/account deletion clears that namespace; leaving or closing the circle clears its Together draft and retry identity. Requests identify the expected account, and UI request generations prevent superseded responses from replacing the latest list. Failed reads clear prior post content; failed writes keep the draft and retry identity.

## First-version limits

This is low-risk peer discussion and planning: knowledge, time, simple activities and shared ideas. The form explicitly excludes money requests, sales, lending arrangements, hazardous tasks and care/transport for minors. General app conduct rules remain in force. Text filtering and acknowledgement cannot guarantee compliance; report inappropriate posts through the existing message-report route. The app does not verify offers or guarantee safe meetings.

The initial version added no payments, pooled funds, resource inventories, reservations, lending/dispute process, participant commitments, home-address fields, public post discovery, public participation indicators, or new location disclosure. Later extensions are described below. A circle listing never includes Together content. New members receive only posts created after admission, including when an earlier project remains open. Hosts can restate an idea in a new post rather than expose old history automatically.

## Next steps

1. Validate the first version with real users and real devices.
2. Add optional activity planning and participation only with clear consent and cancellation states.
3. Add manageable project steps and updates.
4. Design approximate-area discovery independently of member-only content.
5. Evaluate physical sharing and other higher-risk cooperation separately before implementing it.

Automated API tests cover consent, retries, known-ID access, history, blocks, pause, revocation, reporting, pagination, closure and deletion. Component tests cover optional disclosure/form, draft recovery, attempt reuse, discussion without sending, reporting and stale-response/access-loss handling. These checks do not establish browser layout, screen-reader behavior, touch or real multiple-account usability; browser/device QA remains outstanding.


## Activity planning extension

Activities may include a structured start time. The browser interprets its `datetime-local` input in the device’s time zone and sends a canonical UTC timestamp; the board displays it in each viewer’s device time zone. A new activity time must be in the future and within two years. Existing free-text timing notes remain optional. Rescheduling currently means cancelling the old activity and posting a new one, so a prior response is never transferred to a changed date automatically.

Members can choose **Planning to join**, review who will see their name, then explicitly share their response. The author is not automatically a participant. Circle members with authorized post access can see chosen names in Participation; there is no public attendance list or numerical popularity score. The response is a plan, not a booking, obligation or attendance verification.

**Withdraw response** removes the member’s record without an explanation. Withdrawal remains possible on closed or cancelled activities and through the API while paused. Leaving or being removed clears responses in that circle. Account deletion clears the member’s responses and responses to posts removed with that account. Message deletion clears its response records. Paused/non-admitted members and blocked people are omitted from the visible roster.

The author or a host can close responses or confirm cancellation. Cancellation stops new responses, stays visibly labelled, and sends one generic in-app update to current respondents through existing notification controls. Prior responses are retained until withdrawn or cleaned up through the circle/account lifecycle; they do not mean the cancelled activity happened. New members cannot view or respond to pre-admission activities even if open. Responses recheck the post, history, membership, block, account, start time and circle state inside their SQL insertion. Response changes are included in viewer-bounded circle revisions.

Migration `0022_circle_activity_planning.sql` adds the UTC start field and `circle_activity_participants` table. No contact information, precise location, payment, calendar integration or automatic RSVP is introduced. Automated tests cover UTC conversion, consent, idempotency, access/history boundaries, cancellation and notification deduplication, blocked names, paused withdrawal, races, removal and account cleanup. Real browser/device QA is still required.


## Project steps and progress updates

Expand **Project steps & updates** on a Together Project. The project author and current circle hosts can add up to 20 short steps and mark steps done or reopen them. No step assigns another member, sets a personal deadline, creates a score or certifies an outcome. Other members with access to the project can share progress updates. Both steps and updates are ordinary circle messages linked to their project, so existing notifications, replies, reporting/evidence, author message-change windows and account deletion apply.

Migration `0023_circle_project_progress.sql` adds the `cooperation_parent` field to `circle_messages`. Steps use kind `step`; progress notes use `update`. They do not appear as new root posts in Together or in public discovery. Project details include only messages within the caller’s admission period, with blocked and unavailable authors omitted. A newly admitted member cannot open an older project through its ID or a newly posted child message. They can still see new messages in their normal circle history without automatically receiving an older parent quote.

Closed projects reject new steps, updates, step-state changes and child-message edits. Existing message deletion windows remain available for privacy. Deleting a project author or the parent message removes project access; other members’ independent messages retain the app’s ordinary circle-history behavior. Blocked parent authors make project details unavailable. All new child inserts recheck project state, author availability, caller membership, rules, history, blocks, host permissions and the step limit in SQL. Step changes include their expected prior state, with idempotent retries for an already applied target state.

Project progress drafts and retry attempts use the existing tab storage, partitioned by account, circle and project. Saving a step preserves an independent update draft. Failures preserve drafts and attempt identities. Circle leave/close clears the current account’s project draft kinds for that circle; existing sign-out/deletion/expiry cleanup remains in effect. UI read generations and abort signals prevent superseded project responses from replacing current content; access-loss failures clear previously displayed details.

Automated API coverage includes author/host boundaries, ordinary member updates, known-ID denial, admission history, reports, blocks, duplicate attempts, explicit step revisions, the step cap, update pagination, closed-project behavior, deletion and a project closing during a write. Component tests cover role-specific forms, independent drafts, failure recovery, retries, reporting, closure and stale/access-loss responses. Real browser, screen-reader, touch and multiple-account QA remain unverified.


## Finding Together from Circles

The Circles list now has a visible Together entry. Choose an accepted, open, unrestricted circle and select Open Together; the existing member-only panel opens expanded. Joined-circle cards provide the same shortcut. The panel remains manually collapsible. No membership, message or activity response is created by opening it.

## Optional circle areas

When proposing a discoverable friendship, industry or local worker circle, a founder may explicitly choose to share their saved profile city, region and country as the circle’s general area. The default is off. The server copies only these three display fields; it ignores client-supplied area objects and never copies coordinates, place IDs, confirmation metadata, member addresses or live locations. The submitted area key must match the current saved profile area, so a changed profile cannot silently authorize a different disclosure. Sharing is a snapshot and does not follow later profile changes.

The other founder sees the area in the proposal and review before agreeing. It becomes discoverable with the existing circle listing only after both founders agree. It describes the circle, not where its members live or where an activity meets. Unlisted organizing circles reject structured area sharing and never render an area label. Membership, blocking, listing eligibility and message/history access remain unchanged; a listing area grants no access to Together content.

Browse offers Any area by default and My area when the viewer has a complete saved area. My area matches normalized city, region and country; it never uses city alone. This is an exact general-area filter over the existing returned listings (currently up to 100), not a distance search or a complete geographic directory. Listings without an area remain in Any area. Joined and Requests ignore this filter, and the Together circle selector also remains unfiltered. A host can remove a shared area, including while paused; host membership is checked again inside the update. Removing the label cannot recall copies already saved elsewhere. Existing circles start without an area; this version does not add areas retroactively or allow changing an open circle to a different area without renewed founder review.

Migration `0024_circle_general_area.sql` adds the optional stored label with an empty default. API, component and helper tests cover defaults, explicit choice, stale disclosure, unlisted exclusion, same-name cities in different regions, missing areas, review labels, profile-coordinate omission, member-only content, host-only removal, paused removal and membership revocation during removal. Distance-based discovery and live device/browser validation remain future work.


## Optional distance discovery

A new circle proposal can separately opt into approximate distance discovery after choosing to share a general area. This choice defaults off, is hidden without area sharing, is rejected for organizing circles, and appears in the other founder’s review. The server resolves the already shared city/region/country label through the existing broad-place provider, requires an exact normalized area-key match, and stores only a provider area point rounded to two decimal places. It never takes a client-supplied point or copies the proposer’s profile/device coordinates. A failed or ambiguous lookup stops the proposal with a recoverable error; the draft remains available and distance discovery can be switched off.

Migration `0025_circle_distance_discovery.sql` adds the private `area_point` column with an empty default. Existing circles and label-only proposals are not enrolled or backfilled. Listing responses return `nearbyEnabled` and, when the active viewer has a saved place point, a distance rounded up into five-mile bands (minimum five). Neither the circle point nor the viewer’s coordinates/place ID leave this endpoint. Distances are between approximate area points, not participants, homes or meeting addresses. Removing a shared area also clears its point, using the same host guard.

Browse adds Within a distance with 5, 10, 25, 50 and 100 mile choices. Thresholds use five-mile increments so rounded-up distance bands preserve filter inclusion at every supported boundary. The filter covers the same loaded listings as other Browse filters, currently up to 100; it is not a complete regional directory. It requires a saved viewer place point, excludes circles without distance consent, and never filters Joined, Requests or the Together circle picker. Any area remains the default. Missing place data has no distance fallback. Offers, requests, activities, project steps and participation remain member-only and history-bounded.

Tests cover independent consent, provider-only resolution, wrong-region rejection, coarsening, no coordinate disclosure, missing viewer points, distance choices and band boundaries, founder review, pending-circle privacy, member-only content, legacy non-enrollment and removal of both label and point. Browser/device and external provider availability remain unverified.


## Circle conversation viewport recovery

Circle conversations now put Together, activity, purpose/access, alerts, host controls, participants and search inside one Circle tools disclosure, collapsed during ordinary chat. The Together entry shortcut expands both disclosures and either can still be closed manually. The header retains the circle name and Back action; Leave lives inside tools. On mobile and short landscape viewports, the upper controls are capped at 42% of the visible app viewport and scroll independently when expanded. The transcript takes the remaining space and retains vertical touch scrolling. Nested Together content no longer creates another bounded scroller inside those controls. This fixes the prior combination of an unlimited-height context area, a locked outer viewport and a transcript squeezed to almost zero height. Browser/device touch validation remains outstanding.


## Natural page scrolling

The subsequent scrolling revision removes fixed-height and fixed-position chat shells from both stylesheets, including the mobile browser HTML/body lock and the native fixed-height variant. Direct and circle conversations now remain in document flow, like other main screens. Expanded context, circle tools and conversation help grow with the page; typing no longer hides those sections. Mobile transcripts retain their own viewport-aware height (at least ten rem), with scroll chaining into the document at the end of their history. The keyboard measurement sizes only that transcript; it does not reposition or lock the page. Dialog focus containment and temporary background scroll locking remain intentional while a dialog is open. Browser/device validation is still outstanding.
