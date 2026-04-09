# Phase 0 Table Mapping Matrix
# Current Backend to New DB Design (Parts-Only)

## 1. Purpose

This matrix is the first implementation artifact for the phased rollout. It maps current backend tables to the new target design and assigns a migration strategy per table.

Strategy labels:

- map: same concept, migrate data and align schema
- add: new table required by target design
- retire: not part of target design; freeze/archive/drop by Phase 6 policy
- split: current table data redistributed into multiple target tables
- transform: keep concept, but major schema/behavior changes

---

## 2. Current to Target Mapping

| Current Table | Target Table | Strategy | Notes |
|---|---|---|---|
| authentication_user | users | transform | Extend for role-based access model and audit fields |
| catalog_brand | brands | map | Mostly direct mapping |
| catalog_category | categories | map | Preserve hierarchy and slugs |
| catalog_product | products | transform | Enforce parts-only scope and align fields |
| catalog_productbarcode | product_barcodes | map | Keep unique barcode behavior |
| catalog_productvariant | product_variants | map | Keep variant-level pricing/cost fields |
| catalog_taxrate | tax_rates | map | Align naming and constraints |
| catalog_unitofmeasure | units_of_measure | map | Remove service-only assumptions |
| customers_customer | customers | map | Preserve wholesale behavior |
| customers_customeraddress | customer_addresses | map | Preserve address labels and defaults |
| inventory_inventorystock | inventory_stock | transform | Remove warehouse dimension (single-store) |
| inventory_stockadjustment | stock_adjustments | map | Keep adjustment header logic |
| inventory_stockmovement | stock_movements | transform | Normalize movement enums/reference semantics |
| inventory_warehouse | none | retire | Out of scope in single-store target |
| pos_cashsession | cash_sessions | map | Align status enum and cash controls |
| pos_paymentmethod | payment_methods | map | Keep split payment support |
| pos_posterminal | none | retire | Not present in target design |
| pos_salesreturn | sales_returns | map | Preserve return lifecycle states |
| pos_salesreturnitem | sales_return_items | transform | Align return/restock semantics |
| pos_salestransaction | sales_transactions | transform | Align totals, status model, customer linkage |
| pos_salestransactionitem | sales_transaction_items | transform | Parts-only line rules |
| pos_transactionpayment | transaction_payments | map | Keep split payment line model |
| vehicles_productvehiclefitment | product_vehicle_fitments | transform | Shift year model to year_range string approach |
| vehicles_vehiclemake | vehicle_makes | map | Keep make type and uniqueness rules |
| vehicles_vehiclemodel | vehicle_models | map | Keep make-model relationship |
| vehicles_vehicleyear | none | retire | Replaced by fitment year_range in target |

---

## 3. Target Tables Not Yet in Current Backend

| Target Table | Strategy | Planned Phase | Why Needed |
|---|---|---|---|
| suppliers | add | Phase 2 | Supplier master data |
| supplier_products | add | Phase 2 | Supplier-part current pricing |
| supplier_cost_history | add | Phase 2 | Immutable cost trend history |
| purchase_orders | add | Phase 2 | Procurement workflow header |
| purchase_order_items | add | Phase 2 | Procurement workflow lines |
| discounts | add | Phase 2 | Pricing/discount rules |
| business_profile | add | Phase 2 | Receipt seller snapshot source |
| receipt_sequences | add | Phase 2 | OR/SI sequence control |
| receipts | add | Phase 2 | Immutable receipt headers |
| receipt_items | add | Phase 2 | Immutable receipt lines |
| receipt_payments | add | Phase 2 | Immutable receipt payment snapshots |
| roles | add | Phase 2 | RBAC role definitions |
| permissions | add | Phase 2 | RBAC action matrix |
| role_permissions | add | Phase 2 | RBAC role-permission mapping |
| audit_log | add | Phase 2 | Cross-domain audit trail |

---

## 4. Retirement Candidates (Not in Target Design)

| Table | Reason | Retirement Mode | Earliest Phase |
|---|---|---|---|
| inventory_warehouse | Single-store architecture | freeze -> archive -> drop | Phase 6 |
| pos_posterminal | Not part of target model | freeze -> archive -> drop | Phase 6 |
| vehicles_vehicleyear | Replaced by fitment year_range | backfill -> archive -> drop | Phase 6 |

Note: retirement follows required policy in the strategy document: reconciliation pass, backup+restore proof, dependency proof, two-release retirement, and signed-off audit notes.

---

## 5. Split and Transform Notes

## 5.1 vehicles_vehicleyear to product_vehicle_fitments.year_range

- Source model: discrete year entries
- Target model: free-text or ranged year values on fitment
- Action: build deterministic backfill rule for year conversion

## 5.2 inventory_* warehouse dependence removal

- Current tables include warehouse keys
- Target is single-store and removes warehouse join paths
- Action: collapse per-warehouse rows into one store-level row before cutover

## 5.3 authentication_user to users + RBAC

- Current uses Django auth-centric model
- Target requires explicit roles and action permissions
- Action: add roles/permissions/role_permissions tables, then map users to roles

---

## 6. Validation Checklist Before Phase 1 Start

1. Confirm no missing current table in mapping
2. Confirm every target table has a migration strategy
3. Confirm retirement candidates have archive and rollback procedures
4. Confirm impacted APIs and admin pages are listed in impact matrix
5. Confirm field-level mapping document is created next

---

## 7. Immediate Next Artifact

Create field-level mapping per transformed table:

- products
- product_variants
- inventory_stock
- stock_movements
- sales_transactions
- sales_transaction_items
- sales_return_items
- users
