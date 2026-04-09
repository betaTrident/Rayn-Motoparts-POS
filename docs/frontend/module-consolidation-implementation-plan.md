# Module Consolidation Implementation Plan

## Objective
Consolidate related modules to reduce navigation complexity and make workflows more contextual:

1. Move Products experience into Inventory.
2. Move Reports experience into Dashboard.
3. Move Customers experience into Transactions.

This plan is designed for low-risk migration with backward compatibility, strong test coverage, and clear rollback paths.

## Current State Analysis
Current frontend routing and navigation expose separate pages for each concern:

- Admin routes include separate pages for dashboard, products (catalog), customers, inventory, transactions, and reports.
- Staff routes include separate pages for dashboard, customers, inventory, and transactions.
- Sidebar currently lists Products, Customers, Inventory, Transactions, and Reports as separate main menu entries.
- Module pages are already componentized by domain, which enables extraction and recomposition.

Existing module boundaries relevant to this change:

- Products domain: catalog module and admin catalog route.
- Reports domain: reports module and admin reports route.
- Customers domain: customers module and admin and staff customers routes.
- Inventory, Dashboard, Transactions already have robust module pages that can host embedded sections.

## Target Information Architecture
After consolidation:

- Inventory becomes the home for stock and products.
- Dashboard becomes the home for operational summary plus reporting insights and analytics.
- Transactions becomes the home for sales history plus customer directory context.

Sidebar target:

- Keep: Dashboard, Point of Sale, Inventory, Transactions, Returns, Settings (and system group for superadmin).
- Remove standalone: Products, Reports, Customers.

## Route Strategy (Backward Compatible)
Do not hard-delete old URLs immediately. Convert them to redirects with explicit destination context.

Redirect map:

- /app/admin/catalog -> /app/admin/inventory?tab=products
- /app/admin/reports -> /app/admin/dashboard?panel=reports
- /app/admin/customers -> /app/admin/transactions?tab=customers
- /app/staff/customers -> /app/staff/transactions?tab=customers

Reasons:

- Preserves bookmarks and external links.
- Avoids sudden 404/Not Found regressions.
- Gives analytics window to detect old route usage before removal.

## UI Composition Strategy

### 1) Inventory + Products
Inventory page should become a two-surface page:

- Inventory tab: existing inventory health and movement insights.
- Products tab: embedded products management experience.

Implementation notes:

- Extract a products-focused section component from current catalog module.
- Mount with lazy rendering or conditional query enablement to avoid extra calls when tab is not active.
- Preserve existing products CRUD behavior and validation flows.

### 2) Dashboard + Reports
Dashboard should gain a reporting insights section instead of separate report page:

- Keep current dashboard KPI and operational widgets.
- Add report panels for top products, top cashiers, and payment mix.
- Align report date filters to dashboard date range model to avoid contradictory states.

Implementation notes:

- Extract report cards and tables into reusable dashboard section components.
- Reuse existing reports hook or merge queries into dashboard hook where response overlap is high.
- Prefer a single source of truth for date range.

### 3) Transactions + Customers
Transactions page should gain a customer directory context:

- Transactions tab: current transaction list and detail flow.
- Customers tab: customer directory and filters.

Implementation notes:

- Extract customer list/filter table into a dedicated section component.
- Keep pagination state independent per tab.
- Preserve transactions detail dialog behavior.

## Data and Query Strategy
Use React Query best practices to prevent unnecessary load and stale conflicts.

- Keep existing query keys stable to avoid cache invalidation regressions.
- Use tab-aware query enablement:
  - products query enabled only when inventory products tab is active.
  - customers query enabled only when transactions customers tab is active.
- Reuse cached dashboard and reports data where overlap exists.
- Add sensible staleTime to heavy summary queries where safe.
- Preserve explicit retry behavior for auth-sensitive endpoints.

## Permissions and Role Guard Strategy
Maintain authorization semantics while changing information architecture.

- Keep route guards unchanged for role boundaries.
- Continue enforcing product access capability checks where products are shown in inventory.
- Ensure staff view does not accidentally expose admin-only actions.
- Validate superadmin system group remains isolated.

## Implementation Phases

### Phase 1: Prepare Composable Sections

1. Extract section-level components:
   - Products section from catalog module.
   - Reports section from reports module.
   - Customers section from customers module.
2. Keep old module pages consuming extracted sections first (no behavior change yet).
3. Add unit tests for extracted section rendering and empty/loading/error states.

Deliverable:

- Reusable section components with parity behavior.

### Phase 2: Compose Into Target Pages

1. Inventory page:
   - Add tab switcher with inventory and products tabs.
   - Embed products section in products tab.
2. Dashboard page:
   - Add reports insights block under existing KPI/performance sections.
3. Transactions page:
   - Add tab switcher with transactions and customers tabs.
   - Embed customers section in customers tab.

Deliverable:

- Target consolidated UX available behind existing primary routes.

### Phase 3: Navigation and Route Migration

1. Update sidebar:
   - Remove Products, Reports, Customers standalone entries.
2. Update header title map:
   - Ensure active titles reflect consolidated routes and selected tab/panel.
3. Convert legacy routes to redirects with query context.

Deliverable:

- New information architecture with backward-compatible route behavior.

### Phase 4: Hardening and Cleanup

1. Add telemetry/logging for legacy route hits and redirect destinations.
2. Validate analytics and performance baselines.
3. Remove dead page wrappers after one stabilization cycle if no regressions.

Deliverable:

- Stable consolidated structure with reduced maintenance surface.

## File-Level Change Plan
Primary files expected to change:

- routes and navigation:
  - apps/web/src/routes/AppRouter.tsx
  - apps/web/src/components/layout/AppSidebar.tsx
  - apps/web/src/components/layout/AppHeader.tsx

- target module pages:
  - apps/web/src/components/modules/inventory/InventoryModulePage.tsx
  - apps/web/src/components/modules/dashboard/DashboardModulePage.tsx
  - apps/web/src/components/modules/transactions/TransactionsModulePage.tsx

- source modules for extraction:
  - apps/web/src/components/modules/catalog/CatalogModulePage.tsx
  - apps/web/src/components/modules/reports/ReportsModulePage.tsx
  - apps/web/src/components/modules/customers/CustomersModulePage.tsx

- route wrappers that become redirects:
  - apps/web/src/app/admin/catalog/page.tsx
  - apps/web/src/app/admin/reports/page.tsx
  - apps/web/src/app/admin/customers/page.tsx
  - apps/web/src/app/staff/customers/page.tsx

- tests:
  - route tests, sidebar tests, and module-level tests under apps/web/src/routes and apps/web/src/components/modules

## Testing Plan

### Unit and Integration

1. Inventory page renders both inventory and products tabs correctly.
2. Transactions page renders both transactions and customers tabs correctly.
3. Dashboard renders reporting panels and handles loading and error states.
4. Legacy routes redirect to new targets with expected query params.
5. Role-based rendering still blocks unauthorized content.

### End-to-End

1. Admin journey:
   - Inventory -> products management works end to end.
   - Dashboard includes reporting widgets.
   - Transactions includes customer directory.
2. Staff journey:
   - Transactions customer tab available if intended by role policy.
   - No admin-only actions leaked.
3. Deep links:
   - Legacy routes redirect correctly.
   - Query params preserve selected tab/panel.

### Non-Functional

1. Confirm no major increase in first meaningful paint on dashboard and inventory routes.
2. Confirm no duplicate query bursts when switching tabs.
3. Confirm accessibility of tab controls and section landmarks.

## Risk Register and Mitigation

1. Risk: Heavier pages due to consolidation.
   - Mitigation: lazy load section components and use tab-gated queries.

2. Risk: Breaking existing bookmarks.
   - Mitigation: retain redirect routes for at least one release cycle.

3. Risk: Permission drift after moving UI blocks.
   - Mitigation: explicit guards around embedded sections and role tests.

4. Risk: User confusion after menu changes.
   - Mitigation: add transitional helper text in target pages and release notes.

## Rollout and Rollback

Rollout:

1. Merge behind a temporary feature flag if available.
2. Deploy to staging and run full role-based test matrix.
3. Release with route redirects and monitor errors and usage.

Rollback:

1. Re-enable old sidebar items.
2. Point legacy routes back to previous pages.
3. Keep extracted section components since they are backwards compatible.

## Acceptance Criteria

1. No standalone sidebar entries for Products, Reports, and Customers.
2. Products workflow fully usable from Inventory.
3. Reporting insights visible and usable on Dashboard.
4. Customer directory visible and usable from Transactions.
5. All legacy routes redirect to their new contextual destinations.
6. Role guards and auth behavior remain correct.
7. Unit, integration, and E2E checks pass.
