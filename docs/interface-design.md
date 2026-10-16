# Compact interface direction

Real Love keeps its information and features while reducing the number of decisions and repeated surfaces presented at once. Primary actions remain visible; supporting explanations have specific disclosure labels. Consent, failures, current account status and irreversible-action reviews remain explicit.

Research references:

- Nielsen Norman Group, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Apple, Disclosure controls: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls
- Material Design, responsive canonical layouts: https://m3.material.io/foundations/layout/canonical-examples/overview

## Shared foundations

The design-system stylesheet owns a 44px standard control minimum, 8px control radius, 12px card radius and 14px panel radius. Input, select and textarea text remains 16px. Headings use compact sans-serif hierarchy; brand styling stays intact. Cards share tighter padding and gaps. Supporting disclosures use separators instead of another full bordered panel. Existing focus rings, labels, natural vertical page scrolling, horizontal page clipping and deliberate horizontal controls remain available.

## First pass

- Discover, profiles, notifications, cards and forms share the compact typography and spacing scale.
- Circle creation stays directly accessible. Together retains its visible circle picker and Open Together action; its full explanation is under How it works.
- Circle guide & optional support groups the existing circle privacy, creation guidance and optional worker/collective-action routes. No route or content was removed.
- Area selectors stay visible; their full explanation is under About area filters. Proposal disclosure and distance-sharing consent stay explicit.
- Settings use native expandable groups. Visibility & pause begins open. Safety, account and privacy remain available through labelled summaries and shortcuts; a shortcut opens the destination before scrolling and focusing it. Deletion retains its separate confirmation flow.
- Worker organizing guidance is expandable, with the complete prior explanation retained. The creation and membership consent flows remain unchanged.

## Evaluation

Automated render/action checks cover the new disclosures, direct access to primary controls, full supporting text and settings shortcut opening/focus. The existing functional suite and TypeScript checks cover regressions. There is no measured usability improvement claim: mobile/desktop visual review, keyboard navigation, screen readers, touch and real-user task tests remain necessary. This environment has no supported browser QA surface.

## Second pass: profile and discovery density

Discovery cards keep the member name, broad location, interest cues, introduction and View profile action visible. A way to connect expands the complete first-step answer and availability; the first-step text is no longer truncated inside that expanded area. Full introductions and all other profile answers remain accessible through View profile.

Member profiles retain interests, introductions and the first-step invitation action in the initial reading flow. Activities and availability use an expandable row only when those fields exist. How I communicate and What you share & what to discuss use labelled disclosures containing all prior text, comparison information and caveats. Sparse profiles do not produce empty practical-detail controls. Panels use shared separators instead of successive framed cards.

Saved discovery views remain directly selectable. Only the naming form moves behind Save current filters; browser-storage behavior, account isolation, limits and status feedback remain unchanged. Returning activity continues to expose unread chats and requests immediately. Its styling and campaign cards use the same compact spacing scale without changing navigation, evidence review or participation consent.

Further research references: Nielsen Norman Group, Aesthetic and Minimalist Design (https://www.nngroup.com/articles/aesthetic-minimalist-design/) and Recognition and Recall (https://www.nngroup.com/articles/recognition-and-recall/). The design keeps visible text labels and familiar primary destinations; it does not replace navigation with unlabeled icons. Automated checks are not a substitute for observing new and returning users on phones and desktops.

## Public entry hierarchy

Live desktop review found that the welcome condition used the display label Examples, while route state uses lowercase examples. The full introduction consequently repeated above demo results, individual profiles and every other signed-out destination. It now appears only on signed-out Discover. That entry uses one heading and one demo action; the redundant discovery preview is removed. Interior destinations retain a compact account-entry row, and demo destinations explicitly identify fictional profiles. The introduction, review timing disclosure and friendship/photo privacy explanation remain on the entry page. Signed-in onboarding, approval and returning activity are unchanged.

## Invitation discovery and chat previews

Discover now excludes pending invitations as well as accepted connections. Pending profiles remain accessible in Requests or Sent; accepted profiles remain in Chats. This only filters Discover, leaving saved profiles and profile routes intact. Closed invitations continue to follow existing eligibility and consent rules.

Chat rows explicitly allocate an auto-sized avatar column and the remaining width to the conversation button. Names truncate within their column; invitation context stays one line and message previews stay at most two lines, with long unbroken text contained. Dates continue below names on narrow screens, unread badges retain their reserved space, and full messages remain available inside the conversation.

## Signed-out Circles

Signed-out circle routes now render an account-entry view before mounting the member circle system. This avoids member-list requests, polling, disabled member filters, paused-account messages and retry errors for visitors. A single sign-in action explains profile approval, join requests and the accepted-connection requirement for proposing a circle. The worker resource hub remains available without an account. Signed-in paused members retain their existing reporting and leaving access.

## Review decision proximity

Reviewer assignment now groups the admitted-member selector, required reason, validation guidance and Assign reviewer action. Each report and reviewer-role removal has its own local reason, so text entered for one decision cannot enable another. The remote shared reason panel is removed. Successful actions clear their own reason; failed actions preserve it for retry. Selecting a different reviewer candidate clears the assignment reason. Admission keeps its existing per-applicant reason and eligibility checks.
