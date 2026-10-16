# Work & Worker Support

Reviewed against GitHub main on October 15, 2026. Worker support is an optional area within Circles; friendship remains Real Love’s core experience.

## Current flow and privacy

- Industry and local worker circles are discoverable to eligible members. Applicants review the rules and disclosure before requesting admission; a host approves or declines.
- Union-organizing peer circles use the `worker_organizing` category. They stay unlisted after both founders agree. Their listing is visible only to founders, admitted participants, applicants already on file, and named recipients of unexpired private invitations.
- A host can privately invite an active accepted connection. The named recipient must acknowledge participation/privacy limits and accept before message access begins. Invitations expire after seven days. New unsolicited join requests to organizing circles are rejected; existing requests remain reviewable.
- New members see messages from admission onward. Creating any circle never copies direct conversations, private profiles, or photos.
- Worker membership and activity are not added to friendship profiles. Employer information is not collected in a dedicated field; free text can still identify a workplace. Members should avoid identifiable workplace details and confidential documents.
- Unlisted does not mean anonymous or confidential. Existing account identity, notifications, reporting, moderation, retention and blocking rules apply. Messages are not end-to-end encrypted, and people can save copies.
- The app does not operate a recognized union, provide representation, guarantee protection from retaliation, or verify employment or professional credentials. External organizations are independent resources, not claimed partners.

## Data and controls

Migration `0017_amused_tyger_tiger.sql` adds circle categories and membership rules. Migration `0020_private_circle_invites.sql` supports named invitations. Preserve migration order on deployment.

GET `/api/circles?scope=worker` provides worker circles with server-side access checks. General discovery omits unrelated worker circles. The organizing-category access check also rejects known-ID requests from outsiders. Private invitations do not authorize conversation reads until acceptance. Existing account eligibility, two-founder approval, host controls, consent, admission-bounded history, blocking, reporting, and media permissions remain enforced.

## Resources

Original resource links were reviewed October 12, 2026:

- NLRB employee rights and coverage: https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/employee-rights
- OSHA safety and retaliation complaint routes: https://www.osha.gov/workers/file-complaint
- EEOC discrimination process: https://www.eeoc.gov/filing-charge-discrimination
- AFL-CIO organizing information: https://aflcio.org/formaunion
- Legal Services Corporation directory: https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help

Restored from the earlier worker branch and opened successfully October 15, 2026:

- Worker.gov resource directory: https://www.worker.gov/
- Department of Labor Wage and Hour Division worker resources: https://www.dol.gov/agencies/whd/workers

At that check, Worker.gov displayed a notice that updates were suspended. Its app description discloses that limitation. Check coverage, procedures, eligibility and deadlines with the relevant provider. Links use HTTPS, no-referrer and noopener/noreferrer; the app does not send referrals or case details.

## Verification limits

Automated API tests cover worker access, invitations, consent and message history. Render tests cover resources and disclosures. The release must pass TypeScript and a production build. Browser, real-device and live multiple-account QA remain separate checks; passing automated tests is not a security or accessibility certification.

## Not offered

Confidential workplace-specific organizing, anonymous identities, verified advisers, formal representation, partner referrals, and retaliation-response services are not offered. Unlisted circles and named invitations do not provide those guarantees.
