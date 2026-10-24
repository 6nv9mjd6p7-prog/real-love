# Real Love

Real Love helps people find connection through shared interests, thoughtful conversation, and mutual care. This repository contains its responsive web app and Cloudflare Worker backend, built with React, Vinext, Cloudflare D1, and Drizzle.

## Project map

- `app/`: public landing page, discovery, profiles, private conversations, Circles, worker support, moderation, and API routes.
- `db/schema.ts` and `drizzle/`: current D1 schema and ordered database migrations.
- `public/`, `native-shell/`, and `ios/`: web install assets, offline shell, and the Capacitor iOS project.
- `scripts/`, `build/`, and `lib/`: install/build tooling, Cloudflare Worker integration, and connector helpers.
- `tests/`: app behavior, API rules, safety boundaries, navigation, and UI regression tests.

For the request flow, feature boundaries, and safe reading practices, see the [Code reading guide](./docs/CODE_READING_GUIDE.md). Feature logic is organized under `app/`; matching behavior and safety checks live under `tests/`.

## Privacy boundaries

The server validates identity, input, permissions, and access for protected actions. Profile fields are projected before public display; photos and voice messages use protected routes and the configured R2 bucket. Circle membership controls access to Circle conversations and history.

Private chat content is **not end-to-end encrypted**. The app's privacy disclosures describe its actual limits. Worker circles are optional peer-support spaces; they are not a union, do not provide legal representation, and do not guarantee protection from retaliation.

## Interface architecture

The rebuilt interface uses three main destinations: Discover, Chats, and Profile.
See [Interface foundation](./docs/INTERFACE.md) for stylesheet ownership, secondary navigation, and mobile validation.

## Develop and verify

Requires Node.js `>=22.13.0` and pnpm `11.25.0`.

```sh
npm run install:ci
npm run dev
npm test
npm run typecheck
npm run build
```

For runtime profiles, local D1 migrations, hosted authentication, and preview behavior, use the canonical [Sites runtime guide](./docs/SITES_RUNTIME.md). For sign-in setup, see [Email sign-in setup](./EMAIL_SIGNIN_SETUP.md). For iOS setup and device limitations, see [iOS native setup](./IOS_NATIVE_SETUP.md).

GitHub source changes do not by themselves publish the production Site. Follow the connected Sites release flow and confirm that its deployment succeeded.

## Project documentation

- [Code reading guide](./docs/CODE_READING_GUIDE.md)
- [Release checks and remaining QA](./docs/release-checks.md)
- [Launch readiness](./docs/launch-readiness.md)
- [Worker support](./docs/worker-support.md)
- [Connection to cooperation](./docs/connection-to-cooperation.md)
- [UX reviews and design history](./docs/ux-review.md), [design QA history](./design-qa.md)

## Upstream documentation

- [Vinext](https://github.com/cloudflare/vinext)
- [Drizzle D1](https://orm.drizzle.team/docs/get-started/d1-new)
