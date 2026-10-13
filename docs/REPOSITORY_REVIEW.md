# GitHub repository review — 2026-10-13

Reviewed GitHub `main` at `1d303aafc7ad1eb9ce874728ac304060d152e13f`. This is a source review and documentation change, not a full security audit or browser/device test. The initial review compared an older GitHub snapshot with the live app. The synchronization below imports the verified live version 81 fixes while retaining explanatory comments.

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


## Resolution: synchronized with live version 81

The repository now includes the fixes for findings 1–5: unique campaign review events with guarded dependent writes, scoped cursor pagination, paused/restricted proposer withdrawal, photo-reset guards, explicit ongoing photo sharing, and the latest journey/design refinements. Earlier findings above are retained as review history, not descriptions of the current code.

The merge preserves existing GitHub comments and documentation. Updated comments describe ongoing photo consent and scoped campaign behavior. The explanatory TypeScript compiles to the same executable output as live source commit `9aa8affa723fd504f818d568b51aeebd918ecf1c`. Existing test files, TypeScript, and the production build validate the combined source. This GitHub update does not itself redeploy the hosted app.


## UX follow-up: version 82

Applied all nine screen-review improvements: correct navigation context, separated inbox badges, persistent profile-answer saving, directly accessible photo state and agreed image, consent retry recovery, keyboard location suggestions, visible active filters, cofounder next actions, and a three-step campaign proposal with a review summary. See `docs/ux-improvements.md`. Source synchronization retains explanatory comments. All 42 test files, TypeScript, and production build passed. Browser and device QA remain unverified.


## Location correction: version 83

Added explicit manual area editing, pending-search save guards, fresh high-accuracy device requests, accuracy messaging, confirmed candidate selection, stale-response protection, and canonical area-point matching. Internet estimates remain separate from device detection. See `docs/location-editing.md`. All 43 test files, TypeScript, and production build passed. Actual location accuracy still needs validation on the member's device.
