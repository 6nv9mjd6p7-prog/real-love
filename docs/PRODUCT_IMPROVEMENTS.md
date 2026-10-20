# Real Love improvement plan

This pass adapts the curiosity-first presentation of `6nv9mjd6p7-prog/curious-together-club` at `c19f9192560ecfce692d753c2e1502b274594f3b`. It retains Real Love's server-side identity, access, invitation, membership, and photo-consent enforcement. The reference uses sample data and browser-local state; its instant chats, join toggles, simulated replies, and unverified privacy promises are unsuitable for production reuse.

## Implemented in this pass

- Discovery features one public answer, preferring question, perspective, care, then exploration. Eligible members can ask about that exact visible answer through the existing invitation flow. Sparse profiles retain their introduction fallback.
- Connection context presents conversation ideas from explicit shared interests and public answers before practical information. Missing answers do not generate invented content. Practical differences and optional boundaries remain available in a separate disclosure.
- Advanced discovery uses “Apply this choice” instead of rule terminology.
- Circle entry explains the shared subject before secondary activities and projects.
- Visibility settings compare hiding from discovery with a full interaction pause before their controls.

## Opportunities across the product

These are follow-up proposals, not claims of shipped features or observed usability failures. Preserve the five main destinations and keep discovery led by interests and curiosity.

| Area | Next improvement | Acceptance evidence |
| --- | --- | --- |
| Landing | Test whether visitors understand friendship-first discovery and the fictional demo | Desktop/mobile task walkthrough; no ambiguity about demo people |
| Sign-in | Validate email delivery, expiry, resend and existing-account linking after provider configuration | Real provider checks; existing member retains identity and history |
| Onboarding | Offer optional communication/availability enrichment after first value | Required setup stays short; optional answers can be skipped without penalty |
| Discovery | Refine related-topic suggestions using the existing taxonomy | No invented availability claims; independent filters remain intact |
| Profiles | Review hierarchy and progressive disclosure on narrow screens | Public/private fields and answer context remain correct; readable long answers |
| Chats | Make existing Conversation ideas easier to find for empty accepted chats | Suggestions enter editable drafts; no automatic send or message-content inference |
| Circles | Lead with shared purpose; consider an optional gathering rhythm | Founders agree to listing changes; member-only history stays protected |
| Plans | Add type filters and an upcoming-activities view inside joined circles | Unscheduled, past, cancelled and closed states distinguished; no access expansion |
| Projects | Make the next open step clearer without exposing member-only updates | Role permissions, access loss and concurrent updates remain enforced |
| Returning visits | Add relevant upcoming plans alongside existing recent chats | Server-authorized aggregation; planning does not replace curiosity-led discovery |
| Notifications | Validate device setup, permission denial, mute and delivery independently | Test supported browsers/devices; don't promise native alerts before implemented |
| Safety | Improve identification of blocked entries only with an explicit privacy design | No restored access to blocked profiles; confirmation identifies the intended action |
| Worker support | Keep resources and organizing optional and separate | Ordinary discovery reveals no participation; limits remain accurate |
| Accessibility | Verify focus, disclosure navigation, announcements, contrast and touch controls | Browser and screen-reader checks; source inspection alone is insufficient |
| Mobile/native | Check keyboard, scrolling, uploads, voice cancellation and deep links | Physical-device testing; macOS/Xcode for native compilation |
| Visual system | Consolidate existing style tokens before trialling a warm cream/terracotta/sage direction | Before/after screenshots and contrast checks; no competing override layer |
| Reliability | Preserve retries, draft recovery, request scoping and successful-write handling | Relevant existing suites plus account-switch and offline interaction checks |

## Validation limits

This pass is implementation and automated verification, not a visual audit. Browser screenshots, screen-reader checks, physical-device validation, hosted email delivery, and production deployment require separate evidence. Do not describe this plan as completing all those checks.
