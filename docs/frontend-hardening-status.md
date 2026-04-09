# Frontend Hardening Status

## Scope

This document tracks the frontend hardening work for the POS web app on branch `feat/frontend-hardening`.

## Completed

- Added Vitest + Testing Library setup for unit tests.
- Added Playwright E2E setup, including accessibility scans with axe.
- Added route/guard tests for auth, role redirects, and guest access.
- Added integration-style hook tests for:
  - auth context flow,
  - transactions,
  - pos catalog,
  - customers,
  - returns,
  - reports,
  - settings profile/password updates.
- Added accessibility semantics improvements on core pages and layout.
- Added route-level lazy loading and safer manual chunk splitting in Vite.
- Added CI workflow gate for frontend hardening checks.

## Validation Snapshot

- Unit tests: 12 files, 30 tests passing.
- E2E tests: role journeys, auth smoke, and accessibility checks passing.
- Build: production build passing.

## CI Matrix

Workflow: `.github/workflows/frontend-hardening.yml`

- Job `unit-and-build`
  - `npm ci`
  - `npm run test:run`
  - `npm run build`
- Job `e2e`
  - `npm ci`
  - `npx playwright install --with-deps chromium`
  - `npm run e2e`

## Remaining Follow-ups

- Extend integration coverage to additional module hooks if needed by release risk.
- Add targeted performance budgets if chunk-size enforcement is required.
- Add per-module test ownership notes if team process requires it.
