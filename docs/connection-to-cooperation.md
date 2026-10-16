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
