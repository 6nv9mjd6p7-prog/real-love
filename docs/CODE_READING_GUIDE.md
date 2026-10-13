# Reading the Real Love code

## Follow one request

1. `app/page.tsx` runs on the server, resolves the current identity, and passes the account ID and sign-in options to `LoveApp`.
2. `app/love-app.tsx` runs in the browser. State holds the profile, discovery results, connections, current route, and unfinished form values.
3. A user action calls `api` or a feature-specific API helper. JSON includes `expectedAccount` to detect a sign-in change while an old page remains open.
4. `app/api/*/route.ts` receives the request. It resolves identity again, validates input, checks access, and runs database operations.
5. The response updates the client. Request gates reject stale results; message delivery distinguishes an accepted write from a failed refresh.

## Syntax, line by line

These recurring forms appear throughout the code. One physical line sometimes contains several statements; follow semicolons and braces when reading those dense sections.

| Code form | What the line does | What to check |
| --- | --- | --- |
| `'use client'` | Marks the module as part of the browser-facing React tree. | Do not import server credentials into this tree. |
| `import {name} from './file'` | Makes another module's exported value available locally. | Relative paths identify nearby app logic; package names identify dependencies. |
| `type X = ...` / `interface X` | Describes expected values for TypeScript. | Types do not validate network or database input at runtime. |
| `const [value, setValue] = useState(...)` | Creates UI state and its update function. | An update schedules a render; it does not save to the database. |
| `useRef(...)` | Keeps a mutable value across renders without triggering a render. | Used for DOM nodes, request identity, scroll position, and in-flight guards. |
| `useEffect(() => {...}, [...])` | Runs synchronization after rendering when dependencies change. | Cleanup removes timers/listeners; account and scope changes must invalidate old work. |
| `return () => ...` inside an effect | Supplies cleanup for replacement or unmount. | Do not leave polling, microphone tracks, or listeners active. |
| `useCallback(...)` | Stabilizes a callback until its dependencies change. | Missing dependencies can retain stale account or form values. |
| `async` / `await` | Waits for asynchronous work inside a function. | Two requests can still interleave while one waits. |
| `try / catch / finally` | Handles success, failure, and mandatory cleanup. | Do not turn a refresh error into a claim that a completed write failed. |
| `?.` / `??` | Reads an optional value safely / supplies a fallback for null or undefined. | Unlike `||`, `??` preserves valid zero, false, and empty-string values. |
| `!!value` | Converts a value to a boolean. | Boolean conversion does not establish authorization. |
| `...object` | Copies enumerable fields into another object. | Use an allowlist for public profiles rather than spreading stored private data. |
| `.filter / .map / .sort` | Selects records, transforms records, or orders records. | Client filtering is presentation; server filtering controls disclosure. |
| `condition && <Component />` | Renders something only when the condition is true. | A hidden button does not protect its API endpoint. |
| `onClick={() => action(...)}` | Registers behavior to run when clicked. | Passing a callback avoids executing the action during render. |
| `event.preventDefault()` | Stops the browser's default action, such as form navigation. | The handler must then perform the intended submission or navigation. |
| `fetch(...)` | Calls an HTTP endpoint. | Inspect status, account identity, and stale-request tickets before applying results. |
| `Response.json(data, {status})` | Sends structured data and an HTTP status from the server. | Private responses should not be publicly cached. |
| `z.object(...).parse(input)` | Validates runtime input using Zod. | Reject invalid values before database mutations. |
| `prepare(sql).bind(values)` | Builds a parameterized SQL query. | Bind values; do not concatenate untrusted strings into SQL. |
| `.first / .all / .run` | Reads one row, reads many rows, or executes a statement. | Empty results and affected-row counts are meaningful. |
| `db().batch([...])` | Runs related database statements as a batch. | Atomicity alone does not prove later statements belong to this request's successful update. |
| `meta.changes` | Reports affected rows. | A conditional write affecting zero rows may mean another request changed the record. |
| `WHERE version=?` | Implements optimistic concurrency for a database update. | Dependent writes must also be tied to that successful update. |
| `JSON.parse / JSON.stringify` | Converts between stored JSON text and JavaScript objects. | Malformed data can throw; serialization does not remove sensitive fields. |
| `env.DB / env.BUCKET` | Accesses Cloudflare D1 records / R2 binary objects. | Database rows and object storage must remain consistent across failures. |
| `assert.equal / assert(...)` | Checks behavior in tests and fails when the expectation is false. | Passing a source-text assertion does not prove real browser interaction. |

## Main areas

| Area | Read these files | Main boundary |
| --- | --- | --- |
| Identity and admission | `chatgpt-auth.ts`, `email-auth.ts`, `safety.ts`, `api/auth/route.ts` | Signing in does not automatically make someone active or admitted. |
| Profile and discovery | `model.ts`, `profile-draft.ts`, `profile-editor.tsx`, `photo-policy.ts` | Private stored fields must not leak through discovery. |
| Direct conversations | `conversation.tsx`, `chat-server.ts`, `api/app/route.ts` | Both participants and the current connection state determine access. |
| Photo exchange | `api/photo/route.ts`, `photo-policy.ts`, `shared-avatar.tsx` | Both consent flags and active account/relationship checks are required. |
| Circles | `circles.tsx`, `circle-policy.ts`, `api/circles/route.ts` | Membership, host permissions, join time, and blocks constrain access. |
| Collective action | `collective-action.tsx`, `api/campaigns/route.ts` | Proposals require independent review; participation is private. |
| Reports and moderation | `api/reports/route.ts`, `api/moderation/route.ts`, `moderation-policy.ts` | Reviewers get specifically authorized evidence, not arbitrary private chats. |
| Notifications | `notification-center.tsx`, `notifications-server.ts`, `web-push.ts` | Device subscriptions are account-scoped; push delivery may fail independently. |
| Recovery | `request-gate.ts`, `draft-storage.ts`, `merge-history.ts`, `message-delivery.ts` | Preserve drafts and successful writes without accepting stale responses. |
| Native app | `native-runtime.tsx`, `native-links.ts`, `ios/` | Native capabilities and allowed deep links differ from the browser. |

## Data and assets

`db/schema.ts` names tables and columns. `drizzle/` records historical SQL changes; do not edit an already-applied migration to introduce a new behavior. Profile JSON stores optional answers while ordinary columns support identities and lifecycle state. R2 stores uploaded media and specifically retained report evidence.

`app/globals.css` is an accumulated cascade. The last matching rule may override an earlier rule, and mobile media queries can change the result. Read all matches for a selector before changing spacing or visibility.

`components/ui/` contains reusable UI primitives. `scripts/` contains runtime/build tooling. `vendor/` contains third-party material. Lockfiles, generated native/build files, and assets should retain their machine-readable formats; explanatory material belongs beside them rather than in invalid JSON or generated output.

## Reviewing safely

Start with a test that demonstrates the intended permission or lifecycle rule. For a comment-only change, compare TypeScript output with comments removed against the original snapshot, then run existing tests and type checking. For behavior changes, add a focused regression. Browser layout, focus, touch gestures, and native device behavior still require real interactive verification.

## Choosing an input control

See [Choice control audit](choice-controls.md) for each screen and its rationale. Longer single-choice lists use dropdowns; short comparisons remain visible. Multiple answers use checkboxes, interests support search and chips, and places require structured combobox selection. UI controls do not replace server validation. Optional blank values mean unanswered, while birth dates stay outside public profile projections.
