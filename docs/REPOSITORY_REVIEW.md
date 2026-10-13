# GitHub repository review — 2026-10-13

Reviewed GitHub `main` at `1d303aafc7ad1eb9ce874728ac304060d152e13f`. This is a source review and documentation change, not a full security audit or browser/device test. The hosted source already contains later fixes; this change deliberately does not import or deploy them.

## Findings

1. **High: campaign review can write a misleading event after a stale update.** In `app/api/campaigns/route.ts`, the event ID is derived from the next version, and insertion checks whether that version exists. A concurrent withdrawal or review can create the same version without this request's update succeeding. The later affected-row check occurs after the batch. The live source uses a unique request event and makes dependent writes conditional on that event.
2. **Medium: campaign list truncation can hide personal activity.** The same endpoint takes 100 rows before applying visibility/expiry filtering. A person's older participation can disappear from the list. The live source has scoped discovery/personal/reviewer queries and cursor pagination.
3. **Medium: paused proposers cannot withdraw.** Campaign POST enforces active status before its withdraw branch. Leaving participation is available earlier, but withdrawing one's own proposal is not. The live source moves ownership-checked withdrawal before the active gate.
4. **Medium: failed photo updates can still clear sharing.** In `app/api/photo/route.ts`, both replacement and removal batch a conditional profile update with an unconditional reset of connection consent. A stale update can affect zero profile rows while the reset still runs. The newer live source ties the reset to the successful profile update.
5. **Product/source divergence: ongoing sharing and journey refinements are missing.** This snapshot resets photo consent on replacement and has the earlier screen hierarchy. Do not assume cloning GitHub reproduces live version 81.
6. **Maintainability: large functions and dense physical lines.** `app/love-app.tsx` and several API routes combine many concerns on very long lines. Comments now explain the major boundaries, but a future behavior-preserving formatting/module split would make review easier. Some tests inspect exact source strings, which makes bulk formatting more disruptive than it appears.
7. **Documentation: README described the starter rather than Real Love.** Replaced the entry README with an application map and linked setup/testing guidance. Preserved the old runtime instructions in `docs/SITES_RUNTIME.md` with a warning that package metadata is authoritative where starter instructions differ.

## Documentation coverage

All 84 modules under `app/` now have purpose comments. Additional inline comments explain the main safety, profile projection, PNG validation, draft storage, matching/location, notification, request-ordering, and action-dispatch logic. `docs/CODE_READING_GUIDE.md` explains recurring syntax statement by statement.

This is not a claim that every punctuation-only line, JSX attribute, generated file, or third-party component has its own comment. Avoid comments that simply repeat syntax or make an unverified security promise. Keep explanations aligned with actual behavior and update them with future changes.

## Validation

Compare comment-stripped TypeScript output with the exact original GitHub blobs to verify the app code remains semantically unchanged by this documentation pass. Run the existing test files and TypeScript checks. Real browser/mobile behavior is outside this pass.
