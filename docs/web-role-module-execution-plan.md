# Web Role Module Execution Plan
# Rayn Motoparts POS Frontend Implementation Playbook

Prepared: 2026-04-04
Based on: web-role-module-implementation-plan.md

---

## 1. Purpose

This document is the action plan for implementing the role-based, module-first frontend architecture.

It converts strategy into execution by defining:

1. Delivery phases
2. Branch workflow per module
3. Concrete implementation tasks
4. Testing and release gates
5. Day-to-day team operating model

---

## 2. Execution Goals

1. Deliver role-segmented app routes for admin, staff, and superadmin.
2. Restructure frontend into app/<role>/<module>/page.tsx + module component architecture.
3. Move data access into module services/hooks with typed API contracts.
4. Ship incrementally per module branch (feat/module_name) with clear progress tracking.

---

## 3. Delivery Model

## 3.1 Branching Standard

Use one branch per module:

- feat/dashboard
- feat/transactions
- feat/catalog
- feat/inventory
- feat/pos
- feat/returns
- feat/customers
- feat/reports
- feat/settings
- feat/system-health
- feat/system-rollout
- feat/system-reconciliation
- feat/system-audit

Use dedicated shared branches for cross-cutting work:

- feat/routing-foundation
- feat/auth-guards
- feat/query-infrastructure
- feat/layout-foundation

Rules:

1. One branch = one module scope.
2. No mixed multi-module feature branches.
3. Rebase module branches after shared branch merges.
4. PR title format: feat(module_name): short summary.

## 3.2 Work Tracking

1. Create one issue per module.
2. Link each PR to its module issue.
3. Maintain board columns:
- Backlog
- In Progress
- Review
- Merged
- Verified

---

## 4. Implementation Phases and Actions

## Phase 0: Readiness and Baseline (2 to 3 days)

Objective:
- Prepare repository and standards before module work starts.

Actions:

1. Confirm target directory convention in src:
- app/
- components/modules/
- services/modules/
- hooks/modules/
- types/api/

2. Set engineering standards:
- naming conventions
- query key patterns
- DTO mapping pattern
- guard usage pattern

3. Create implementation templates:
- module page template
- module service template
- module hook template
- module PR checklist

Deliverables:

1. Shared branch merged: feat/layout-foundation (if needed)
2. Shared branch merged: feat/query-infrastructure
3. Team-ready module templates

Exit criteria:

1. Folder skeleton exists.
2. Team has consistent coding templates.
3. Query and API conventions are documented.

---

## Phase 1: Routing and Role Foundation (3 to 5 days)

Branch:
- feat/routing-foundation

Objective:
- Enable role-based app routing and guard flow.

Actions:

1. Introduce AppRouter under routes/.
2. Create route groups:
- /app/admin/*
- /app/staff/*
- /app/system/*

3. Implement/upgrade guards:
- AuthGuard
- RoleGuard
- PermissionGuard

4. Add role redirect utility after login:
- superadmin/admin -> /app/admin/dashboard
- staff -> /app/staff/dashboard

5. Add initial page entries:
- app/admin/dashboard/page.tsx
- app/staff/dashboard/page.tsx
- app/system/reconciliation/page.tsx

Deliverables:

1. Role routing functional end-to-end.
2. Unauthorized route handling stable.

Exit criteria:

1. Correct post-login redirects per role.
2. Guards block invalid access.
3. Existing app behavior not broken.

---

## Phase 2: First Vertical Modules (Week 1)

Branches:
- feat/dashboard
- feat/transactions

Objective:
- Deliver first two modules in full module-first structure.

Actions for Dashboard:

1. Move page orchestration to app/<role>/dashboard/page.tsx.
2. Build module components under components/modules/dashboard/.
3. Create services/modules/dashboard.service.ts.
4. Create hooks/modules/useDashboard.ts.
5. Add typed dashboard DTOs in types/api/dashboard.types.ts.

Actions for Transactions:

1. Move page orchestration to app/<role>/transactions/page.tsx.
2. Build components/modules/transactions/*.
3. Create services/modules/transactions.service.ts.
4. Create hooks/modules/useTransactions.ts.
5. Add typed DTOs in types/api/transactions.types.ts.

Deliverables:

1. Admin and staff dashboards working in new structure.
2. Transactions list/detail flow using module services/hooks.

Exit criteria:

1. No API calls from presentational components.
2. Query keys and invalidation follow standards.
3. Loading/empty/error states implemented.

---

## Phase 3: Core Operations Modules (Weeks 2 to 3)

Branches:
- feat/catalog
- feat/inventory
- feat/pos
- feat/returns
- feat/customers

Objective:
- Complete business-critical operations modules.

Implementation order:

1. feat/catalog
2. feat/inventory
3. feat/pos
4. feat/returns
5. feat/customers

Per-module task checklist:

1. app/<role>/<module>/page.tsx entry created.
2. module components added under components/modules/<module>/.
3. module service added under services/modules/.
4. module hooks added under hooks/modules/.
5. typed DTO file created under types/api/.
6. role and permission guard applied to routes/actions.
7. loading/empty/error/success states covered.
8. tests added or updated.

Exit criteria:

1. End-to-end operational workflows complete for admin/staff.
2. No legacy page dependencies for these modules.

---

## Phase 4: Management and Superadmin Extensions (Week 4)

Branches:
- feat/reports
- feat/settings
- feat/system-health
- feat/system-rollout
- feat/system-reconciliation
- feat/system-audit

Objective:
- Finish admin management modules and superadmin-only system modules.

Actions:

1. Implement reports and settings for admin/superadmin.
2. Implement superadmin System group pages:
- health
- rollout
- reconciliation
- audit

3. Add confirmation patterns for high-impact system actions.
4. Add access restrictions to superadmin-only routes and actions.

Exit criteria:

1. Superadmin sees admin pages plus system extras.
2. Admin does not access superadmin-only system tools.
3. Staff does not access management/system pages.

---

## Phase 5: Hardening and Stabilization (Week 5)

Branch:
- feat/frontend-hardening

Objective:
- Ensure production quality and release readiness.

Actions:

1. Unit/integration tests for guards, services, hooks.
2. E2E role journeys:
- staff: login -> dashboard -> pos -> transactions
- admin: login -> dashboard -> catalog -> reports
- superadmin: login -> admin flows -> system tools

3. Accessibility checks on core pages.
4. Performance pass for dashboard and table-heavy pages.
5. Final cleanup of legacy pages and unused services.

Exit criteria:

1. All release test suites pass.
2. Legacy route/page paths retired safely.
3. Documentation updated.

---

## 5. Module Definition of Done (DoD)

A module branch can be merged only when all are true:

1. Route entry exists in app/<role>/<module>/page.tsx.
2. UI is split into module components (no large monolith page file).
3. Data calls are inside services/modules and hooks/modules only.
4. API contracts are typed and aligned to backend responses.
5. Role and permission guards are correct.
6. Loading/empty/error states exist.
7. Tests for main workflows are added/updated.
8. PR checklist completed and reviewer-approved.

---

## 6. Practical Weekly Cadence

1. Monday
- Pick module issue from backlog
- Create branch feat/module_name
- Confirm dependencies

2. Tuesday to Thursday
- Implement module with daily commits
- Sync with backend contract changes

3. Friday
- Open PR
- Run full checks
- Address review comments

4. End of week
- Merge completed module branches
- Update board status and next sprint scope

---

## 7. Commands and Workflow Quick Reference

Create module branch:

```bash
git checkout main
git pull
git checkout -b feat/module_name
```

Rebase module branch after shared merge:

```bash
git checkout feat/module_name
git fetch origin
git rebase origin/main
```

PR title format:

```text
feat(module_name): short summary
```

---

## 8. Initial 2-Week Action Plan (Concrete)

Week 1:

1. Merge feat/routing-foundation
2. Merge feat/query-infrastructure
3. Start feat/dashboard
4. Start feat/transactions

Week 2:

1. Merge feat/dashboard
2. Merge feat/transactions
3. Start feat/catalog
4. Start feat/inventory

This sequence establishes foundation + first two modules, then scales into high-impact operational modules.

---

## 9. Risks and Mitigations

1. Risk: module branches drift due to shared changes.
- Mitigation: short-lived shared branches, frequent rebases.

2. Risk: API contract mismatch blocks frontend completion.
- Mitigation: module DTO map + contract validation before PR review.

3. Risk: route guard logic duplicated and inconsistent.
- Mitigation: central guard utilities and shared permission helpers.

4. Risk: long-running branches become hard to merge.
- Mitigation: strict one-module scope and weekly merge cadence.

---

## 10. Success Metrics

1. 100 percent of target modules migrated to module-first structure.
2. 100 percent of routes behind correct role guards.
3. 0 API calls in presentational components.
4. Passing E2E role journeys for staff/admin/superadmin.
5. Faster development tracking through feat/module_name branch auditability.

---

## 11. Immediate Next Action

Start with:

1. feat/routing-foundation
2. feat/query-infrastructure
3. feat/dashboard
4. feat/transactions

Then continue module-by-module using feat/module_name until all planned modules are completed and verified.
