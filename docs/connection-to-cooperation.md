# From connection to cooperation

Real Love helps people find their people, then gives them voluntary ways to help, do things and build together. The product test is **Talk → Help → Do → Build**. Friendship remains valuable without participation in another activity. Reciprocity is not a debt, score or obligation.

## First implementation

Inside an accepted, open circle conversation, expand **Together**. Members can post an **Offer**, **Request**, **Activity** or **Project**, with a description and optional timing. A post appears in Together and the existing circle chat. Discuss in chat prepares a reply; it does not send a message or enroll anyone. Authors or hosts can mark a visible post closed. Closing does not delete discussion or certify completion.

Together posts are classified `circle_messages`, not a second group system or a public feed. Migration `0021_circle_together.sql` adds `cooperation_kind` and `cooperation_status` with defaults that preserve existing messages. Reusing message records preserves existing reporting/evidence, author editing/deletion windows, replies, notifications, blocking, account deletion and retention behavior. There are no popularity counts, help rankings or generosity badges.

The circle API exposes `together_list`, `together_post` and `together_close` after its existing active-account, open-circle and accepted-membership guards. Lists omit blocked senders, deleted content and inactive/non-admitted authors. They use the member’s admission history cutoff and cursor pagination. Post insertion rechecks membership, account eligibility and circle state inside the SQL write; retries reuse the existing account/circle-scoped message attempt. Closure rechecks author/host authority and current permissions at write time. Closure updates the viewer-visible conversation revision.

Drafts stay in the existing account- and circle-scoped tab storage with its expiry/cleanup behavior. Sign-out/account deletion clears that namespace; leaving or closing the circle clears its Together draft and retry identity. Requests identify the expected account, and UI request generations prevent superseded responses from replacing the latest list. Failed reads clear prior post content; failed writes keep the draft and retry identity.

## First-version limits

This is low-risk peer discussion and planning: knowledge, time, simple activities and shared ideas. The form explicitly excludes money requests, sales, lending arrangements, hazardous tasks and care/transport for minors. General app conduct rules remain in force. Text filtering and acknowledgement cannot guarantee compliance; report inappropriate posts through the existing message-report route. The app does not verify offers or guarantee safe meetings.

No payments, pooled funds, resource inventories, reservations, lending/dispute process, participant commitments, home-address fields, public post discovery, public participation indicators, or new location disclosure were added. A circle listing never includes Together content. New members receive only posts created after admission, including when an earlier project remains open. Hosts can restate an idea in a new post rather than expose old history automatically.

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
