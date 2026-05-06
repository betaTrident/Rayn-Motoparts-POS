# Unified Product Modal Fix Plan (Flow + Data Integrity)

## Context
This plan addresses issues observed in the newly implemented unified product modal:
1. Footer actions remain visible after product creation (`Cancel` + `Create Product & Continue`) when they should not.
2. Create flow order is incorrect.
3. Initial stock quantity setup is unclear.
4. Inventory/adjustment tabs can show pre-existing non-zero values immediately after create.
5. Occasional `500` on product create needs hardened UX handling.

Date: 2026-05-07

---

## Expected Create Flow (Target UX)

### Required sequence
1. `Details` tab
2. Click `Create Product & Continue`
3. Redirect to `Stock Adjustment` tab (2nd step)
4. Save adjustment (`Save & Continue`)
5. Redirect to `Inventory Setup` tab
6. Save inventory settings (`Finish`)
7. Close dialog

### Footer behavior by stage (Create mode)
- Stage `details` (pre-create):
  - Show global footer with `Cancel` + `Create Product & Continue`
- Stage `adjustment` (post-create):
  - Hide global footer
  - Only tab-level CTA visible: `Save & Continue`
- Stage `inventory` (post-adjustment):
  - Hide global footer
  - Only tab-level CTA visible: `Save Inventory Settings`

In short: after successful create, the old global footer action must disappear.

---

## Root Cause Analysis

## 1) Wrong stock row loaded after create/edit

### Observed
Inventory/Stock Adjustment tab can display non-zero `On Hand` and `Available` even before user configures anything.

### Root cause
Frontend calls `GET /inventory/stock/?variant_id={id}&page_size=1`, but backend `InventoryStockListView` does not currently filter by `variant_id`.
It returns the first row by `variant_sku`, causing cross-product data leakage in UI context.

### Impact
- Misleading stock snapshot
- Wrong row can be configured/adjusted
- High risk of updating unrelated SKU stock

---

## 2) Create-mode state machine is incomplete

### Observed
After create success, tab switches but global primary footer remains active and semantically stale.

### Root cause
Dialog lacks explicit staged flow state (pre-create vs post-create-adjust vs post-adjust-configure).
Footer is rendered unconditionally regardless of stage.

---

## 3) Step order mismatch with desired process

### Observed
Current post-create route goes to `Inventory Setup` first.

### Required
Stock quantity should be set first via Stock Adjustment, then reorder policy via Inventory Setup.

### Reasoning
- Quantity initialization is operationally primary.
- Reorder thresholds are policy metadata and should follow quantity set.

---

## 4) Product create 500 handling

### Observed
Console shows `POST /api/products/items/` -> `500`.

### Likely causes
- Required reference data (UOM/tax rate) missing in some environments.
- Backend validation/path exceptions not surfaced as user-friendly field errors.

### Frontend gap
Create flow assumes happy path and does not branch state by recoverable server failures with stage lock safety.

---

## Strategic Fix Design

## A. Introduce explicit create flow state machine

Use deterministic stage state:
- `details_pending_create`
- `created_pending_adjustment`
- `adjustment_saved_pending_inventory`
- `completed`

Rules:
- Only allow transitions in order.
- Disallow tab jumps that violate stage.
- Render actions by stage (global footer only in first stage).

---

## B. Reorder tabs and locked navigation

Create mode tab order:
1. Details
2. Stock Adjustment
3. Inventory Setup

Edit mode tab order:
- Keep all available; can still present same order for consistency.

Lock rules in create mode:
- Before create: only Details enabled
- After create before adjustment save: only Stock Adjustment enabled
- After adjustment save: Inventory Setup enabled

---

## C. Fix backend inventory list filter contract

### Backend change (required)
Add `variant_id` filter support in `InventoryStockListView.get()`:
- Read query param `variant_id`
- Apply `queryset = queryset.filter(product_variant_id=variant_id)` when provided

### Frontend safety
- Keep dedicated helper `fetchStockByVariantId(variantId)`.
- Add defensive assertion after fetch: row.variant_id must equal requested id.
- If mismatch, treat as error and block continuation.

This is the key fix for incorrect non-zero stock snapshots.

---

## D. Clarify quantity initialization UX

In create mode, Stock Adjustment tab should include:
- Helper text: "Set opening quantity for this new product."
- Primary CTA: `Save & Continue`

Behavior:
- If quantity > 0 and save succeeds, transition to Inventory Setup.
- If user wants zero opening stock, allow explicit skip action `Continue with 0 Stock` (optional UX decision).

Recommendation: Keep skip available but explicit, to avoid forced fake adjustments.

---

## E. Footer action architecture

Global footer should be conditional:
- Visible only in `details_pending_create` and `edit` mode.
- Hidden in post-create create stages.

Tab-local CTAs own progression after creation:
- Stock Adjustment: `Save & Continue`
- Inventory Setup: `Save Inventory Settings`

Prevents duplicate/contradictory CTAs.

---

## F. Error handling and resiliency

## Create step
- Preserve current form values on failure.
- Surface parsed API error and keep user on Details.

## Post-create stock fetch
- Retry with short backoff (e.g., 3 tries, 200ms/400ms/800ms) in case stock row signal is eventually consistent.
- On terminal failure, show blocking inline error with action: `Retry load stock context`.

## 500 response observability
- Log correlation context (payload subset + product name/sku + timestamp) client-side (non-sensitive).
- Ensure parseApiError fallback message is human-readable.

---

## Implementation Plan (Ordered)

1. Backend contract fix
- Implement `variant_id` filtering in `apps/backend/inventory/views.py` list endpoint.
- Add backend test to assert exact row selection.

2. Frontend flow state refactor
- Add create-stage enum state in `UnifiedProductDialog`.
- Reorder create tabs to `Details -> Stock Adjustment -> Inventory Setup`.
- Enforce locked transitions by stage.

3. Footer and CTA refactor
- Render global footer only in Details stage (create mode) and edit mode.
- Rename adjustment CTA to `Save & Continue`.
- Keep inventory CTA as final `Save Inventory Settings`.

4. Data integrity guards
- After `fetchStockByVariantId`, validate returned row matches requested `variant_id`.
- Show error and block progression on mismatch.

5. UX copy and hints
- Add opening stock helper copy in Stock Adjustment tab.
- Add optional explicit skip action for zero opening stock (decision: product owner).

6. Testing
- Unit/integration tests for create-mode stage transitions.
- Manual E2E:
  - Create product -> lands on Stock Adjustment
  - Save adjustment -> lands on Inventory Setup
  - Final save closes dialog
  - No stale global footer after create
  - Snapshot values belong to created variant only

---

## Acceptance Criteria

1. After successful create, `Cancel` and `Create Product & Continue` are no longer visible.
2. Create flow is strictly: `Details -> Stock Adjustment -> Inventory Setup`.
3. Stock quantity can be initialized in Stock Adjustment immediately after create.
4. Inventory/Adjustment snapshots always correspond to the created/edited variant (never unrelated rows).
5. Backend supports `variant_id` filter for inventory stock list.
6. All transitions and save actions are robust under API errors.

---

## Notes on Current Non-Zero Values

If non-zero appears immediately after create, it is almost certainly due to wrong row retrieval (missing backend variant filter), not because a new product stock row should start non-zero.
Default new stock row from signal is:
- `qty_on_hand = 0`
- `qty_reserved = 0`
- `avg_cost = variant cost`

So new product should display zero unless intentionally adjusted.
