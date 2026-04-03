# Backend Implementation Strategy
# New Database Design Rollout (Phased, Low-Risk)

## 1. Objective

Implement the new PostgreSQL-aligned database design into the Django backend in controlled phases, with strong safeguards for data integrity, compatibility, and production safety.

Scope baseline for this plan:

- Parts-only in-system catalog and transaction flow
- Services are out of scope (outside this system)
- Single-store operating model

---

## 2. Guiding Principles (Non-Negotiables)

1. Safety first: no destructive migration without backup and rollback path.
2. Backward compatibility during transition: old and new data paths can coexist temporarily.
3. Incremental delivery: each phase must be deployable and testable independently.
4. Schema first, behavior second: create structures before switching business logic.
5. Observability by default: every critical workflow has logs, metrics, and validation checks.
6. Contract-driven changes: API and serializer changes must be versioned or gated when needed.

---

## 3. Implementation Governance

## 3.1 Branching

- Use dedicated long-lived branch: `feature/db-redesign-rollout`
- Use phase sub-branches: `feature/db-redesign-p1`, `p2`, etc.
- Merge only after passing phase acceptance criteria.

## 3.2 Release Control

- Use feature flags for logic cutovers:
  - `DB_V2_READ_ENABLED`
  - `DB_V2_WRITE_ENABLED`
  - `DB_V2_TRIGGERS_ENABLED`
- Enable reads before writes wherever possible.

## 3.3 Required Environments

1. Local development
2. Shared staging with production-like data volume
3. Pre-production/UAT (if available)
4. Production

---

## 4. High-Level Phase Plan

## Phase 0: Discovery and Final Mapping

### Goals

- Freeze source-of-truth schema (parts-only variant)
- Produce exact mapping from current models/tables to target models/tables
- Identify gaps (new, changed, deprecated tables)

### Work Items

1. Build a model mapping matrix:
   - current model
   - target model
   - migration strategy (`keep`, `rename`, `split`, `merge`, `deprecate`)
2. Identify all API endpoints impacted by table/field changes.
3. Identify all services, serializers, admin modules, and signals impacted.
4. Define naming conventions and constraints for all new models.

### Deliverables

- Mapping matrix document
- Change impact matrix (API + services + admin)
- Legacy table retirement matrix (keep/archive/drop with reason)
- Final scope lock for phase execution

### Acceptance Criteria

- All current backend models accounted for
- All target tables accounted for
- Every current table has a disposition: `mapped`, `temporary`, `archive`, or `drop`
- No unresolved schema ambiguity

---

## Phase 1: Foundation and Infrastructure Readiness

### Goals

- Prepare backend for migration-heavy work
- Add migration guardrails and operational safety

### Work Items

1. Confirm PostgreSQL settings (timezone, encoding, strict transaction behavior).
2. Add migration runbook scripts:
   - backup script
   - restore script
   - migration dry-run script
3. Add DB health checks and migration preflight checks.
4. Define migration order policy (reference tables first, transactional tables later).

### Deliverables

- Migration runbook
- Preflight check command(s)
- Operational checklist for each deploy

### Acceptance Criteria

- Team can run backup/restore in staging repeatedly
- Migration dry-run is reproducible and documented

---

## Phase 2: Introduce New Schema (Non-Breaking)

### Goals

- Add new tables/enums/constraints/indexes without switching app behavior yet
- Keep existing app functionality intact

### Work Items

1. Add Django models for missing target entities:
   - suppliers domain
   - procurement domain
   - receipt domain
   - RBAC domain (if replacing current auth model strategy)
   - audit domain
2. Add migrations for new tables and indexes.
3. Add check constraints and unique constraints incrementally.
4. Add generated/computed field equivalents where appropriate in Django/PostgreSQL.

### Deliverables

- New schema migrations applied in staging
- No behavior cutover yet

### Acceptance Criteria

- Existing endpoints still pass regression tests
- New tables exist and are queryable
- Migration runtime within acceptable window

---

## Phase 3: Dual-Write and Data Backfill

### Goals

- Start writing data to both old and new structures (if needed)
- Backfill historical data into new schema

### Work Items

1. Implement idempotent backfill management commands per domain:
   - catalog
   - inventory
   - pos
   - customers
2. Add dual-write logic in service layer (not directly in views).
3. Validate row counts and financial totals between old vs new stores.
4. Add reconciliation reports:
   - totals by day
   - stock balances
   - payment totals

### Deliverables

- Backfill scripts
- Reconciliation report scripts
- Dual-write toggle support

### Acceptance Criteria

- Reconciliation variance = 0 for defined checks
- Dual-write path stable under staging load

---

## Phase 4: Business Logic Cutover (Domain by Domain)

### Goals

- Switch reads/writes from legacy structures to new schema incrementally

### Cutover Order (Recommended)

1. Catalog and fitment read paths
2. Inventory query paths
3. Procurement write paths
4. POS transaction write paths
5. Receipt generation and snapshoting
6. Reporting views and analytics endpoints

### Work Items

1. Move business rules to service layer boundaries.
2. Keep transaction boundaries explicit (`atomic` blocks).
3. Add/verify PostgreSQL trigger or app-level equivalents for:
   - stock deduction
   - return restoration
   - supplier cost history logging
4. Add protections for race conditions (`select_for_update` for stock mutation paths).

### Deliverables

- Domain-by-domain cutover PRs
- Feature flag matrix and rollout state

### Acceptance Criteria

- No negative stock regressions
- Receipt and payment totals remain correct
- End-to-end POS flow passes integration tests

---

## Phase 5: Constraint Hardening and Performance Tuning

### Goals

- Turn soft assumptions into enforced constraints
- Optimize critical query paths

### Work Items

1. Add remaining NOT NULL/UNIQUE/CHECK constraints after data is clean.
2. Validate and tune indexes based on query plans.
3. Add or optimize materialized/reporting views if needed.
4. Load-test top workflows:
   - barcode lookup
   - sale completion
   - PO receiving
   - low-stock reporting

### Deliverables

- Constraint-hardening migrations
- Query plan report (`EXPLAIN ANALYZE` snapshots)

### Acceptance Criteria

- No critical sequential scan regressions on hot paths
- p95 latency within agreed threshold for key operations

---

## Phase 6: Legacy Decommission

### Goals

- Remove old code paths and legacy tables after stability window

### Work Items

1. Disable dual-write.
2. Remove legacy feature flags.
3. Execute the approved retirement matrix for tables not present in the new design.
4. Archive legacy tables/data (or snapshot backup) before destructive changes.
5. Drop deprecated models/tables in final migration set.

### Retirement Rules (Required)

1. Do not drop a table unless reconciliation has passed for at least one full business cycle.
2. Require verified backup + restore test result before any drop migration.
3. For each drop candidate, prove no active code path depends on it (API, admin, reports, tasks).
4. Prefer 2-step retirement:
   - release N: freeze writes, keep read-only
   - release N+1: archive then drop
5. Keep a rollback snapshot and documented restore command for one release window.

### Deliverables

- Final cleanup migrations
- Decommission report

### Acceptance Criteria

- No production dependency on old schema remains
- Rollback plan retained for one release window
- All retired tables have signed-off audit notes (who approved, when dropped, backup reference)

---

## 5. Testing Strategy by Phase

## 5.1 Automated Tests

1. Unit tests for model constraints and service rules
2. Integration tests for full transactional flows
3. Migration tests (forward + backward where feasible)
4. Concurrency tests for stock updates

## 5.2 Critical End-to-End Cases

1. Part sale -> stock deduction -> payment -> receipt
2. Part return with restock
3. PO receipt -> stock increase -> avg cost update -> supplier cost history
4. Wholesale customer pricing path
5. Void/refund flow integrity

## 5.3 Data Integrity Validation

1. Referential integrity checks
2. Numeric consistency checks (totals and balances)
3. Duplicate detection for unique business keys
4. Audit trail completeness checks

---

## 6. Risk Register and Mitigations

1. Risk: data mismatch during dual-write
   - Mitigation: reconciliation reports + idempotent writes + alerts
2. Risk: stock race conditions
   - Mitigation: `select_for_update`, atomic transactions, retry logic
3. Risk: migration downtime
   - Mitigation: precompute, chunked backfills, off-peak deploy windows
4. Risk: hidden dependency on legacy fields
   - Mitigation: code search + endpoint inventory + temporary compatibility adapters
5. Risk: performance regressions
   - Mitigation: load test before cutover + targeted indexing

---

## 7. Rollback Strategy

1. Every phase deploy must have a rollback command/script.
2. Keep backward-compatible app code for at least one phase after cutover.
3. Keep validated DB backup before every schema-changing deploy.
4. If reconciliation fails, disable new-write flag immediately and revert to prior path.

---

## 8. Suggested Timeline (Adjustable)

1. Phase 0 to 1: 3 to 5 days
2. Phase 2: 4 to 7 days
3. Phase 3: 5 to 10 days (depends on data volume)
4. Phase 4: 5 to 10 days
5. Phase 5: 3 to 5 days
6. Phase 6: 2 to 4 days

Total: approximately 4 to 6 weeks for careful rollout.

---

## 9. Immediate Next Actions

1. Approve this phase strategy.
2. Start Phase 0 deliverable: current-to-target mapping matrix.
3. Generate implementation backlog tickets per phase and domain.
4. Begin with catalog + inventory foundations before POS cutover.

---

## 10. Definition of Done (Program Level)

1. New schema is fully active in production.
2. Legacy schema paths are removed or archived.
3. All critical workflows pass automated and UAT checks.
4. No unresolved reconciliation variance.
5. Monitoring dashboards and runbooks are updated and handed over.

---

## 11. Implementation Delta (2026-04-03)

Scaffolding implemented in codebase:

- Feature-flag plumbing added in backend settings via `ROLLOUT_FLAGS` with env controls:
   - `DB_V2_READ_ENABLED`
   - `DB_V2_WRITE_ENABLED`
   - `DB_V2_TRIGGERS_ENABLED`
   - `DB_V2_DUAL_WRITE_ENABLED`
   - `DB_V2_RECONCILIATION_ENABLED`
- Rollout helper utilities added: `apps/backend/core/rollout_flags.py`.
- POS write path now enforces `DB_V2_WRITE_ENABLED` and emits dual-write audit markers when `DB_V2_DUAL_WRITE_ENABLED` is true.
- Reconciliation command added: `python manage.py phase3_reconcile_core_metrics`.
   - Covers transaction line-total consistency, payment coverage, negative stock check, and orphan movement checks.
- Query-plan snapshot command added: `python manage.py phase5_query_plan_snapshot`.
   - Captures EXPLAIN/EXPLAIN ANALYZE output for hot-path queries.
- Executable PostgreSQL schema baseline artifact added: `contexts/schema.postgresql.sql`.

Still required to complete full strategy:

- Implement real dual-write persistence to v2 schema targets (current marker is observability only).
- Add domain reconciliation deep checks per migration wave (catalog/inventory/pos/customers) and CI gating.
- Implement domain-by-domain read cutover switches and fallback adapters.
- Complete phase 5 hardening: remaining constraints + benchmark thresholds + index tuning acceptance.
- Complete phase 6 decommission governance artifacts and signed retirement evidence.
