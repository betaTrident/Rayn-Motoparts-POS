# POS Module Completion Plan

> Version: 1.0  
> Status: Analysis Complete, Implementation Plan Ready  
> Scope: Full-stack POS completion across Django backend and React frontend

---

## 1. Executive Summary

The current POS module is only a product browser plus a local in-memory cart. The backend already contains most of the persistent domain model needed to run a working POS flow:

- `CashSession`
- `SalesTransaction`
- `SalesTransactionItem`
- `TransactionPayment`
- `Receipt`, `ReceiptItem`, `ReceiptPayment`
- `SalesReturn`, `SalesReturnItem`

What is missing is the application flow that connects those pieces safely.

The most important design constraint discovered in the codebase is this:

> `SalesTransactionItem` creation immediately deducts inventory through a `post_save` signal in `apps/backend/pos/signals.py`.

Because of that, the safest implementation is:

- keep the cart client-side until final checkout submission
- perform checkout as one atomic backend write
- create transaction items only inside that final write
- never persist draft cart rows as pending `SalesTransactionItem` records

That decision avoids stock leakage from abandoned carts and aligns with the current signal-based inventory design.

---

## 2. Current Codebase State

### 2.1 Frontend POS

File: [PosModulePage.tsx](</k:/Rayn-Motoparts-POS/apps/web/src/components/modules/pos/PosModulePage.tsx>)

Current behavior:

- loads active categories and products through `usePosCatalog`
- supports local search, category filter, local cart, qty increment/decrement
- computes subtotal locally
- disables checkout entirely

Current limitation:

- no checkout mutation
- no payment method selection
- no customer selection
- no cash session state
- no receipt rendering or post-checkout success state

### 2.2 Frontend POS Data Hooks

Files:

- [usePos.ts](</k:/Rayn-Motoparts-POS/apps/web/src/hooks/modules/usePos.ts>)
- [pos.service.ts](</k:/Rayn-Motoparts-POS/apps/web/src/services/modules/pos.service.ts>)

Current behavior:

- only supports catalog reads for POS
- no write service, no session bootstrap, no payment methods, no receipt fetch

### 2.3 Backend POS Read APIs

File: [apps/backend/pos/urls.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/urls.py>)

Currently exposed:

- `GET /api/pos/dashboard/`
- `GET /api/pos/transactions/`
- `GET /api/pos/transactions/<id>/`

There are no write endpoints for checkout, cart submission, session control, receipt retrieval, or void.

### 2.4 Backend POS Models Already Available

File: [apps/backend/pos/models.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/models.py>)

Useful existing pieces:

- `CashSession`: cashier session lifecycle
- `SalesTransaction`: sales header with totals and status
- `SalesTransactionItem`: item lines with computed line amounts
- `PaymentMethod`: payment reference table
- `TransactionPayment`: transaction payments
- `Receipt*` models: receipt snapshot and numbering
- `SalesReturn*`: return flow foundation

### 2.5 Existing Backend Sale Finalization Service

File: [apps/backend/pos/services.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/services.py)

Existing function:

- `complete_sale(transaction_id, amount_tendered, payment_method_id, performed_by)`

What it does:

- validates open cash session
- validates tendered amount against transaction total
- marks transaction completed
- creates one `TransactionPayment`
- optionally dual-writes receipt snapshot based on rollout flags

What it does not do:

- create the transaction header
- create the transaction items
- calculate totals
- accept multiple payments
- accept payment reference numbers
- validate stock before writing item rows

### 2.6 Inventory Side Effects

File: [apps/backend/pos/signals.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/signals.py)

Current behavior:

- creating `SalesTransactionItem` deducts inventory immediately
- creating `SalesReturnItem` restores inventory when `restock=True`

This is the most critical implementation constraint in the codebase.

### 2.7 Receipt Dual-Write Path

File: [apps/backend/pos/receipt_dual_write.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/receipt_dual_write.py)

Current capability:

- create `Receipt`, `ReceiptItem`, and `ReceiptPayment` from a completed transaction
- issue receipt numbers from `ReceiptSequence`
- mirror receipt writes behind rollout flags

This is useful and should be reused, not replaced.

### 2.8 Seeded Sample Flow

File: [seed_sample_data.py](</k:/Rayn-Motoparts-POS/apps/backend/core/management/commands/seed_sample_data.py)

Observed write pattern:

1. create pending `SalesTransaction`
2. create `SalesTransactionItem` rows
3. calculate totals
4. call `complete_sale(...)`

This works for seed data, but it is not a safe user-facing draft-cart design because item creation already changes stock.

---

## 3. Root Gaps

### 3.1 Functional Gaps

- no checkout API
- no payment methods read API for POS UI
- no customer lookup/create-in-flow for POS
- no cash session bootstrap/open/close APIs
- no receipt read/reprint API
- no void transaction API
- no return creation API from POS transaction detail
- no POS bootstrap endpoint to hydrate everything the screen needs

### 3.2 Domain Gaps

- no explicit server-side checkout payload contract
- no multi-payment support in checkout service
- no clear rule for cash vs non-cash tender validation
- no receipt-first success response contract
- no authoritative stock validation just before commit

### 3.3 UX Gaps

- no checkout sheet or tender workflow
- no success receipt screen
- no customer attachment flow
- no cashier/session visibility
- no blocked-item stock messaging

### 3.4 Safety Gaps

- stock deduction occurs too early if item rows are created before final confirmation
- no idempotency strategy for repeated checkout submits
- no server-side reconciliation between frontend cart totals and backend pricing/tax calculations

---

## 4. Recommended Architecture

### 4.1 Guiding Principle

Treat the POS cart as a frontend draft and the backend checkout as a single atomic commit.

Recommended write flow:

1. frontend builds local cart
2. user opens checkout sheet
3. frontend submits a single checkout payload
4. backend validates session, stock, pricing, payments, and customer
5. backend creates transaction header and item rows inside one DB transaction
6. backend finalizes payment and receipt in the same flow
7. backend returns completed transaction plus receipt summary

### 4.2 Do Not Persist Draft Cart Rows

Do not create `SalesTransaction` + `SalesTransactionItem` drafts while the cashier is still editing the cart.

Reason:

- `SalesTransactionItem` creation currently deducts inventory
- abandoned carts would corrupt stock
- fixing that later would require compensating writes or redesigning the signal behavior

### 4.3 Checkout Service Shape

Add a new application service, separate from `complete_sale`, for example:

```python
create_and_complete_sale(
    *,
    cash_session_id: int,
    cashier,
    customer_id: int | None,
    customer_name: str | None,
    items: list[CheckoutItemInput],
    payments: list[CheckoutPaymentInput],
    notes: str | None = None,
) -> CheckoutResult
```

Responsibilities:

- resolve and lock inventory rows for all variants
- validate every variant is active and sellable
- compute authoritative prices/taxes from backend data
- create `SalesTransaction`
- create `SalesTransactionItem` rows
- compute and persist totals
- create `TransactionPayment` rows
- mark transaction completed
- invoke receipt dual-write if enabled
- return transaction and receipt payload

### 4.4 Receipt Strategy

Use existing receipt dual-write infrastructure as the canonical receipt snapshot mechanism.

Plan outcome:

- always return a receipt-shaped success payload after checkout
- expose a receipt read endpoint
- support reprint and later PDF/thermal formatting as a separate phase

### 4.5 Session Strategy

The POS screen should not be usable without an open `CashSession`.

Required behavior:

- on page load, fetch active session for current user
- if none exists, show an open-session flow
- if session is closed, disable checkout

---

## 5. API Plan

### Phase 1: POS Bootstrap and Checkout Foundation

Add endpoints:

- `GET /api/pos/bootstrap/`
- `POST /api/pos/checkout/`
- `GET /api/pos/payment-methods/`
- `GET /api/pos/cash-session/current/`

#### `GET /api/pos/bootstrap/`

Purpose:

- hydrate POS page in one request when possible

Suggested payload:

```json
{
  "cashSession": {
    "id": 1,
    "sessionCode": "CS-20260430-001",
    "status": "open",
    "openingBalance": 5000
  },
  "paymentMethods": [
    { "id": 1, "code": "CASH", "name": "Cash" },
    { "id": 2, "code": "GCASH", "name": "GCash" }
  ]
}
```

#### `POST /api/pos/checkout/`

Suggested input:

```json
{
  "cash_session_id": 1,
  "customer_id": 12,
  "customer_name": "Walk-in Customer",
  "items": [
    { "variant_id": 4, "qty": 2 }
  ],
  "payments": [
    { "payment_method_id": 1, "amount": 500, "reference_number": null }
  ],
  "notes": ""
}
```

Suggested response:

```json
{
  "transaction": {
    "id": 101,
    "transactionNumber": "TXN-20260430-0001",
    "status": "completed",
    "totalAmount": 440,
    "amountTendered": 500,
    "changeGiven": 60
  },
  "receipt": {
    "id": 88,
    "receiptNumber": "OR-000088"
  }
}
```

### Phase 2: Receipt and Transaction Operations

Add endpoints:

- `GET /api/pos/receipts/<id>/`
- `POST /api/pos/receipts/<id>/reprint/`
- `POST /api/pos/transactions/<id>/void/`

### Phase 3: Session Controls

Add endpoints:

- `POST /api/pos/cash-sessions/open/`
- `POST /api/pos/cash-sessions/<id>/close/`
- `GET /api/pos/cash-sessions/history/`

### Phase 4: Returns Completion

Add endpoints:

- `POST /api/returns/`
- optional: `POST /api/returns/<id>/approve/` if approval is required by role

---

## 6. Backend Implementation Plan

### 6.1 New Serializer / Validation Layer

Add `apps/backend/pos/serializers.py`.

Needed serializers:

- `PosCheckoutItemSerializer`
- `PosCheckoutPaymentSerializer`
- `PosCheckoutRequestSerializer`
- `CurrentCashSessionSerializer`
- `PaymentMethodSerializer`
- `ReceiptReadSerializer`

Reason:

- centralize request validation
- stop pushing ad hoc JSON parsing into views

### 6.2 New POS Write Views

Extend [apps/backend/pos/views.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/views.py>) with:

- `PosBootstrapView`
- `CurrentCashSessionView`
- `PaymentMethodListView`
- `PosCheckoutView`
- `ReceiptDetailView`
- `TransactionVoidView`

### 6.3 New Checkout Service

Add a new service path in [apps/backend/pos/services.py](</k:/Rayn-Motoparts-POS/apps/backend/pos/services.py>) instead of overloading `complete_sale`.

Recommended split:

- keep `complete_sale(...)` for backward compatibility
- add `create_and_complete_sale(...)` as the new checkout path

### 6.4 Stock Validation and Locking

Before creating any item rows:

- fetch all relevant `InventoryStock` rows with `select_for_update()`
- validate available quantity against requested qty
- reject with a user-readable `400` before any writes occur

Why this matters:

- once `SalesTransactionItem` rows are created, inventory signals fire
- all stock validation must happen before that point

### 6.5 Transaction Number Generation

The current model requires unique `transaction_number`, but no generation helper exists in the main runtime path.

Add a helper for deterministic numbering, for example:

- daily prefix: `TXN-YYYYMMDD-XXXX`
- generate inside DB transaction
- guard uniqueness with retry on conflict

### 6.6 Payment Rules

Implement explicit rules:

- one or more payments allowed
- sum of payments must be `>= total_amount`
- change is only valid when overpayment occurs
- non-cash methods should generally require exact or reference-backed payment

Recommended MVP:

- allow one payment only in Phase 1
- structure request and service so multi-payment can be added without breaking the API

### 6.7 Void Strategy

Voiding is not just a status flip. A proper void flow must:

- validate permission
- block void if already refunded or voided
- restore inventory for all sale lines
- create compensating `StockMovement` records
- void or annotate receipt snapshot

This should be Phase 2, not bundled into initial checkout delivery.

### 6.8 Returns Strategy

The models exist, but write APIs do not.

Return flow should:

- load original transaction detail
- allow partial per-line qty return
- create `SalesReturn` and `SalesReturnItem`
- restock optionally
- update transaction status to `PARTIALLY_REFUNDED` or `REFUNDED`

---

## 7. Frontend Implementation Plan

### 7.1 POS Data Layer

Extend:

- [usePos.ts](</k:/Rayn-Motoparts-POS/apps/web/src/hooks/modules/usePos.ts>)
- [pos.service.ts](</k:/Rayn-Motoparts-POS/apps/web/src/services/modules/pos.service.ts>)

Add:

- `usePosBootstrap()`
- `useCheckout()`
- `useCurrentCashSession()`
- `useReceiptDetail()`

### 7.2 POS UI Restructure

Refactor [PosModulePage.tsx](</k:/Rayn-Motoparts-POS/apps/web/src/components/modules/pos/PosModulePage.tsx>) into smaller parts:

```text
components/modules/pos/
  PosModulePage.tsx
  parts/
    PosToolbar.tsx
    PosProductGrid.tsx
    PosCartPanel.tsx
    PosCheckoutSheet.tsx
    PosReceiptDialog.tsx
    PosSessionBanner.tsx
```

### 7.3 Checkout UX

Recommended UX:

1. cashier builds cart
2. clicks `Complete Checkout`
3. checkout sheet opens
4. cashier selects payment method, tendered amount, optional customer
5. submit
6. success dialog shows receipt summary and actions:
   - `New Sale`
   - `View Receipt`
   - `Print Receipt` later

### 7.4 Error Handling

POS errors must be specific:

- insufficient stock
- no open cash session
- inactive payment method
- underpayment
- stale product/variant not found

Do not use generic toast-only failure for checkout.

Use:

- form-level error for checkout validation failures
- toast for successful completion

### 7.5 Customer Flow

Recommended MVP:

- attach existing customer by search
- allow walk-in customer name override

Do not block Phase 1 on full in-POS customer creation unless business requires it immediately.

### 7.6 Receipt UX

Phase 1:

- render post-sale receipt summary dialog using checkout response

Phase 2:

- add detailed receipt view backed by receipt endpoint
- add print/reprint action

---

## 8. Testing Plan

### 8.1 Backend Tests

Add tests for:

- checkout success
- checkout fails on insufficient stock
- checkout fails with closed session
- checkout fails on underpayment
- receipt snapshot created when receipt dual-write flag is enabled
- transaction number uniqueness under repeated calls
- inventory movement created exactly once per sold line

### 8.2 Frontend Tests

Add tests for:

- bootstrap loads session and payment methods
- checkout button disabled when cart empty
- checkout submit success clears cart and opens receipt dialog
- insufficient stock error renders in form
- session missing state blocks checkout

### 8.3 Reconciliation Safety

After Phase 1 implementation:

- run `python apps/backend/manage.py check`
- run frontend build
- verify system reconciliation metrics remain stable
- verify receipt parity when receipt flags are enabled

---

## 9. Recommended Delivery Sequence

### Phase A: Safe Checkout Foundation

- add payment methods read endpoint
- add current session endpoint
- add atomic checkout endpoint
- add frontend checkout sheet
- add receipt success dialog

Outcome:

- cashier can complete a sale end to end

### Phase B: Receipt Read and Reprint

- add receipt detail endpoint
- add frontend receipt dialog/page
- add reprint tracking

Outcome:

- receipts become operable after sale, not just generated silently

### Phase C: Session Operations

- add open/close session endpoints
- add session banner and blocking states in POS

Outcome:

- POS becomes operationally usable day to day

### Phase D: Void and Return Completion

- add void transaction flow
- add return create flow
- wire returns UI to write path

Outcome:

- post-sale corrections become complete

---

## 10. Risks and Required Decisions

### High-Risk Items

- inventory deduction timing tied to `SalesTransactionItem` creation
- receipt rollout flags can create behavior differences across environments
- current service only supports single-payment finalization

### Decisions to Lock Before Coding

1. Should Phase 1 support cash only, or cash plus digital methods?
2. Is multi-payment required immediately?
3. Is walk-in customer naming required, or can it default to generic walk-in?
4. Should void restore stock immediately, or require manager approval?
5. Should receipt view read from `Receipt` tables only when `DB_V2_POS_RECEIPT_READ_ENABLED` is on, or should the new POS UI always degrade gracefully?

---

## 11. Recommended First Implementation Slice

The best first slice is:

1. backend `GET /api/pos/bootstrap/`
2. backend `POST /api/pos/checkout/`
3. frontend checkout sheet
4. frontend receipt success dialog
5. backend and frontend tests around checkout success/failure

That slice delivers real business value with the lowest architectural risk.

It also avoids prematurely building:

- draft transaction persistence
- void flow
- full receipt printing
- return writes

Those can follow once the checkout spine is stable.

---

## 12. Implementation Recommendation

Do not implement POS by incrementally enabling the current disabled button with ad hoc API calls.

Implement it as a transaction-safe checkout spine:

- atomic backend checkout service
- strict stock validation before item row creation
- session-aware frontend checkout UX
- receipt snapshot reuse
- targeted APIs for bootstrap, checkout, and receipt read

That path fits the current codebase, respects the existing inventory side effects, and minimizes the chance of corrupting stock or payment data during rollout.
