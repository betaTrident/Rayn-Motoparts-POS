# Frontend-Backend Alignment Implementation Plan

## Objective
Align the React frontend with the current Django backend implementation so the UI reflects real backend capabilities, avoids broken integrations, and is ready for incremental feature rollout.

## Current State Snapshot

### Backend (implemented)
- Core domain models are implemented and migrated for:
  - `authentication`, `catalog`, `vehicles`, `inventory`, `procurement`, `pos`, `customers`, `invoices`, `pricing`
- Business logic exists for:
  - POS transaction completion and invoice generation
  - Inventory adjustments through signals on sales/returns/procurement receipts
- Seed commands exist:
  - `seed_reference_data`
  - `seed_sample_data`
- Audit logging is enabled via `django-auditlog`

### Backend (currently exposed API)
- Only auth routes are currently exposed in URL config:
  - `/api/auth/register/`
  - `/api/auth/login/`
  - `/api/auth/logout/`
  - `/api/auth/token/refresh/`
  - `/api/auth/profile/`
  - `/api/auth/change-password/`

### Frontend (implemented)
- Auth flow is integrated and largely compatible with backend auth endpoints.
- Product pages/services currently call endpoints that do not yet exist on backend (e.g., `products/items`, `products/categories`).

## Strategic Direction
Treat this as a staged integration program with a contract-first API layer.

1. Stabilize API contracts from backend domain models.
2. Build frontend feature modules only when corresponding backend endpoints are available.
3. Introduce shared DTO mapping and query keys to isolate UI from backend shape changes.
4. Use feature flags/route guards so unfinished modules do not break production UX.

## Guiding Principles
- Single source of truth: backend models and serializers define API contracts.
- Incremental delivery: ship vertical slices (backend endpoints + frontend pages) per domain.
- Backward-safe frontend: avoid hardcoded assumptions where backend is still evolving.
- Testability first: each phase includes API contract checks and UI integration tests.
- Idempotent initialization: rely on management commands for local/test data setup.

## Phase Plan

## Phase 0: Contract and Integration Foundation
Goal: Prevent integration drift before adding new frontend features.

Deliverables:
1. Create backend API namespace structure:
   - `/api/catalog/...`
   - `/api/inventory/...`
   - `/api/procurement/...`
   - `/api/pos/...`
   - `/api/customers/...`
   - `/api/invoices/...`
   - `/api/pricing/...`
2. Add OpenAPI schema generation (drf-spectacular or equivalent).
3. Publish first versioned API contract (`v1`).
4. Frontend: replace direct endpoint strings with centralized endpoint map and typed clients.

Frontend tasks:
1. Add `src/services/endpoints.ts` for route constants.
2. Add `src/services/http-client.ts` wrapper around axios for normalized errors.
3. Add query key factory in `src/services/queryKeys.ts`.

## Phase 1: Auth and Session Experience Hardening
Goal: Fully align auth UX with backend JWT + role claims.

Deliverables:
1. Surface JWT claim usage (`roles`, `warehouse_id`) in frontend auth state.
2. Add role-aware route guards and navigation visibility.
3. Add profile edit/change password pages using existing endpoints.

Frontend tasks:
1. Extend auth user type to include role and warehouse context.
2. Add `usePermissions` hook derived from token claims/user profile.
3. Update sidebar/menu visibility per role.

Definition of done:
1. Login/logout/refresh works under expired-token scenarios.
2. Unauthorized users are redirected with clear messaging.

## Phase 2: Catalog Module (Products, Categories, Variants)
Goal: Replace current placeholder product integration with real backend APIs.

Backend prerequisite:
1. Implement and expose DRF viewsets/serializers for:
   - categories
   - products
   - product variants
   - barcodes

Frontend tasks:
1. Refactor `productService` to match actual backend payloads.
2. Split current products page into module components:
   - `ProductList`
   - `ProductForm`
   - `CategoryManager`
   - `VariantEditor`
3. Support server-side pagination/filtering/sorting.
4. Add optimistic updates only where safe.

Definition of done:
1. No mocked product shape remains in UI state.
2. CRUD operations map 1:1 to backend API fields.

## Phase 3: Inventory and Procurement Module
Goal: Operational stock and purchasing views reflecting backend signal-driven behavior.

Backend prerequisite:
1. Expose endpoints for:
   - warehouses
   - inventory stock
   - stock movements
   - suppliers
   - purchase orders and PO items

Frontend tasks:
1. Implement stock dashboard:
   - on-hand
   - reserved
   - reorder alerts
2. Implement PO workflow screens:
   - create PO
   - receive items
   - status tracking
3. Add movement timeline view from `stock_movements`.

Definition of done:
1. Receiving PO items updates inventory state after refresh without custom frontend mutation math.

## Phase 4: POS, Transactions, Returns
Goal: Frontend POS experience backed by real transaction services.

Backend prerequisite:
1. Expose endpoints for:
   - terminals
   - cash sessions
   - transactions/items/payments
   - returns
   - complete sale action endpoint

Frontend tasks:
1. Build POS workflow:
   - open session
   - add line items
   - complete sale
   - print/preview receipt
2. Build return workflow:
   - search transaction
   - process return
   - restock toggle behavior
3. Add cashier dashboard for current session totals.

Definition of done:
1. Completing sale from UI generates corresponding invoice record.
2. Return operations reflect inventory behavior from backend signals.

## Phase 5: Customers, Invoices, Pricing
Goal: Complete customer lifecycle and commercial controls.

Backend prerequisite:
1. Expose endpoints for:
   - customers and addresses
   - invoices/items/payments
   - price tiers and tier rules
   - price/cost history

Frontend tasks:
1. Customer module:
   - customer list/search
   - profile with transaction history
2. Invoices module:
   - invoice list/detail
   - payment history and status
3. Pricing module:
   - tier management
   - tier rule assignment by variant
   - history visualizations

Definition of done:
1. Price rule and history views match backend model semantics.
2. Invoice screens consume generated invoice data from completed sales.

## Phase 6: Quality, Performance, and Production Readiness
Goal: Make integrated platform resilient and maintainable.

Deliverables:
1. Add frontend integration tests (MSW or staging API).
2. Add E2E tests for critical flows:
   - login and role routing
   - product CRUD
   - PO receipt
   - POS sale completion
   - returns
3. Add error observability and structured logging.
4. Add loading, empty, and degraded states for all domain pages.

## Frontend Architecture Adjustments

## API Layer
1. Introduce typed DTOs per domain (`src/types/api/*`).
2. Add mapper functions between API DTOs and UI models.
3. Normalize all API errors into one shape (`message`, `fieldErrors`, `code`).

## State and Caching
1. Keep server state in React Query only.
2. Keep UI state local to feature modules.
3. Standardize query key composition by module and filters.

## Routing and Access
1. Route groups by domain module.
2. Guard modules by auth + role claims.
3. Hide unavailable modules behind feature flags until APIs are live.

## UX Conventions
1. Use shared page states for loading/error/empty/success.
2. Use toasts only for action feedback, not as primary error surfaces.
3. Prefer inline validation errors from backend serializer responses.

## Implementation Order Recommendation
1. Auth hardening (quick win, least dependency)
2. Catalog APIs + Product UI refactor
3. Inventory + Procurement operations
4. POS transactional flow
5. Customers + Invoices + Pricing
6. Test suite and production hardening

## Risks and Mitigations
1. Risk: frontend built ahead of API contracts.
   - Mitigation: OpenAPI schema and endpoint constants as gate.
2. Risk: data shape mismatch from legacy product UI types.
   - Mitigation: DTO mappers and strict TypeScript interfaces.
3. Risk: race conditions in POS workflow.
   - Mitigation: rely on backend transactions/signals; frontend avoids local stock arithmetic.
4. Risk: permissions drift between backend roles and frontend routes.
   - Mitigation: derive route access from token claims and profile response.

## Immediate Next Actions (Week 1)
1. Backend: expose `catalog` read/write endpoints and register URLs under `/api/catalog/`.
2. Frontend: replace current `productService` endpoint paths with module endpoint constants.
3. Frontend: introduce `api` DTO types for catalog and migrate products page to those DTOs.
4. Backend + Frontend: lock first OpenAPI contract and validate against frontend build.

## Success Criteria
1. Every visible frontend domain screen maps to an implemented backend endpoint.
2. No hardcoded or speculative payload fields remain in frontend services.
3. Core workflows (auth, catalog CRUD, PO receipt, sale completion, return) pass E2E tests.
4. Seeded local data supports realistic QA scenarios using `seed_sample_data`.
