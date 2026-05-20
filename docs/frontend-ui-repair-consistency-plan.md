# Frontend UI Repair And Consistency Plan

## Summary
Fix the catalog product details issue, restore the Reports and Settings pages, and standardize Customers, Transactions, and Returns so their search bars, filters, stat cards, tables, mobile cards, empty/error/loading states, and pagination feel like one shared module family.

## Key Changes
- Fix Reports page route blocker by importing `cn`, removing the unused `PageLoadingState` import, and verifying `/admin/reports` can render its header, stats, tabs, and report tables.
- Fix Settings page route blocker by importing `Card`, normalizing profile data before passing it to `ProfileSettings`, and verifying `/admin/settings` can render loading and loaded states.
- Fix catalog size suggestions by replacing the hardcoded `catalog-size-suggestions` datalist id with a `useId()`-based id while keeping the existing size option behavior.
- Standardize Customers, Transactions, and Returns module UI by rendering Returns through `DataTable` and matching the shared toolbar, table, mobile card, empty/error/loading, stat card, and pagination patterns.
- Keep the implementation frontend-only with no backend API, route, or service contract changes.

## Public Interfaces
- No backend API changes.
- No route changes.
- No service contract changes.
- `ReturnsModulePage` renders through the existing `DataTable`.
- `ProductDetailsTab` internally generates a stable datalist id without changing props.

## Test Plan
- Run `npm run build`.
- Manually verify `/admin/reports` loads the report UI.
- Manually verify `/admin/settings` loads settings UI and tab switching works.
- Manually verify `/admin/customers`, `/admin/transactions`, and `/admin/returns` share consistent search, filter, card, table, mobile, and pagination patterns.
- Manually verify staff routes for customers, transactions, and returns still render the shared modules.
- Manually verify product dialog size suggestions still appear and no duplicate datalist id is used.

## Assumptions
- The selected `catalog-size-suggestions` issue is the hardcoded datalist id and possible duplicate DOM id risk.
- This plan file lives at `docs/frontend-ui-repair-consistency-plan.md`.
- Existing unrelated `RolePermissionsMatrix` build errors are outside this UI repair scope unless handled separately.
