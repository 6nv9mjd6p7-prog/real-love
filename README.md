# Real Love

Real Love helps people connect through shared interests, thoughtful conversation, and mutual care. Connections start as friendships. Photos remain private until both people agree to share them. Circles and worker support are optional.

## Start reading here

1. [Code reading guide](docs/CODE_READING_GUIDE.md): how the application fits together and how to read its TypeScript, React, SQL, and tests.
2. [Repository review](docs/REPOSITORY_REVIEW.md): findings from the GitHub snapshot and differences from the newer live app.
3. `app/page.tsx` resolves the signed-in identity; `app/love-app.tsx` runs the client screens.
4. `app/api/app/route.ts` handles profiles and connections; `app/safety.ts` supplies shared server checks.
5. `db/schema.ts` describes stored records; `drizzle/` contains ordered migrations.

Comments in `app/` explain each module. Additional comments explain security-sensitive helpers, action branches, PNG validation, and asynchronous state. Read these with the code: they describe this repository snapshot, not every later live release.

## Local development and checks

Use Node.js 22.13 or newer for the runtime; the tests use Node's built-in SQLite support. The validation environment used Node 24. Use the package manager version pinned in `package.json` and the checked-in lockfile.

```sh
pnpm install --frozen-lockfile
node --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm build
```

See [Sites runtime setup](docs/SITES_RUNTIME.md) for managed/portable development, environment bindings, preview behavior, and migration instructions. The runtime document preserves the earlier starter instructions; `package.json` and its lockfile are authoritative for this project's current install command and dependencies.

## Deployment and account setup

- [Email sign-in](EMAIL_SIGNIN_SETUP.md)
- [Native iPhone setup and limitations](IOS_NATIVE_SETUP.md)
- `.openai/hosting.json` identifies the hosted project and its D1/R2 bindings.

This source was synchronized with live version 87 (`e780a2429c4b55f2389298f68bc48797b6ab9a23`) while preserving explanatory comments. GitHub and hosted Sites remain separate copies; later edits can diverge again. Pushing here does not deploy the hosted app.

## Privacy boundaries

Authentication, admission, active status, connection consent, and reviewer authority are separate checks. UI buttons are never sufficient authorization. Keep checks in the APIs even when the client hides an action.

Never commit credentials, environment secrets, local runtime state, or real member data. Generated bundles, dependency directories, and third-party vendored code are not the place to document application behavior.

Profile input and private birth-date behavior: [implementation notes](docs/profile-inputs.md).
