# Forward and backward navigation

`native-links.ts` now contains route context and app-owned history helpers. Hash routes keep general circles and worker-circle browsing, tabs, creation, and detail pages distinct. History markers include the account, current route, and parent route. Browser traversal preserves existing markers. App Back uses browser history for a known internal parent; direct entry or a different account uses a safe replacement destination instead of leaving the app or pushing another Back entry.

## Journeys

- Discover/Saved/inbox/chat → profile → Back restores the origin and available scroll context; inbox section hashes are retained.
- Chats → circle proposal uses an explicit creation route and co-founder context.
- Circles Browse/Joined/Requests → circle conversation → Back returns to the prior destination. Conversation Back has a visible destination label and cancels pending conversation reads.
- Worker Support → worker browsing → worker tabs → worker conversation retains worker scope across remounts, refresh, and traversal. The resources return control goes to the named Worker Support hub.
- Circle proposals use explicit creation routes. Their text/co-founder fields are stored only in account-scoped drafts in this tab; cancel keeps text, successful submission clears it, and worker consent is not persisted.
- Worker Support/general Circles → collective action returns to the entry context. Campaign tabs, details, and proposal views have browser history entries. Area Back skips internal campaign views; campaign-list Back returns one view. History stores navigation only, never proposal text or consent.
- Campaign proposal text is preserved in account-scoped tab drafts. Restoring a draft or proposal view resets consent. Successful submission replaces the proposal view with My activity.
- Restored campaign IDs are refetched through the same server scope permissions as paginated lists, so older details can be restored without retaining unauthorized cached content. Unavailable details offer a return to the list.

Back controls use explicit destination labels, and conversation headings wrap on narrow screens. Existing focus movement and scroll restoration remain in the app shell; hash routes now use their full context rather than a generic inbox key.

## Validation and limits

Tests simulate Forward/Back/Forward, account boundaries, fallback replacement, worker detail/tab routes, exact resource returns, and campaign view history. API tests cover older detail lookup and publication/ownership restrictions. Existing circle proposal/privacy/draft tests remain in the suite. TypeScript and production build are required. Actual browser/native visual behavior is unverified because browser QA is unavailable. This work does not establish the cause of the separately reported duplicated campaign page; the source contains a single campaign mount.
