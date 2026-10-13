# Design consistency pass

Profile discovery cards lead with their existing computed connection context, including up to two exact shared topics; the full profile architecture is retained. Recent activity remains accessible in a collapsed disclosure.

Direct chat uses one Conversation details disclosure for communication preferences, photo exchange, and opening context. Photo-exchange controls are consolidated without changing mutual consent, visibility, or revocation logic. A pending request is indicated on the details summary. Report, block, and end-connection actions remain under Options. The inbox shows existing invitation context when present and available, without inventing a shared interest.

Circle cards lead with title, purpose and activity; status and participant count follow. Creation mechanics and optional worker/collective-action paths are collapsed. Worker Support uses three entry cards for peer circles, organizing, and qualified external help. Key organizing limitations stay next to the action; detailed support distinctions and privacy information remain expandable.

Collective Action uses shared segmented tabs and a compact privacy disclosure. Shared disclosure styles and spacing create a quieter secondary layer. Existing native mobile navigation and keyboard handling are preserved. Support cards collapse to one column at narrower widths.

Verification: 40 automated test files and TypeScript passed. Chat render tests verify no automatic communication expansion and a single photo-exchange action. Production build passed. Live browser, visual mobile review, and physical-device keyboard behavior were unavailable and remain unverified. No backend changes or schema migrations.


## Journey refinement

Recent conversations and requests now appear directly above Discover when relevant, with no empty disclosure. Pending requests precede up to two recent conversations; unavailable contacts and private message previews remain excluded. All chats is a single header action, and circle requests take priority over a second circle activity shortcut. Notifications still retain the full activity list.

Removed the repeated cross-screen circle request banner (main navigation retains its count), the duplicate filter reset control, and repeated signup and approval wording. The optional support banner follows discovery content instead of preceding member activity. Required consent, privacy explanations, and the three-step profile flow remain intact.

Validation: rendering regressions, existing automated suite, TypeScript, and production build. Browser/mobile visual verification was unavailable in this environment.
