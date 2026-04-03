# Single-Store Database Simplification Plan
# Rayn Motoparts POS - Inventory + POS Only

> Prepared: 2026-04-03
> Goal: Simplify the current schema for one store, three users, and core Inventory + POS workflows.

---

## 1. Business Scope (Final Target)

The system will support only:

- Single physical store (no branches, no separate bodega).
- 3 user roles only:
  - superadmin (developer)
  - admin (owner/client)
  - staff (worker/mechanic)
- Core modules only:
  - Inventory management
  - POS sales and returns

Out of scope for now:

- Multi-location operations
- Advanced procurement workflow
- Advanced invoicing workflow
- Advanced pricing tiers/history
- Vehicle fitment catalog complexity (unless actively used)

---

## 2. Simplification Principles

- Keep only tables needed for daily sell-buy-stock operations.
- Do not drop anything in production immediately; use staged deprecation.
- Preserve historical transactions (sales, payments, stock movements).
- Prefer disabling features first, then removing tables after validation.
- Keep migration scripts reversible when possible.

---

## 3. Keep vs De-scope Strategy

## Keep (Core)

- authentication_user (custom user model)
- auth_group, auth_user_groups (for 3 roles)
- catalog: brand, category, unit, product, product_variant, barcode
- inventory: warehouse, inventory_stock, stock_movement, stock_adjustment
- pos: pos_terminal, cash_session, sales_transaction, sales_transaction_item, payment_method, transaction_payment, sales_return, sales_return_item
- customers: customer (optional but useful for receipts/history)
- core/audit/shared tables required by Django and app runtime

## De-scope Now (Phase 1 disable, Phase 2 remove)

- procurement app tables:
  - supplier
  - supplier_product
  - purchase_order
  - purchase_order_item
- pricing app tables:
  - price_tier
  - product_price_tier_rule
  - product_price_history
  - supplier_cost_history
- invoices app tables (if printed invoice can come directly from POS transaction):
  - invoice_sequence
  - business_profile
  - invoice
  - invoice_item
  - invoice_payment

## De-scope Optional (depends on actual usage)

- vehicles app tables:
  - vehicle_make
  - vehicle_model
  - vehicle_year
  - product_vehicle_fitment
- customers.customer_address (if full address book is not needed)

---

## 4. Warehouse Simplification (Single Store)

Current design supports multiple warehouses/locations. For single-store setup:

- Keep exactly one warehouse record (example code: MAIN).
- Set all users and POS terminals to this one warehouse.
- Remove multi-location UI choices (warehouse dropdowns become hidden/auto-set).
- Keep warehouse table for compatibility and future growth, but enforce one active row by policy.

Recommended rule:

- Do not remove warehouse foreign keys yet.
- Add service-level guard: all new transactions must use the single default warehouse.

This gives a simple system now without expensive schema rewrites.

---

## 5. Roles and Access Control Simplification

Use only 3 roles via Django groups:

- superadmin: full technical access (developer)
- admin: full business access (owner)
- staff: POS + basic inventory operations

Actions:

- Remove legacy/unused groups from seed scripts and admin setup.
- Audit endpoints and menu visibility to match only these 3 roles.
- Ensure no feature depends on old roles (manager/viewer/stock_clerk).

---

## 6. Implementation Phases

## Phase 0 - Baseline and Safety

- Create full DB backup and verify restore process.
- Export table row counts and dependency map.
- Freeze new feature development during schema cleanup window.
- Add a rollback checklist.

Deliverables:

- Backup artifact
- Dependency report
- Rollback runbook

## Phase 1 - Feature Freeze by Configuration (No Drops Yet)

- Remove routes, menu entries, and permissions for de-scoped modules.
- Stop writing new records to procurement/pricing/invoices tables.
- Keep read-only access for historical verification if needed.

Deliverables:

- Updated backend URL config and frontend navigation
- Role permissions reduced to Inventory + POS scope

## Phase 2 - Data Review and Archive

- Confirm whether historical data in de-scoped tables must be retained.
- If retention required, export to archive tables/files (CSV/SQL dump).
- Obtain client sign-off for each module before physical table drop.

Deliverables:

- Signed de-scope decision log
- Archive package (if required)

## Phase 3 - Schema Removal (Controlled)

- Remove de-scoped app references from INSTALLED_APPS (only after migration plan is ready).
- Generate explicit Django migrations to drop related tables and constraints.
- Apply in staging, run regression tests, then apply in production window.

Deliverables:

- Migration files
- Staging validation report
- Production deployment record

## Phase 4 - Post-Cleanup Hardening

- Simplify serializers, services, admin classes, and tests.
- Remove dead code imports and signals tied to removed modules.
- Re-seed clean reference data for single store + 3 roles.

Deliverables:

- Clean code pass complete
- Updated technical docs

---

## 7. Technical Checklist (Execution)

- [ ] Confirm one active warehouse exists.
- [ ] Map all foreign keys pointing to procurement/pricing/invoices tables.
- [ ] Disable API endpoints for de-scoped modules.
- [ ] Disable frontend pages/routes for de-scoped modules.
- [ ] Remove role checks for old groups.
- [ ] Archive legacy data if needed.
- [ ] Run migration drops in staging.
- [ ] Run regression tests for Inventory and POS flows.
- [ ] Deploy to production with rollback window.

---

## 8. Risks and Mitigations

- Risk: Hidden dependencies break after table removal.
  - Mitigation: Phase 1 feature freeze + dependency scan before dropping.

- Risk: Historical reports need old data.
  - Mitigation: Archive and provide static report exports.

- Risk: Warehouse assumptions still exposed in UI.
  - Mitigation: Force default warehouse server-side and remove warehouse selectors.

- Risk: Role mismatch causes permission bugs.
  - Mitigation: Explicit permission matrix for superadmin/admin/staff and endpoint tests.

---

## 9. Recommended First Cut (Lowest Risk)

Execute this first to get immediate simplification without major breakage:

1. Keep warehouse table but enforce single warehouse record.
2. Keep customers.customer, remove customer_address only if unused.
3. Disable procurement, pricing, invoices from UI and API.
4. Keep their tables temporarily for safety.
5. After 2 to 4 weeks of stable use, drop de-scoped tables.

This approach reduces complexity now while minimizing production risk.

---

## 10. Success Criteria

The simplification is successful when:

- Daily operations run fully on Inventory + POS only.
- Only 3 roles are used in production.
- No branch/bodega workflows remain in UI/API.
- Codebase and schema no longer contain unused module dependencies.
- Team can onboard and operate system with lower maintenance overhead.

---

## 11. Implementation Status (2026-04-03)

Completed in codebase:

- Role model shifted to superadmin/admin/staff in backend access checks and frontend role parsing.
- JWT role claims now include superadmin for Django superusers.
- Seed strategy updated to create superadmin/admin/staff users and groups.
- POS API warehouse filtering now defaults to a single active POS warehouse (single-store guard).
- Procurement access flag in frontend permissions is disabled.
- Data from `procurement`, `pricing`, and `invoices` has been archived to `contexts/archive.sql`.
- The `procurement`, `pricing`, and `invoices` apps have been removed from runtime `INSTALLED_APPS`; the `procurement` app directory has been removed from the backend codebase.
- A migration has been created and applied to drop the database tables for `procurement`, `pricing`, and `invoices`.
- Seed commands were updated to remove dependencies on de-scoped apps.
- Frontend role gate checks were updated from admin/cashier to superadmin/admin/staff.
- Local regression checks passed (`python manage.py check`, seed command imports, POS transaction detail API smoke test, and `npm run build`).

Still pending:

- Regression test run in staging after all Phase 1/2 tasks are finalized (see Section 12 checklist).

---

## 12. Staging Regression Checklist (Pending)

Run this checklist in staging before production promotion.

Local dry-run execution evidence (2026-04-03):

- Step 1 passed locally:
  - `python manage.py check` -> no issues.
  - `python manage.py showmigrations` -> all active migrations applied.
  - `python manage.py phase1_db_preflight` -> passed (`Pending migrations: 0`, `Target table coverage: 100.00%`).
- Step 2 passed locally:
  - `python manage.py seed_rbac_data` -> completed.
  - `python manage.py seed_sample_data` -> completed.
- Step 3 partially validated locally:
  - Initial APIClient run failed with `DisallowedHost` because `testserver` is not in `ALLOWED_HOSTS`.
  - Re-run using `HTTP_HOST=localhost` passed for:
    - `POST /api/auth/login/` (200)
    - `GET /api/auth/profile/` (200)
    - `GET /api/catalog/items/` (200)
    - `GET /api/pos/dashboard/` (200)
    - `GET /api/pos/transactions/` (200)
- Step 4 passed locally (data-integrity checks on seeded data):
  - Completed sales transactions checked: 3
  - Sale stock-movement linkage issues: 0
  - Payment-vs-total consistency issues: 0
  - Restock return items checked: 0 (no return rows in current seed set)
- Step 5 passed locally:
  - `npm run build` completed successfully.
  - Build warning observed only for large JS/CSS chunk size, no build failure.
- Step 6 passed locally (route/navigation exposure scan):
  - No active backend route matches for procurement/pricing/invoices in `config/urls.py`.
  - No frontend route/navigation exposure found for procurement/pricing/invoices.
  - Frontend permission flag confirms procurement access remains disabled (`canAccessProcurement: false`).

Notes:

- JWT signing key warning observed in local smoke run: HMAC key length is below recommended 32 bytes for SHA-256. This is not a functional blocker for checklist execution but should be corrected before production hardening.
- Full checklist rerun in staging/UAT is still required with environment-specific evidence capture.

Preconditions:

- Staging DB refreshed from latest sanitized snapshot.
- Runtime matches de-scoped config (no procurement/pricing/invoices in active routes).
- One active warehouse record exists and is used by POS flows.

Execution steps:

1. Backend health checks
  - `python manage.py check`
  - `python manage.py showmigrations`
  - `python manage.py phase1_db_preflight`

2. Seed and baseline verification
  - `python manage.py seed_rbac_data`
  - `python manage.py seed_sample_data`
  - Verify only `superadmin/admin/staff` are active login roles.

3. Core API smoke tests
  - Auth: login/profile/refresh/logout
  - Catalog: list/search/detail/update
  - POS: create transaction, complete sale, retrieve transaction detail
  - Dashboard/transactions endpoints return 200 and expected schema

4. Core business workflow checks
  - Part sale deducts stock and writes stock movement.
  - Return with restock restores stock and writes reverse movement.
  - Receipt/payment totals remain consistent with transaction totals.

5. Frontend regression
  - Build: `npm run build`
  - Validate dashboard, transactions, catalog, POS screens render and function.
  - Confirm no warehouse selector/filter UI remains in dashboard/transactions.

6. De-scope verification
  - Confirm no active navigation/routes expose procurement/pricing/invoices.
  - Confirm role permissions do not include procurement module actions.

Pass criteria:

- All checks and commands complete with no errors.
- Core POS and inventory workflows pass end-to-end.
- No schema/contract mismatches observed in frontend.
- No runtime references to de-scoped modules are reachable by users.

Failure handling:

- Capture failing command/test, endpoint, payload, and stack trace.
- Revert staging deploy to previous known-good build if blocker is critical.
- Open fix ticket linked to failed checklist item and rerun full checklist.
