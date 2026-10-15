# Social app reference reviews

This sequence records patterns to study, not features to copy wholesale. Real Love must retain consent-first connections, optional disclosure, and privacy boundaries.

## 1. Bluesky — onboarding and discovery

**Reference:** [Bluesky Social App](https://github.com/bluesky-social/social-app), especially its onboarding flow for selecting interests and exploring suggested accounts and starter packs.

**Applied to Real Love:** Profile interests now appear as compact, optional quick filters in Discover. Selecting one only narrows eligible profiles. Discovery cards explain the exact interests or related interest area behind the suggestion, using the member's stated selections. These controls do not follow, invite, or message anyone, and interest overlap is not presented as a compatibility score.

**Validation:** Render tests cover selected/unselected shortcut states, the no-interests case, and readable related-interest context. Type checking and the production build are part of the release verification.

**Next reference:** Mastodon.

## 2. Mastodon — notification quick filters

**Reference:** [Mastodon](https://github.com/mastodon/mastodon), whose notification settings offer a configurable quick-filter bar in addition to detailed notification-type controls.

**Applied to Real Love:** Recent activity can be narrowed to All, Chats, Connections, Circles, or Account. Unread counts stay attached to each category; choosing a filter does not mark activity read. An empty category offers a direct way back to All. Future and unrecognized notification kinds remain visible in Account.

**Validation:** Category mapping and unread-count tests, web/native notification-layout render tests, full automated suite, type checking, and production build.

## 3. Misskey — saved, reusable feeds

**Reference:** [Misskey](https://github.com/misskey-dev/misskey), especially [Antenna creation](https://github.com/misskey-dev/misskey/blob/develop/packages/frontend/src/pages/my-antennas/create.vue) and [timeline shortcuts](https://github.com/misskey-dev/misskey/blob/develop/packages/frontend/src/pages/timeline.vue). Misskey lets people create named Antennas from filter rules and reopen them from the timeline.

**Applied to Real Love:** Members can save up to eight named Discover views containing the current filters and search text, restore a view with one tap, and remove old views. Views are stored only in browser local storage, are separated by account, and are cleared when signing out or switching accounts. This is separate from Saved people and does not add people, send invitations, or alter ranking.

**Validation:** Saved-view persistence, account isolation, duplicate names, capacity limit, removal, malformed storage, existing discovery preferences, and production build checks.

## 4. Pixelfed — image descriptions

**Reference:** [Pixelfed](https://github.com/pixelfed/pixelfed), including its [photo composer](https://github.com/pixelfed/pixelfed/blob/dev/resources/assets/js/components/ComposeModal.vue) and [photo presenter](https://github.com/pixelfed/pixelfed/blob/dev/resources/assets/js/components/presenter/PhotoPresenter.vue), which support descriptive alt text for uploaded media.

**Applied to Real Love:** Profile owners can optionally write a concise description for their photo. Assistive technology receives it in the enlarged photo view only after both members agree to share photos. It is omitted from discovery, public profile payloads, and circles. Photo text is part of the saved profile and follows profile validation and moderation checks.

**Validation:** API checks verify descriptions stay out of discovery and remain hidden until mutual photo consent; after consent, the connection receives the description. Full flow tests, type checking, and production build.

## 5. Element Web — in-chat search

**Reference:** [Element Web](https://github.com/element-hq/element-web), whose [recent releases](https://github.com/element-hq/element-web/releases) include tokenizer support for message search. The [search PR](https://github.com/element-hq/element-web/pull/33048) shows how much language-aware indexing matters for multilingual chat.

**Applied to Real Love:** A collapsed “Search this chat” control searches messages in the current accepted direct conversation, including older history without requiring people to load each page. Search is bounded to 30 recent matches, requires at least two characters, treats wildcard characters literally, and excludes deleted messages. Circle messages are not included, and existing access checks still apply.

**Validation:** API flow tests cover match results, membership enforcement, minimum query length, and deleted-message exclusion. Render tests verify the collapsed, clearly labeled search entry point; full suite, type check, and production build are release checks.

## 6. Patchwork — local-first and small-network sharing (historical review)

**Reference:** [Patchwork](https://github.com/ssbc/patchwork) was a decentralized Secure Scuttlebutt client. Its README emphasizes offline access to locally stored data, sharing primarily within a followed network, and encrypted private messages. The repository is archived, and its [final release](https://github.com/ssbc/patchwork/releases) says development ended and users should move to another client as its dependencies age.

**Fit for Real Love:** Two adjacent patterns already exist: unfinished messages are kept in tab-local storage, and circles require explicit membership approval with their own access rules. Real Love is server-hosted, however, and its direct chats are not end-to-end encrypted. Patchwork’s network architecture and encryption claims therefore do not transfer to this app, and its retired code is not a safe implementation source.

**Decision:** No feature or code copied. Keep improving local recovery and clear privacy explanations within Real Love’s current hosted model; do not imply that tab-local drafts make chats offline-capable or that chats are encrypted end to end.

## 7. Lemmy — community controls and moderation transparency

**Reference:** [Lemmy](https://github.com/LemmyNet/lemmy) is an open-source discussion platform organized around communities. Its [official overview](https://join-lemmy.org/) highlights user-controlled feeds, blocking and filtering, and moderation actions that can be viewed in a mod log.

**Fit for Real Love:** Real Love already has Discover filters, member blocking, circle-specific membership rules, reporter-only receipts with case status, and a restricted review log. These cover the relevant needs without turning worker-circle activity or complaints into a public feed.

**Decision:** No additional product code copied. Keep report outcomes visible to the person who submitted the report and review records restricted to authorized reviewers. A public log would add little over the existing safeguards while risking disclosure of sensitive circle participation or reports.

## 8. Discourse — trust levels and scoped community roles

**Reference:** [Discourse](https://github.com/discourse/discourse) uses activity-based trust levels that progressively unlock features and limited moderation permissions. Its [trust-level guide](https://meta.discourse.org/t/discourse-trust-levels-a-detailed-explanation/396792) describes levels based on reading and participation, with higher privileges at later levels.

**Fit for Real Love:** Real Love already scopes circle powers to hosts of that circle, while safety reviewers use a separate permission. It also has staged admission and orientation. These explicit roles fit better than deriving influence from activity totals.

**Decision:** No new role ladder or activity scoring. Automatically rewarding time spent, messages sent, or reactions could pressure people to post and would not establish trustworthiness. Keep permissions explicit, limited to the task, and reviewable.

## 9. Mobilizon — group events and participation controls

**Reference:** [Mobilizon](https://joinmobilizon.org/) supports group-based event coordination. Its [event guide](https://docs.mobilizon.org/1.%20Use/Events%20and%20Activities/1.create-events/) describes event visibility, participation approval and capacity, while its [group guide](https://docs.mobilizon.org/1.%20Use/groups/create-group/) describes invitation and approval controls for group membership.

**Fit for Real Love:** Circles currently have one free-text “Next activity” field and private group chat, but no event dates, RSVP state, attendance cap, or event visibility setting. The idea of making participation and visibility explicit fits the app; importing a public event directory, precise location collection, or automatic attendee exposure does not.

**Decision:** No product code copied in this review. A real event feature should be circle-only by default, reveal participation only to admitted circle members, make attendance optional, and avoid collecting an exact location. Scheduling and RSVP state need a deliberate product design and access-control review before implementation; the current free-text activity remains the lightweight prompt.

## 10. Hinge — profile prompts as conversation entry points

**Reference:** [Hinge’s matching guide](https://help.hinge.co/hc/en-us/articles/360011090134-Wie-treffe-ich-jemanden-und-fange-an-zu-chatten-) describes sending a Like from a specific profile detail and adding a comment. Hinge’s [Prompt Feedback overview](https://hinge.co/en-gb/newsroom/prompt-feedback) also frames prompts as a way to help people express themselves in their own voice and make profiles easier to respond to.

**Fit for Real Love:** This pattern already exists in a consent-first form. Profile answers, introductions, and “something I’d enjoy doing together” have contextual “Ask about…” actions. Selecting one carries that answer into the invitation flow, so a person can explain what they want to discuss instead of sending a generic opener. The app still requires the recipient to accept before a conversation opens.

**Decision:** No additional feature copied. Keep these contextual invitation actions visible and preserve the chosen answer in the draft; avoid turning them into one-tap likes, response quotas, or activity scores. Existing profile render and invitation-context tests cover the behavior.

## 11. Bumble — member-controlled conversation starters

**Reference:** Bumble’s [Opening Moves](https://bumble.com/en/features/opening-moves/) lets members choose or write a question on their profile for a connection to answer. Bumble says the feature is intended to lower the pressure of starting a conversation; its help page also explains that a response can open the chat.

**Fit for Real Love:** Real Love has a more deliberate version of the same affordance: people can select an answer or interest from the other person’s profile, write an invitation around it, and the recipient chooses whether to accept before chat opens. This keeps the person’s chosen disclosure and the recipient’s consent in the same flow.

**Decision:** No new “Opening Move” setting added. The current flow already offers profile-based openers without requiring people to keep a separate prompt current or changing who may initiate. Keep the choice optional and preserve the answer snapshot in the invitation so later profile edits do not rewrite what was originally shared.

**Validation:** Existing profile-view and invitation-context tests cover the prompt actions and context selection; invitation flow tests cover the stored invitation context.

## 12. Tinder — interest discovery and pre-connection safety

**Reference:** Tinder’s [Explore](https://www.help.tinder.com/hc/en-us/articles/38094560737677-Explore) organizes profiles around shared interests or experiences. Its [reporting guide](https://policies.tinder.com/web/safety-center/tools/how-to-report/intl/en/) documents reporting someone from their profile before matching.

**Fit for Real Love:** Both patterns already have equivalents: Discover can be narrowed by profile interests and related categories, and a profile can be reported or blocked before an invitation is accepted. Real Love keeps those controls attached to deliberate profile browsing rather than making rapid swipe decisions the primary interaction.

**Decision:** No additional discovery tiles, swipe queue, or paid-priority mechanic copied. Keep interest filters optional and member-controlled; keep reporting and blocking available before connection. Tinder’s paid Likes and prioritization tiers do not fit Real Love’s current pilot model.

**Validation:** Existing discovery-filter, profile-action, and reporting tests cover the relevant behavior.

## 13. Signal — make privacy guarantees legible

**Reference:** Signal documents end-to-end encryption as the default for Signal conversations and makes read receipts optional. Its disappearing-message guide warns that a recipient can still preserve a copy outside the app.

**Applied to Real Love:** Real Love is not end-to-end encrypted, and its direct-chat privacy explanation was nested inside the broader conversation-help disclosure. Circle chats did not state this limitation in the conversation itself. Privacy information is now a separate, one-tap disclosure for direct chats and circle chats. The circle copy also clarifies that admitted members can see messages available to them and that reported content may be retained for safety review.

**Decision:** Keep “Sent” distinct from “Read”; it means saved by the app and is already explained to members. Do not add read receipts or disappearing messages as if they guarantee privacy. Signal’s encryption model is architectural and cannot be borrowed through a UI change; Real Love continues to state its actual limits plainly.

**Validation:** Direct-chat render tests and worker-support tests verify that both chat types expose the non-encryption disclosure. Conversation, circle, and worker privacy regression tests pass.

## 14. Nextdoor — local relevance without address collection

**Reference:** Nextdoor’s [sign-up page](https://nextdoor.com/) says neighbors verify their address to join a local neighborhood network. Its [About page](https://about.nextdoor.com/) describes local news, recommendations, alerts, and events organized around neighborhoods.

**Fit for Real Love:** Real Love already supports a member-selected broad area, an adjustable nearby radius, and approximate distance labels. Its location editor asks permission only when someone chooses “Use my current area,” converts device location into suggested cities or general areas, and requires the member to select an area before saving. This works for optional nearby discovery without requiring a home address.

**Decision:** Keep location optional and member-selected. Do not copy address verification or reveal precise location to establish local relevance. Continue describing distances as approximate and keeping exact device coordinates out of profile display. No additional product code was needed for this review.

**Validation:** Location editor permission and place-selection tests, nearby-radius preference tests, and location privacy checks cover the current flow.

## 15. Discord — channel-scoped message search

**Reference:** Discord's [message search guide](https://support.discord.com/hc/en-us/articles/115000468588-How-to-Use-Search-on-Discord) describes searching within the current server, channel, or DM and refining by author, date, and content type. Search results can jump back to the selected message.

**Fit for Real Love:** Circle conversations needed the same basic retrieval affordance already available in direct chat. Circle members can now search their current conversation for a word or phrase, see recent matching text with author and timestamp, and open a result at its original point in the conversation.

**Applied with Real Love's access rules:** Search is restricted to the open circle and current admitted members. It honors the member's join-time history boundary, excludes deleted or senderless messages, and hides messages from blocked members. Results are limited to 30 recent matches; voice-note audio is not transcribed or searched. The interface states that results only cover history available to that member.

**Decision:** Keep search scoped to the currently open circle. Do not let search reveal messages from before admission or after leaving, and do not add cross-circle search in this pilot.

**Validation:** Circle-flow tests cover applicant and former-member denial, join-time history boundaries, minimum query length, and finding permitted messages. UI checks verify the circle search control, history-limit explanation, and stable message targets for navigation.

## 16. Reddit — community purpose and behavior rules

**Reference:** Reddit says community-specific rules clarify what belongs, how people should participate, and what moderators may enforce. Its help pages also describe posts and comments being sorted by relevance, votes, and recency.

**Fit for Real Love:** Circle cards already explain a circle's topic and first activity, and the app already asks worker circles to define admission rules. General-interest circles had no way to set or review shared discussion expectations before joining.

**Applied:** Circle creators can now add optional guidelines using the existing circle rules field. They appear on the circle card, in the join-request review, and in the conversation's purpose and access section. Circle search also checks guideline text. Existing worker-circle admission and privacy rules stay in their current flow.

**Decision:** Do not add votes, karma, or activity-based ranking. Those signals can make popularity look like trust and reward frequent posting; Real Love keeps circles chronological and permissions explicit.

**Validation:** Circle-flow tests verify guideline persistence. Circle-card and circle-discovery tests verify that people can read the guidelines before requesting and search for circles using the guideline text. Existing worker-circle consent tests continue to cover their separate mandatory rules.

## 17. Facebook Groups — privacy scope and administrator controls

**Reference:** Facebook documents public, restricted, and private group access, with membership visibility that can extend beyond the group depending on its privacy settings. Its group community chats are an extension of the group and do not use the same privacy guidelines as Messenger chats.

**Fit for Real Love:** Circles already require a host decision before a request becomes membership, separate group messages from direct chats, limit history to messages after admission, and explain that group chat is not end-to-end encrypted. Circle membership is not published on general profiles. Hosts have circle-scoped controls rather than broad platform administrator privileges.

**Decision:** No new access mode copied. Publicly discoverable circle listings should not make membership or private group history public. Keep the current explicit request-and-approval flow, and state group-chat privacy in the circle itself. Event visibility and attendee lists remain a separate feature decision, already covered in the Mobilizon review.

**Validation:** Existing circle-flow, admission-history, membership visibility, block, and in-chat privacy tests cover these boundaries. No product code change was needed for this reference.

## 18. WhatsApp Communities — umbrella groups and quieter notifications

**Reference:** [WhatsApp Communities](https://www.whatsapp.com/communities/) groups related chats under a shared community, with an admin announcement space and smaller topic groups. Members can respond to announcements, while the announcement space remains admin-led. WhatsApp also lets members mute an individual group without muting the entire community.

**Fit for Real Love:** Real Love circles already provide topic-specific group conversations, host-scoped controls, join approval, and a per-circle phone-alert mute. The in-app notification center also offers a global circle-alert control. Each circle is intentionally its own small group, rather than a subgroup in a larger community hierarchy.

**Decision:** No umbrella community, broadcast-only channel, or cross-circle announcement feed added. A hierarchy could make membership and host authority less clear, and cross-circle announcements could expose participation or send unwanted alerts. Keep the existing per-circle mute, global circle-alert mute, and member-approved admission boundaries. Revisit announcements only if pilot members show a concrete need to coordinate across several circles.

**Validation:** Inspected the circle conversation alert control, global notification controls, notification API scope validation, and per-chat mute authorization tests. Existing coverage verifies scoped mute behavior and keeps muted activity in the in-app inbox. No product code change was needed for this reference.

## 19. Instagram — discoverability with user control

**Reference:** Instagram's [Explore ranking explanation](https://transparency.meta.com/features/explaining-ranking/ig-explore/) describes a personalized recommendation system. Meta says Instagram's [Your Algorithm](https://about.fb.com/news/2026/05/new-supervision-tools-parents-insights-teens-algorithm/) lets people adjust topics to see more or less of them in Reels and Explore, with availability varying by region and surface.

**Fit for Real Love:** Discover already allows people to switch between shared interests and all eligible people, filter by interests and other stated preferences, save reusable filter views, see why profiles appear, and review how fixed ranking works. It does not infer interest from passive engagement or use an opaque personalized feed.

**Decision:** No algorithm-feedback menu or engagement-based personalization added. Instagram's direct topic controls are useful when a platform ranks a large content feed; Real Love already gives people explicit, reviewable discovery choices. Keep profile order based on clearly explained shared interests, broad-area proximity, activities, and availability. Continue making filters narrow results without changing eligibility or silently broadening them.

**Validation:** Inspected discovery filtering and sorting, saved-view persistence, the “Why these profiles appear” disclosure, profile filter language, and existing discovery ranking tests. No product code change was needed for this reference.

## 20. TikTok — recommendation controls and discovery feedback

**Reference:** TikTok explains some signals behind its [For You recommendations](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en) and offers [Manage Topics](https://support.tiktok.com/en/account-and-privacy/account-privacy-settings/manage-topics) to adjust how often topics appear. People can mark content “Not interested” or [refresh the For You feed](https://support.tiktok.com/en/account-and-privacy/refresh-your-for-you-feed) to change recommendations.

**Fit for Real Love:** Real Love already explains why profiles appear, exposes shared-interest and all-eligible discovery modes, provides explicit filters, and lets members reset those filters. Its ordering is based on profile details the member can inspect, rather than inferring attraction or compatibility from watch time, likes, or other engagement.

**Decision:** No swipe-style feedback or engagement-trained recommendations added. TikTok’s controls address a fast-moving media feed; Real Love’s existing filter and reset controls give people direct, reversible choices without treating a person as content to rank by popularity. Keep eligibility boundaries and the ranking explanation visible, and continue to treat shared interests as conversation openings rather than compatibility claims.

**Validation:** Inspected discovery filter state and reset behavior, saved views, the ranking explanation, and `compareDiscovery` tests for interest overlap and general-area ordering. No product code change was needed for this reference.

## 21. Snapchat — audience-scoped sharing and location privacy

**Reference:** Snapchat lets people choose specific friends for Snap Map location sharing, including turning sharing off with Ghost Mode ([Snapchat Support](https://help.snapchat.com/hc/en-us/articles/7012309470740-How-do-I-share-my-location-on-Snap-Map)). This is a useful reminder that sensitive sharing should have a clear audience and an easy off switch.

**Fit for Real Love:** Real Love's profile-photo exchange is explicitly connection-scoped and each person can revoke their own consent. The server only updates consent for accepted connections, clears both permissions when a connection closes or a member blocks someone, and uses the consent state to gate shared photos. Real Love also uses a confirmed general area rather than live map location.

**Decision:** No Snap Map or ephemeral-message feature added. Real Love's existing mutual, revocable consent is the better fit for relationship-focused profile photos; live location would add exposure without supporting the app's core purpose. Continue to explain that revoking access stops future in-app viewing but cannot erase copies someone already saved or captured.

**Validation:** Reviewed `photo_consent`, connection closure, and block handling in `app/api/app/route.ts`, along with existing photo-consent and connection lifecycle tests. No product code change was needed for this reference.

## 22. LinkedIn Groups — distinguish group privacy from profile visibility

**Reference:** LinkedIn explains that public group activity can be seen beyond the group, while private group conversations are limited to members; members may still see one another's activity within the private group, and group information can influence feed recommendations and advertising ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a551116)).

**Fit for Real Love:** Work & Worker Support is an optional area. Its disclosure explains which circle details are visible while browsing, what hosts see in applications, and what admitted members can see. It also states that opening the area does not label the friendship profile, there is no employer field, and access controls do not guarantee anonymity or confidentiality.

**Decision:** Keep worker-circle activity out of public profiles and general social activity. Preserve specific, in-context disclosure about what is visible to eligible browsers, hosts, and members; do not describe private circles as anonymous or confidential. LinkedIn's feed and ad use is a reminder to avoid implying that circle activity stays within the circle if the product later adds social recommendations or advertising.

**Validation:** Reviewed `app/worker-support.tsx` privacy disclosures, worker-circle access rules, and existing circle membership and visibility tests. No product code change was needed for this reference.
