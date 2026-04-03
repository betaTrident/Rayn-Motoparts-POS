# Web Role-Based Module Implementation Plan
# Rayn Motoparts POS (Admin, Staff, Superadmin)

Prepared: 2026-04-03
Scope: Frontend web restructuring and implementation strategy aligned to current backend APIs and role model.

---

## 1. Objective

Build a clear, scalable, role-based web architecture where:

1. Admin (owner) and Staff (cashier/mechanic) each get focused page access.
2. Superadmin uses the same core pages as Admin, plus additional system pages.
3. Frontend folder structure is module-first, with each module owning its page entry.
4. API integration is consistent through typed services, query keys, and React Query patterns.

This plan prioritizes maintainability, role clarity, and faster feature delivery.

---

## 2. Role Model and UX Strategy

## 2.1 Roles

- superadmin (developer)
- admin (owner)
- staff (cashier/mechanic)

Note:
- In business terms, treat staff as cashier/mechanic.
- Superadmin should be functionally equivalent to admin for daily operations, with additional technical/governance pages.

## 2.2 Product Direction by Role

1. Admin
- Full daily operations and management workflows.
- Access to dashboards, catalog, inventory, transactions, returns, customers, reports, settings.

2. Staff
- Fast operational workflows only.
- Access to POS, transactions, returns, basic customer lookup, operational dashboard cards.
- No high-risk configuration pages.

3. Superadmin
- Same pages as Admin.
- Additional pages for system diagnostics, rollout flags, reconciliation controls, and audit/ops tools.

---

## 3. Target Information Architecture (Pages by Role)

## 3.1 Shared Core Modules

These modules exist for all authenticated roles, but with different actions enabled:

- dashboard
- pos
- transactions
- returns
- customers
- profile

## 3.2 Admin Modules

- dashboard
- catalog
- inventory
- pos
- transactions
- returns
- customers
- reports
- settings

## 3.3 Staff Modules

- dashboard (staff variant)
- pos
- transactions
- returns
- customers (read/minimal write)

## 3.4 Superadmin Additional Modules

- system-health
- rollout-control
- reconciliation
- audit
- developer-tools

Recommendation:
- Keep superadmin pages grouped under one clear navigation group (System) to avoid clutter in normal admin UX.

---

## 4. Route Plan

## 4.1 Route Groups

- /app/admin/*
- /app/staff/*
- /app/system/* (superadmin-only extras)

## 4.2 Example Route Map

- /app/admin/dashboard
- /app/admin/catalog
- /app/admin/inventory
- /app/admin/transactions
- /app/admin/reports
- /app/admin/settings

- /app/staff/dashboard
- /app/staff/pos
- /app/staff/transactions
- /app/staff/returns

- /app/system/health
- /app/system/rollout
- /app/system/reconciliation
- /app/system/audit

## 4.3 Routing Rules

1. After login, resolve role and redirect:
- superadmin/admin -> /app/admin/dashboard
- staff -> /app/staff/dashboard

2. Keep route guards layered:
- AuthGuard (token/session)
- RoleGuard (role-level access)
- PermissionGuard (action-level checks where needed)

3. Use a single Unauthorized page for blocked routes.

---

## 5. Folder and File Restructure (Module-First)

You requested a structure where each module has its own page.tsx and page content is composed from module components. The following layout implements that pattern.

## 5.1 Target Frontend Structure

```text
apps/web/src/
  app/
    admin/
      dashboard/
        page.tsx
      catalog/
        page.tsx
      inventory/
        page.tsx
      transactions/
        page.tsx
      reports/
        page.tsx
      settings/
        page.tsx
    staff/
      dashboard/
        page.tsx
      pos/
        page.tsx
      transactions/
        page.tsx
      returns/
        page.tsx
    system/
      health/
        page.tsx
      rollout/
        page.tsx
      reconciliation/
        page.tsx
      audit/
        page.tsx

  components/
    layout/
      MainLayout.tsx
      AdminLayout.tsx
      StaffLayout.tsx
      SystemLayout.tsx

    modules/
      dashboard/
        DashboardHeader.tsx
        SummaryCards.tsx
        SalesCharts.tsx
      catalog/
        ProductTable.tsx
        ProductForm.tsx
        CategoryManager.tsx
      inventory/
        InventoryTable.tsx
        StockAdjustDialog.tsx
      pos/
        PosCart.tsx
        PosCheckout.tsx
        BarcodeInput.tsx
      transactions/
        TransactionFilters.tsx
        TransactionTable.tsx
        TransactionDetailDrawer.tsx
      returns/
        ReturnCreateForm.tsx
        ReturnItemsTable.tsx
      customers/
        CustomerLookup.tsx
        CustomerProfileCard.tsx
      reports/
        ReportFilters.tsx
        ReportCharts.tsx
      settings/
        BusinessSettingsForm.tsx
      system/
        HealthPanel.tsx
        RolloutFlagsPanel.tsx
        ReconciliationPanel.tsx
        AuditLogTable.tsx

  services/
    api.service.ts
    endpoints.service.ts
    queryKeys.service.ts

    modules/
      dashboard.service.ts
      catalog.service.ts
      inventory.service.ts
      pos.service.ts
      transactions.service.ts
      returns.service.ts
      customers.service.ts
      reports.service.ts
      settings.service.ts
      system.service.ts

  types/
    api/
      dashboard.types.ts
      catalog.types.ts
      inventory.types.ts
      pos.types.ts
      transactions.types.ts
      returns.types.ts
      customers.types.ts
      reports.types.ts
      system.types.ts

  hooks/
    modules/
      useDashboard.ts
      useCatalog.ts
      useInventory.ts
      usePos.ts
      useTransactions.ts
      useReturns.ts
      useCustomers.ts
      useReports.ts
      useSystem.ts

  routes/
    AppRouter.tsx
    guards/
      AuthGuard.tsx
      RoleGuard.tsx
      PermissionGuard.tsx
    roleRedirect.ts

  context/
    AuthContext.tsx
    PermissionContext.tsx
```

## 5.2 Core Structure Rules

1. Each module has exactly one page entry at app/<role-or-group>/<module>/page.tsx.
2. page.tsx should orchestrate layout, queries, and module components only.
3. Business rendering lives in components/modules/<module>/.
4. API code must never be inside page.tsx or UI components.

---

## 6. Backend Integration Strategy (API + Query + Contract)

## 6.1 API Layer Standards

1. Keep one shared Axios client:
- token injection
- refresh flow
- normalized error handling

2. Keep endpoints centralized in endpoints.service.ts.

3. Create per-module service files in services/modules/.

4. Always map backend DTO -> UI model when needed.

## 6.2 React Query Standards

1. Query key factory:
- queryKeys.dashboard.snapshot(days)
- queryKeys.transactions.list(filters)
- queryKeys.transactions.detail(id)

2. Use role-aware query enabling:
- enabled: canViewModule

3. Mutation standards:
- optimistic update only for low-risk local interactions
- invalidate exact module queries after write

4. Keep stale times per module profile:
- dashboard: short stale time
- catalog/reference lists: longer stale time

## 6.3 API Contract by Module

1. Dashboard
- Use existing /api/pos/dashboard/ endpoint.
- Add role-based payload shaping in frontend selectors if needed.

2. Transactions
- Use /api/pos/transactions/ and /api/pos/transactions/:id/.
- Align filters and pagination with backend query params.

3. Catalog
- Use /api/catalog/* endpoints as source of truth.
- Ensure create/update payloads match serializer contracts.

4. Inventory
- Expose and consume inventory stock + movement + adjustments endpoints.

5. POS/Returns
- Use dedicated service actions for complete sale and return processing.
- Never perform stock math in frontend.

6. System (superadmin)
- Expose endpoints for:
  - reconciliation command trigger/status
  - rollout flag read/update
  - health diagnostics
  - audit browsing

---

## 7. Superadmin Extension Model

Keep superadmin mostly identical to admin, with controlled additional pages:

1. System Health
- Environment status, API latency summary, job status.

2. Rollout Control
- Read/write rollout flags (with confirmation workflows).

3. Reconciliation
- Trigger reconciliation command and view latest run output.
- Integrate fail-on-issues visibility.

4. Audit Explorer
- Filterable audit log for operational investigation.

5. Developer Tools (optional)
- Read-only diagnostics, query plan snapshots, seed/check utilities metadata.

Governance recommendation:
- Require confirmation modal and reason text for destructive/system-impacting actions.

---

## 8. Implementation Phases

## Phase 1: Foundation and Routing

1. Introduce app/ role-based page entry structure.
2. Implement AppRouter and layered guards.
3. Add role-based login redirect utility.
4. Keep existing pages mounted through compatibility wrappers during migration.

Output:
- Working role-segmented navigation with no feature loss.

## Phase 2: Module Extraction

1. Move page internals into components/modules/*.
2. Keep page.tsx as thin orchestration layers.
3. Split services into module files and add module query hooks.

Output:
- Clean module boundaries and reusable components.

## Phase 3: Role-Specific UX

1. Staff-specific dashboard/menus/actions.
2. Admin management pages complete.
3. Superadmin system pages (first 2 pages: reconciliation + rollout).

Output:
- Role-optimized flows with minimal clutter.

## Phase 4: Hardening and Quality

1. Add integration tests per role journey.
2. Add E2E tests for critical actions.
3. Add error/empty/loading state conformance checks.

Output:
- Stable production-ready role architecture.

---

## 9. Testing Plan

## 9.1 Unit and Integration

1. Guard tests
- AuthGuard redirects unauthenticated users.
- RoleGuard blocks unauthorized roles.

2. Service tests
- DTO mapping and error normalization.

3. Query hook tests
- Correct cache keys and invalidation behavior.

## 9.2 E2E Role Journeys

1. Staff
- Login -> staff dashboard -> POS sale -> transaction history.

2. Admin
- Login -> admin dashboard -> catalog update -> transaction report.

3. Superadmin
- Login -> admin pages -> system reconciliation page -> rollout page.

---

## 10. Migration from Current Structure

Current structure is page-flat with role folders partially present. Use this migration path to avoid disruption:

1. Introduce new app/ routes first; keep existing pages as internal imports.
2. Create module page wrappers in app/*/page.tsx.
3. Gradually move UI content to components/modules/*.
4. Once stable, retire legacy pages/* entry points.

Suggested temporary bridge:
- app/admin/dashboard/page.tsx can initially render existing DashboardPage while module extraction is in progress.

---

## 11. Best Practices Checklist

1. Do not call APIs directly in presentational components.
2. Keep role checks centralized in guards/hooks, not scattered in JSX.
3. Keep consistent naming:
- module page entry: page.tsx
- module components: PascalCase.tsx
- module services: <module>.service.ts
- module hooks: use<Module>.ts

4. Keep all API parameters typed.
5. Always handle loading, error, empty, success states.
6. Use mutation side effects via query invalidation, not manual deep state edits.
7. Logically separate:
- role routing
- module rendering
- data access

---

## 12. Delivery Milestones and Exit Criteria

## Milestone A: Role Routing Live

Exit criteria:
- Login redirects correctly by role.
- Admin and staff route groups work.
- Unauthorized routes blocked.

## Milestone B: Module-First Structure Live

Exit criteria:
- At least dashboard, transactions, and catalog use new app/ + components/modules layout.
- Services/hooks split by module.

## Milestone C: Superadmin Extensions Live

Exit criteria:
- Reconciliation page and rollout-control page available for superadmin.
- Admin remains unaffected in core workflows.

## Milestone D: Full QA Pass

Exit criteria:
- Role-based E2E scenarios pass.
- No broken API contracts.
- Performance and accessibility checks meet baseline targets.

---

## 13. Immediate Next Sprint (Suggested)

1. Implement AppRouter with role route groups and guards.
2. Create page.tsx entries for:
- app/admin/dashboard
- app/staff/dashboard
- app/system/reconciliation

3. Create components/modules/dashboard and components/modules/transactions folders.
4. Split transactions and dashboard services into services/modules/.
5. Add query key factory entries and hook wrappers for dashboard and transactions.

This gives immediate structure alignment with your desired architecture while preserving existing behavior.
