# Collective Action: reviewed consumer boycotts

Entry points: Circles → Collective Action, and Work & Worker Support → Explore Collective Action. Route: `#circles/action`.

Members with active, admitted profiles can submit company-focused proposals with documented claims, a specific demand, uncertainties/responses, alternatives and financial interests, one to five HTTPS sources, and a future review date within 90 days. Proposals are not published automatically. No example accusations, real campaigns, partners, or memberships are seeded.

Existing authorized reviewers access a Review view in this area. Independent review uses the app's connection/block conflict checks and prohibits self-approval, including by the owner. A reviewer records an explanation and confirms source/safety review before approval, renewal, rejection, pause, completion, or feedback disposition. There is no automatic claim-verification service. Hosting does not imply platform endorsement.

Participation records are durable and private to the participant through the API. No roster, aggregate count, feed event, friendship-profile field, or push notification is produced. Authorized system operators still have database access. Joining records intent; purchases are not tracked. Leaving remains available to suspended or paused members. Deleting an account removes its participation, redacts its feedback, and withdraws/redacts its proposals while removing participation attached to those proposals.

Corrections, responses, concerns and progress submissions go into a private review queue. Submitters can see their own feedback on accessible campaigns; campaign proposers cannot see others' feedback unless independently authorized as reviewers. Reviewers publish their reviewed summary, not raw submissions. Published decisions remain in the campaign history. Restricted access is not a promise of anonymity, confidentiality or end-to-end encryption. No response SLA is promised.

Past-due active campaigns disappear from general discovery and reject new participation on the server. Their proposers, existing participants and reviewers can still access them. Renewing requires a new future review date. Reviewer writes use version checks and an atomic batch with unique versioned events to reject stale decisions. All writes require same-origin JSON and an exact account identifier; existing quotas, admission and reviewer checks apply. Source links use HTTPS and no-referrer/noopener. Links are not fetched or embedded by the server.

The area supports consumer purchasing choices; it does not implement strikes, formal union representation, fundraising, professional advice, verified company representatives, or public user-generated campaign posting. Current lists cap at 100 campaigns. Campaign text cannot be directly edited after submission: corrections use the review queue; a materially revised proposal can be withdrawn and replaced subject to the proposal quota.

Schema: additive migration 0018 adds campaigns, private participation, feedback and review updates. Existing migration 0017 (worker support) is retained. Production migration is handled by Sites publication.

Verification: the SQLite-backed campaign integration suite covers authentication/origin/account checks, invalid links/dates, proposal privacy, independent authorization, stale reviews, private and idempotent joining, feedback privacy/publication, pause/expiry, leaving while suspended, withdrawal, and account deletion. All 38 automated test files passed and TypeScript validation passed. Browser automation was unavailable: responsive appearance and real interactive browser journeys have not been visually verified.
