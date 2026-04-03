# Motorparts POS Database Design Summary (PostgreSQL)

## 1. Big Picture

The database is built for a **single physical store** that sells:

- Physical motor parts and accessories
- Services are performed outside this system and are not recorded as POS line items

The design is split into domains so operations stay clean and scalable:

1. Reference Data
2. Product and Inventory
3. Supplier and Procurement
4. POS and Sales
5. Receipts
6. Customer Management
7. User Access (RBAC)
8. Audit and Reporting

---

## 2. Core Design Principles

1. **Single-store model**: no branch/warehouse complexity.
2. **Parts-only catalog in-system**: `products` stores physical parts/accessories only.
3. **Service scope**: service jobs happen outside this system and are excluded from POS/inventory data.
4. **Immutable ledgers**:
   - `stock_movements` for stock events
   - `supplier_cost_history` for supplier cost changes
5. **Soft deletes**: key records use `deleted_at` instead of hard delete.
6. **Action-level RBAC**: permissions are module-action based (`products:read`, `pos:void`, etc.).

---

## 3. Table Groups and Purpose

## 3.1 Reference Tables

- `brands`: manufacturer reference
- `categories`: hierarchical catalog categories
- `units_of_measure`: units like pcs, set, L
- `tax_rates`: VAT/zero-rated/exempt rules
- `vehicle_makes`, `vehicle_models`: compatibility reference for parts

These tables feed dropdowns, validations, and lookup logic.

## 3.2 Product and Inventory Tables

- `products`: master item table for physical parts/accessories
- `product_variants`: sellable variant layer (size/grade/pack)
- `product_barcodes`: barcode lookup per variant
- `product_vehicle_fitments`: which product fits which model
- `inventory_stock`: current stock snapshot per variant
- `stock_movements`: immutable quantity movement ledger
- `stock_adjustments`: manual adjustment batch headers

Key idea: **the variant is the stock unit**, not the product header.

## 3.3 Supplier and Procurement Tables

- `suppliers`: supplier master
- `supplier_products`: current supplier-item cost mapping
- `supplier_cost_history`: all historical cost changes (immutable)
- `purchase_orders`: PO headers
- `purchase_order_items`: PO line items and received qty

Key idea: procurement updates inventory and cost intelligence.

## 3.4 POS and Sales Tables

- `cash_sessions`: cashier shift open/close context
- `discounts`: configured discount rules
- `sales_transactions`: sale header
- `sales_transaction_items`: sale lines (parts only)
- `payment_methods`: cash/card/e-wallet/etc.
- `transaction_payments`: split payments per transaction
- `sales_returns`: return header
- `sales_return_items`: returned lines, with restock control

Key idea: line-level records hold pricing snapshots for historical accuracy.

## 3.5 Receipt Tables

- `business_profile`: seller profile snapshot source
- `receipt_sequences`: OR/SI number control
- `receipts`: receipt header, linked 1:1 to sale transaction
- `receipt_items`: immutable line snapshots for print/legal records
- `receipt_payments`: immutable payment snapshots for receipt

Key idea: receipts are historical/legal documents and should not mutate with later catalog edits.

## 3.6 Customer Tables

- `customers`: profile, wholesale flag, credit info
- `customer_addresses`: address records

Key idea: wholesale pricing behavior is customer-driven (`is_wholesale`).

## 3.7 Access Control Tables (RBAC)

- `roles`: superadmin/admin/staff
- `permissions`: module-action matrix
- `role_permissions`: role-permission junction
- `users`: each user belongs to one role

Key idea: endpoint or UI action checks permission before execution.

## 3.8 Audit Table

- `audit_log`: tracks row-level inserts/updates/deletes with actor/timestamp metadata

---

## 4. Relationship Map (How Tables Connect)

## 4.1 Catalog and Stock

1. `products` (1) -> (many) `product_variants`
2. `product_variants` (1) -> (many) `product_barcodes`
3. `products` (many) <-> (many) `vehicle_models` via `product_vehicle_fitments`
4. `product_variants` (1) -> (1) `inventory_stock` for parts
5. `product_variants` (1) -> (many) `stock_movements`

## 4.2 Supplier and PO

1. `suppliers` (1) -> (many) `supplier_products`
2. `supplier_products` (1) -> (many) `supplier_cost_history`
3. `purchase_orders` (1) -> (many) `purchase_order_items`
4. `purchase_order_items` updates `inventory_stock` and inserts into `stock_movements`
5. PO receipts can insert cost changes into `supplier_cost_history`

## 4.3 POS and Receipts

1. `cash_sessions` (1) -> (many) `sales_transactions`
2. `sales_transactions` (1) -> (many) `sales_transaction_items`
3. `sales_transactions` (1) -> (many) `transaction_payments`
4. `sales_transactions` (1) -> (1) `receipts`
5. `receipts` (1) -> (many) `receipt_items`
6. `receipts` (1) -> (many) `receipt_payments`

## 4.4 Returns

1. `sales_returns` references original `sales_transactions`
2. `sales_return_items` references original `sales_transaction_items`
3. Return inserts may restock parts and record `stock_movements`

## 4.5 Users and Authorization

1. `users` -> `roles`
2. `roles` <-> `permissions` via `role_permissions`
3. Business records often store actor columns (`created_by`, `cashier_id`, `performed_by`, etc.)

---

## 5. Critical Business Rules

1. Stock cannot go below zero on sale.
2. Only physical parts are allowed in sales and return line items.
3. Returns restock only when `restock = true`.
4. Every stock change must produce a `stock_movements` record.
5. Every supplier cost update must be captured in `supplier_cost_history`.
6. Sales completion requires an open cash session.
7. Receipt numbering must be controlled by `receipt_sequences`.
8. Receipt item/payment content is immutable snapshot data.

---

## 6. Typical Data Flows

## 6.1 Sale of Parts

1. Cashier creates `sales_transactions` header.
2. POS inserts part rows in `sales_transaction_items`.
3. Trigger deducts `inventory_stock.qty_on_hand`.
4. Trigger writes `stock_movements` with `movement_type = sale`.
5. Payment rows inserted into `transaction_payments`.
6. Sale marked completed and receipt generated (`receipts`, `receipt_items`, `receipt_payments`).

## 6.2 PO Receiving

1. Receiving updates `purchase_order_items.qty_received`.
2. Trigger computes received delta.
3. Updates `inventory_stock.qty_on_hand` and weighted `avg_cost`.
4. Writes `stock_movements` with `movement_type = purchase_receipt`.
5. If unit cost changed, writes `supplier_cost_history`.

## 6.3 Return

1. Return header in `sales_returns`.
2. Return lines in `sales_return_items`.
3. Trigger restocks only when part + `restock = true`.
4. Writes `stock_movements` with `movement_type = sale_return`.

---

## 7. Reporting Layer (Views)

The design includes views for operations and analytics:

- `v_current_stock`: real-time stock status
- `v_low_stock_alerts`: reorder candidates
- `v_daily_sales_summary`: daily totals and gross profit trends
- `v_sales_performance`: product revenue performance
- `v_supplier_cost_trends`: supplier price movement history and trend analysis

These views avoid re-implementing complex joins in application code.

---

## 8. Why This Design Works

1. **Operationally safe**: critical logic is transaction/trigger guarded.
2. **Auditable**: stock and cost histories are append-only style ledgers.
3. **Retail-ready**: supports split payments, returns, and receipt sequencing.
4. **Focused catalog**: variants, barcodes, and fitment are optimized for parts sales.
5. **Scalable permissions**: RBAC can expand by adding new module-action pairs.

---

## 9. PostgreSQL-Specific Notes

1. Use `BOOLEAN` instead of MySQL `TINYINT(1)` flags where needed.
2. Use `GENERATED ... AS IDENTITY` instead of `AUTO_INCREMENT`.
3. Use enum types or strict check constraints for statuses.
4. Use `JSONB` for variant attributes.
5. Maintain `updated_at` using a `BEFORE UPDATE` trigger function.
6. Replace MySQL session variable usage with PostgreSQL `set_config/current_setting` pattern for actor propagation.

---

## 10. Quick Mental Model

Think of the schema as five connected cores:

1. **Catalog Core**: `products` + `product_variants`
2. **Inventory Core**: `inventory_stock` + `stock_movements`
3. **Sales Core**: `sales_transactions` + `sales_transaction_items` + payments
4. **Procurement Core**: supplier tables + purchase order tables + cost history
5. **Control Core**: RBAC + audit + receipt sequencing

If these five cores are healthy, the whole POS/inventory system remains consistent.

---

## 11. Out of Scope (External to This DB)

1. Service jobs (oil change, tune-up, installation labor)
2. Service scheduling or technician assignment
3. Service billing workflows

If needed later, service records can be integrated through a separate module without changing the parts inventory core.
