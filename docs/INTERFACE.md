# Interface foundation

The interface rebuild retains the existing authentication, API routes, database schema,
accounts, messages, safety rules, and account-scoped draft storage.

## Ownership

- `app/interface.css`: shared tokens, controls, application shell, discovery, profiles,
  settings, secondary screens, public home, and sign-in.
- `app/chat-layout.css`: conversation structure, message presentation, composer sizing,
  practice chat, and the fictional development preview.
- `app/main-navigation.tsx`: three primary destinations and accessible activity badges.
- `app/love-app.tsx`: existing application state and actions, with secondary navigation
  for Chats/Circles and Profile/Settings.

`app/layout.tsx` loads only the two interface stylesheets. The historical
`globals.css`, `design-system.css`, and `screen-polish.css` are not loaded. Do not
reintroduce those layers or add another stylesheet of screen overrides. Add styles
to the relevant feature section in the two active stylesheets instead.

## Navigation

- Discover includes Explore, Saved, search, questions, and thought-based discovery.
  Recent conversations are collapsed; saved-search tools live in Filters or Saved.
- Chats contains Conversations and Circles. Incoming requests and sent invitations
  remain distinct sections. Circle requests contribute to the Chats badge.
- Profile contains profile editing and Settings & privacy. Notifications and safety
  review retain their existing entry points and permissions.

Existing hash routes and native deep links remain valid. Navigation does not save a
profile or discard its draft. Account mutations still call the existing server APIs.

## Layout and validation

Non-chat screens use document scrolling. Open mobile conversations use one visible
viewport, an in-flow header and tabs, a scrolling transcript, and an in-flow composer.
Browser viewport measurements and native keyboard measurements feed the same height
boundary. The viewport uses scale 1 and allows pinch zoom. Safe-area spacing is applied
at screen edges and mobile navigation.

Run `pnpm test`, `pnpm typecheck`, and `pnpm build`. Check phone and desktop layouts for
Discover, Chats, requests, Circles, profile sections, Settings, sign-in, and the public
home. Chat QA must include keyboard opening/closing, long drafts, replies, attachments,
and older-message scroll position. Use fictional fixtures for account mutation controls;
never use real account data as a visual fixture. Physical Capacitor/iPhone QA remains a
separate device check.
