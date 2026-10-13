# Work & Worker Support — unpublished first version

## Inspected baseline

Real Love Sites source, commit ea531a9aa6c779aacc58b27560e40c23a2cea6ee (version 73). Read the repository README, release checks, circle UI/API, identity/admission helpers, profile routes, notifications, schema, and permission tests. No AGENTS.md was present in the checkout or task workspace.

The app runs React/Vinext on Cloudflare with D1 and existing email/ChatGPT authentication. It already has admitted-account checks, two-founder circle approval, host-controlled admission, a 30-person limit, blocks, reports, moderation, private media controls, and group history boundaries. General circle listings are discoverable to active eligible members; they are not hidden workplace spaces.

## Screens and flow

1. Circles retains its existing position among the four primary tabs. An optional Work & Worker Support entry opens `#circles/work`.
2. The resource hub explains peer discussion, professional advice and representation separately. Topic selection filters five external US resources. No intake form, employer input, partner claim, professional badge, enrollment action, or case referral is added.
3. Explore worker circles opens industry/local circle browsing, Joined and Requests, using the existing component. Empty lists stay empty: no invented groups or membership counts.
4. A member proposes a circle with an existing accepted connection, chooses industry/local, supplies a purpose and admission rules, and explicitly acknowledges the rules and disclosure. The proposal is visible only to its founders until the other founder separately agrees.
5. An open listing is visible to eligible members browsing worker support. A member reviews rules/disclosure before applying; a host approves or declines. The existing group chat starts fresh. New members see messages from their admission onward. Host tools, reports, leave/withdraw and close actions use existing endpoints.
6. Deep links and existing generic notifications open the circle through the existing circle route. Leaving a worker conversation returns to the worker area. No additional main navigation tab is added.

## Data and backend controls

Migration `0017_amused_tyger_tiger.sql` adds two columns to existing circles: `category` (default `friendship`) and `membership_rules` (default empty). Existing circles retain their behavior. Drizzle schema, snapshot and journal are updated. No new service, runtime secret or paid dependency is introduced.

Only friendship, worker_industry and worker_local categories are accepted by the proposal API. Workplace/hidden categories are rejected. Worker proposals require admission rules and an explicit consent boolean. Worker approval and join requests also require consent. These checks occur server-side, alongside existing authentication, request-origin checks, account checks, rate limits and membership/host restrictions.

GET `/api/circles?scope=worker` selects worker circles. Default discovery excludes unrelated worker circles in SQL; a person's own worker memberships/proposals are still returned to that account for Joined, Requests, alerts and conversation deep links. Default Browse filters these personal entries out. Worker metadata is never added to friendship profiles. Circle category cannot be changed through the API after creation.

The same server membership checks protect text, voice, replies, reactions and group reads. Direct chats and circle messages remain separate tables; creation never copies direct messages, full profiles or photos. Responses use no-store headers. Existing account deletion and moderation paths apply to all circles regardless of category.

## Privacy implications

Worker listings are discoverable, not secret. Listing title, purpose, tags, activity, rules and count are shared with eligible worker-area visitors. Hosts see applicants' chosen names; participants see chosen names and group posts. Existing account identity is reused: no anonymous identity or employer verification is claimed. There is no employer field; users can still disclose identifying information in free text and are told not to place sensitive workplace details there.

Membership is not publicly attached to friendship profiles. The app's ordinary account activity logs and generic circle notifications still apply. Messages are not end-to-end encrypted. Reports can retain evidence; authorized review and people saving copies prevent any promise of complete confidentiality. Blocking hides the blocked person's messages and member entries from each other, but other participants can still see both. Leaving does not recall already posted content or saved copies. The hub and admission screens disclose these limits.

Host rules require respectful discussion, no coercion/retaliation, no disclosure of others' private information, and clear separation of peer experience from advice. Existing platform reporting/moderation remains available, without a promised response time. Host admission does not verify employment, professional qualifications or organizer trustworthiness.

## External resources

Opened and checked on October 12, 2026; these are independent resources, not partners. Links use HTTPS, no-referrer and noopener/noreferrer. No embeds, tracking links, resource-specific analytics or submissions are added.

- NLRB employee rights and statutory coverage: https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/employee-rights
- OSHA safety and retaliation complaint routes: https://www.osha.gov/workers/file-complaint
- EEOC discrimination process: https://www.eeoc.gov/filing-charge-discrimination
- AFL-CIO organizer contact route: https://aflcio.org/formaunion
- Legal Services Corporation civil legal aid directory: https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help

The app directs visitors to check coverage, availability, eligibility and deadlines with the source. It does not assess individual claims. The Department of Labor pages returned 403 during review and were omitted rather than marked reviewed.

## Verification and release status

- Existing 36 test files passed, including the full SQLite-backed app-flow suite. New worker scenarios in that suite exercise proposal consent, unsupported categories, pending proposal privacy, backend discovery separation, outsider and pending-applicant denial, host-only admission, message-history boundaries, unchanged friendship profile payloads, blocking, removal, and circle closure.
- A new worker-support test passes: server-rendered hub disclosures, external link controls, no intake/embeds, explicit proposal consent and native route acceptance. Circle-card and navigation tests also cover the new rules and optional route.
- TypeScript validation and production build passed during implementation; final saved artifact is built from the final source.
- Browser automation was unavailable. Visual layout, interactive browser journeys and real iOS/Android devices remain unverified. Render tests are not a substitute for browser QA.
- Nothing is deployed. Production data and schema are unchanged. The migration must accompany a future authorized release; a saved build alone does not activate these features.

## Deliberately incomplete

Workplace-specific hidden circles, restricted discoverability/invitation infrastructure, verified advisers, union representation, partner/referral integrations, and retaliation-response services are not implemented. The UI explicitly labels them unavailable. Before workplace-specific organizing is introduced, design invitation/discovery and identity-disclosure controls, notification and audit-data exposure, moderation responsibilities, and retention/deletion expectations. No membership in The Common Human is required or created.
