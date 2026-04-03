# Strategic Database Design
# Single-Store Motorparts & Accessories — POS with Integrated Inventory Management

> **Version 2.0** — Tailored for single-store operations.
>
> **Key decisions applied:**
> - Single physical shop (no warehouse/location tables)
> - Services (oil change, tune-up, etc.) are sellable POS items — no stock deduction
> - Full RBAC: `roles` + `permissions` + `role_permissions` tables, pre-seeded with 3 roles
> - Action-level permissions per module (`products:read`, `products:write`, etc.)
> - Vehicle make/model compatibility retained
> - Wholesale pricing via `is_wholesale` flag on customers + optional per-product wholesale price
> - BIR-ready OR/SI receipt system with series control
> - Supplier cost history: every `unit_cost` change is logged automatically via trigger

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Design Philosophy & Principles](#2-design-philosophy--principles)
3. [Entity-Relationship Overview](#3-entity-relationship-overview)
4. [Database Schema](#4-database-schema)
   - 4.1 [Core Reference Tables](#41-core-reference-tables)
   - 4.2 [Product & Inventory Tables](#42-product--inventory-tables)
   - 4.3 [Supplier & Procurement Tables](#43-supplier--procurement-tables)
   - 4.4 [POS & Sales Tables](#44-pos--sales-tables)
   - 4.5 [Receipt Tables](#45-receipt-tables)
   - 4.6 [Customer Management Tables](#46-customer-management-tables)
   - 4.7 [User & Access Control Tables](#47-user--access-control-tables)
   - 4.8 [Audit & Logging Tables](#48-audit--logging-tables)
5. [POS-Inventory Integration Logic](#5-pos-inventory-integration-logic)
6. [Normalization Analysis](#6-normalization-analysis)
7. [Indexes & Query Optimization](#7-indexes--query-optimization)
8. [Stored Procedures & Triggers](#8-stored-procedures--triggers)
9. [Views for Reporting](#9-views-for-reporting)
10. [Business Rules & Constraints](#10-business-rules--constraints)
11. [Performance Considerations](#11-performance-considerations)
12. [Sample Data Flow Walkthrough](#12-sample-data-flow-walkthrough)
13. [RBAC Seed Data](#13-rbac-seed-data)

---

## 1. System Overview

This database design supports a **Single-Store Motorparts & Accessories Shop** running a unified **Point-of-Sale system with integrated Inventory Management**. The shop sells physical parts/accessories at the counter and also offers labor services (oil change, tune-up, alignment, etc.). Both parts and services are transacted through the same POS counter.

### Key Capabilities

- Real-time inventory deduction on every part sale (trigger-driven, atomic)
- Service items sold at POS with **no stock deduction** (flagged `is_service = 1`)
- Full supplier cost tracking — every price change per supplier per item is logged automatically
- Purchase order management with per-line cost capture feeding cost history
- Wholesale pricing via customer flag (`is_wholesale`) + optional per-product wholesale price
- Full RBAC: roles + 29 action-level permissions pre-seeded for 3 roles
- Complete stock movement ledger (every +/− event is immutable and traceable)
- Low-stock alerts and reorder point tracking
- Vehicle make/model compatibility lookup for parts
- Barcode and SKU-based product lookup at POS
- Returns and refund handling (parts restocked; services are not)
- BIR-ready OR/SI receipt system with series control

### What This System Is Not

- Not multi-store or multi-branch (single physical shop)
- Not an e-commerce or online ordering system
- Not a job order / repair ticketing system (services are line items on a POS transaction, not tracked repair jobs with labor timesheets)

---

## 2. Design Philosophy & Principles

### Normalization Strategy

The schema follows **Third Normal Form (3NF)** throughout, with controlled denormalization only in reporting views and immutable snapshot tables (receipts).

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case`, plural | `product_variants` |
| Primary Keys | `id` (BIGINT AUTO_INCREMENT) | `id BIGINT AUTO_INCREMENT` |
| Foreign Keys | `<table_singular>_id` | `product_id`, `customer_id` |
| Timestamps | `created_at`, `updated_at` | Standard on all core tables |
| Boolean flags | `is_<state>` | `is_active`, `is_service`, `is_wholesale` |
| Soft delete | `deleted_at TIMESTAMP NULL` | NULL = active record |

### Soft Deletes

All core tables use soft deletion (`deleted_at`). Records are never physically deleted — this preserves sales history, supplier cost history, and audit integrity.

### Services vs. Parts

Products are unified in a single `products` table. The `is_service TINYINT(1)` flag distinguishes:

- **Parts/Accessories** (`is_service = 0`): tracked in `inventory_stock`; stock deducted on every sale via trigger
- **Services** (`is_service = 1`): no `inventory_stock` row; trigger skips deduction; never restocked on return

### Wholesale Pricing

Wholesale pricing is resolved at the POS application layer:

```
IF customer.is_wholesale = 1
   AND COALESCE(variant.wholesale_price, product.wholesale_price) IS NOT NULL
THEN use wholesale_price
ELSE use selling_price
```

---

## 3. Entity-Relationship Overview

```
REFERENCE DOMAIN
├── brands
├── categories         (self-referencing hierarchy; covers both parts and service categories)
├── units_of_measure   (pcs, set, L, hr — 'hr' for services)
├── tax_rates
├── vehicle_makes
└── vehicle_models     ──── vehicle_makes

PRODUCT DOMAIN
├── products           (parts AND services unified; is_service flag)
│   ├── product_variants
│   │   ├── margin_pct  (GENERATED ALWAYS AS STORED)
│   │   └── markup_pct  (GENERATED ALWAYS AS STORED)
│   ├── product_barcodes       (parts only)
│   └── product_vehicle_fitments ──── vehicle_models  (parts only)

INVENTORY DOMAIN       (parts only — services excluded)
├── inventory_stock    (single-store, one row per part variant)
├── stock_movements    (immutable event ledger)
└── stock_adjustments  (manual adjustment batch headers)

SUPPLIER & PROCUREMENT DOMAIN
├── suppliers
├── supplier_products          (current cost per supplier per part)
├── supplier_cost_history  ★   (full cost change log — every price change logged)
├── purchase_orders
└── purchase_order_items

POS / SALES DOMAIN
├── cash_sessions
├── discounts
├── sales_transactions
├── sales_transaction_items    ◄── TRIGGER (parts: deduct stock; services: skip)
├── payment_methods
├── transaction_payments       (split payment support)
├── sales_returns
└── sales_return_items

RECEIPT DOMAIN (BIR-ready)
├── business_profile           (single-row shop details)
├── receipt_sequences          (OR/SI series control)
├── receipts
├── receipt_items              (immutable snapshot)
└── receipt_payments           (immutable snapshot)

CUSTOMER DOMAIN
├── customers                  (is_wholesale flag drives price resolution)
└── customer_addresses

USER & ACCESS CONTROL
├── roles                      (superadmin, admin, staff)
├── permissions                (29 module:action pairs)
├── role_permissions           (junction)
└── users                      (FK → roles)

AUDIT
└── audit_log
```

---

## 4. Database Schema

> **Engine**: MySQL 8.0+ / MariaDB 10.6+ (InnoDB)
> **Charset**: `utf8mb4` | **Collation**: `utf8mb4_unicode_ci`

---

### 4.1 Core Reference Tables

```sql
-- ============================================================
-- TABLE: brands
-- ============================================================
CREATE TABLE brands (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(120)    NOT NULL,
    slug            VARCHAR(120)    NOT NULL,
    logo_url        VARCHAR(512)    NULL,
    country_origin  CHAR(2)         NULL COMMENT 'ISO 3166-1 alpha-2',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_brands_slug (slug),
    UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: categories
-- Self-referencing tree. Covers product AND service categories.
-- e.g., Engine Parts > Filters > Oil Filters
--       Services > Preventive Maintenance > Oil Change
-- ============================================================
CREATE TABLE categories (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    parent_id       BIGINT          NULL     COMMENT 'NULL = root category',
    name            VARCHAR(120)    NOT NULL,
    slug            VARCHAR(120)    NOT NULL,
    description     TEXT            NULL,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_slug (slug),
    KEY idx_categories_parent (parent_id),
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: units_of_measure
-- 'hr' (hour) is used for services.
-- ============================================================
CREATE TABLE units_of_measure (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    code            VARCHAR(20)     NOT NULL COMMENT 'pcs, set, L, pr, box, hr',
    name            VARCHAR(60)     NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_uom_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: tax_rates
-- ============================================================
CREATE TABLE tax_rates (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    name            VARCHAR(80)     NOT NULL COMMENT 'e.g., VAT 12%, Zero-rated, VAT-exempt',
    rate            DECIMAL(6,4)    NOT NULL COMMENT '0.12 = 12%',
    is_inclusive    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = tax already included in price',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tax_rates_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: vehicle_makes
-- ============================================================
CREATE TABLE vehicle_makes (
    id              INT             NOT NULL AUTO_INCREMENT,
    name            VARCHAR(80)     NOT NULL,
    vehicle_type    ENUM('car','motorcycle','truck','ATV','other') NOT NULL DEFAULT 'car',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehicle_makes (name, vehicle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: vehicle_models
-- Year range stored as VARCHAR on the fitment row
-- (e.g., "2018-2023") — avoids a vehicle_years table.
-- ============================================================
CREATE TABLE vehicle_models (
    id              INT             NOT NULL AUTO_INCREMENT,
    vehicle_make_id INT             NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehicle_model (vehicle_make_id, name),
    KEY idx_vehicle_models_make (vehicle_make_id),
    CONSTRAINT fk_vehicle_models_make
        FOREIGN KEY (vehicle_make_id) REFERENCES vehicle_makes (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.2 Product & Inventory Tables

```sql
-- ============================================================
-- TABLE: products
-- Unified table for physical parts/accessories AND services.
--
-- is_service = 0 → physical part; tracked in inventory_stock;
--                  stock deducted by trigger on every sale.
-- is_service = 1 → labor/service item; no inventory_stock row;
--                  trigger skips deduction; never restocked.
-- ============================================================
CREATE TABLE products (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    category_id         BIGINT          NOT NULL,
    brand_id            BIGINT          NULL     COMMENT 'NULL for services',
    uom_id              SMALLINT        NOT NULL COMMENT 'pcs/set for parts; hr for services',
    tax_rate_id         SMALLINT        NOT NULL,
    sku                 VARCHAR(80)     NOT NULL,
    name                VARCHAR(220)    NOT NULL,
    description         TEXT            NULL,
    short_desc          VARCHAR(400)    NULL,
    part_number         VARCHAR(100)    NULL     COMMENT 'OEM/aftermarket part no. NULL for services.',
    is_service          TINYINT(1)      NOT NULL DEFAULT 0
                        COMMENT '0 = physical part (stock tracked), 1 = service (no stock)',
    cost_price          DECIMAL(12,4)   NOT NULL DEFAULT 0.0000
                        COMMENT 'Parts: purchase cost. Services: labor cost/overhead.',
    selling_price       DECIMAL(12,4)   NOT NULL DEFAULT 0.0000
                        COMMENT 'Standard retail / walk-in price',
    wholesale_price     DECIMAL(12,4)   NULL
                        COMMENT 'Price for wholesale customers. NULL = use selling_price.',
    min_selling_price   DECIMAL(12,4)   NULL     COMMENT 'Floor price; application enforces this',
    is_taxable          TINYINT(1)      NOT NULL DEFAULT 1,
    is_serialized       TINYINT(1)      NOT NULL DEFAULT 0
                        COMMENT '1 = track individual serial numbers (parts only)',
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    weight_kg           DECIMAL(8,3)    NULL     COMMENT 'Parts only',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_sku        (sku),
    KEY idx_products_category         (category_id),
    KEY idx_products_brand            (brand_id),
    KEY idx_products_part_number      (part_number),
    KEY idx_products_is_service       (is_service, is_active),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_products_uom
        FOREIGN KEY (uom_id) REFERENCES units_of_measure (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_tax
        FOREIGN KEY (tax_rate_id) REFERENCES tax_rates (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: product_variants
-- Saleable version of a product (e.g., 1L vs 4L engine oil,
-- Grade A vs Grade B spark plug). Most items have one variant.
-- Services typically have one variant with no attributes.
--
-- margin_pct = (sell - cost) / sell * 100  [GENERATED STORED]
-- markup_pct = (sell - cost) / cost * 100  [GENERATED STORED]
-- Both auto-update when cost_price or selling_price changes.
-- ============================================================
CREATE TABLE product_variants (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    product_id      BIGINT          NOT NULL,
    variant_sku     VARCHAR(100)    NOT NULL,
    variant_name    VARCHAR(200)    NULL     COMMENT 'e.g., "1 Liter", "Grade A"',
    attributes      JSON            NULL     COMMENT '{"size":"1L","grade":"A"}',
    cost_price      DECIMAL(12,4)   NULL     COMMENT 'NULL = inherit from products.cost_price',
    selling_price   DECIMAL(12,4)   NULL     COMMENT 'NULL = inherit from products.selling_price',
    wholesale_price DECIMAL(12,4)   NULL     COMMENT 'NULL = inherit from products.wholesale_price',
    margin_pct      DECIMAL(8,4)    GENERATED ALWAYS AS (
                        CASE WHEN COALESCE(selling_price, 0) > 0
                             THEN ROUND(
                                ((COALESCE(selling_price,0) - COALESCE(cost_price,0))
                                 / COALESCE(selling_price,0)) * 100
                             , 4)
                             ELSE NULL END
                    ) STORED COMMENT 'Auto-computed gross margin %',
    markup_pct      DECIMAL(8,4)    GENERATED ALWAYS AS (
                        CASE WHEN COALESCE(cost_price, 0) > 0
                             THEN ROUND(
                                ((COALESCE(selling_price,0) - COALESCE(cost_price,0))
                                 / COALESCE(cost_price,0)) * 100
                             , 4)
                             ELSE NULL END
                    ) STORED COMMENT 'Auto-computed markup %',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_variants_sku  (variant_sku),
    KEY idx_product_variants_product    (product_id),
    KEY idx_pv_margin_pct               (margin_pct),
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: product_barcodes
-- Parts only. Multiple barcodes per variant supported.
-- ============================================================
CREATE TABLE product_barcodes (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT      NOT NULL,
    barcode             VARCHAR(100) NOT NULL,
    barcode_type        ENUM('EAN13','EAN8','UPC','QR','CODE128','custom') NOT NULL DEFAULT 'EAN13',
    is_primary          TINYINT(1)  NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_barcodes_barcode (barcode),
    KEY idx_product_barcodes_variant       (product_variant_id),
    CONSTRAINT fk_product_barcodes_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: product_vehicle_fitments
-- Which part fits which vehicle model.
-- year_range is free text: "2018-2023", "2019 onwards", etc.
-- Services have no fitment entries.
-- ============================================================
CREATE TABLE product_vehicle_fitments (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    product_id          BIGINT      NOT NULL,
    vehicle_model_id    INT         NOT NULL,
    year_range          VARCHAR(30) NULL COMMENT 'e.g., "2018-2023", "2019 onwards"',
    fitment_notes       VARCHAR(400) NULL COMMENT 'e.g., "MT variant only"',
    PRIMARY KEY (id),
    UNIQUE KEY uq_fitment (product_id, vehicle_model_id),
    KEY idx_fitment_product (product_id),
    KEY idx_fitment_model   (vehicle_model_id),
    CONSTRAINT fk_fitment_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fitment_model
        FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: inventory_stock
-- Single-store stock ledger. One row per physical part variant.
-- Services (is_service=1) have NO row here.
-- ============================================================
CREATE TABLE inventory_stock (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT          NOT NULL,
    qty_on_hand         DECIMAL(12,4)   NOT NULL DEFAULT 0     COMMENT 'Physical stock count',
    qty_reserved        DECIMAL(12,4)   NOT NULL DEFAULT 0     COMMENT 'Reserved by pending orders',
    qty_available       DECIMAL(12,4)   GENERATED ALWAYS AS (qty_on_hand - qty_reserved) VIRTUAL
                        COMMENT 'Available to sell = qty_on_hand - qty_reserved',
    reorder_point       DECIMAL(12,4)   NOT NULL DEFAULT 0     COMMENT 'Low-stock alert threshold',
    reorder_qty         DECIMAL(12,4)   NOT NULL DEFAULT 0     COMMENT 'Suggested PO quantity',
    max_stock_level     DECIMAL(12,4)   NULL,
    avg_cost            DECIMAL(14,6)   NOT NULL DEFAULT 0     COMMENT 'Weighted avg cost; auto-updated on PO receipt',
    last_counted_at     TIMESTAMP       NULL                   COMMENT 'Last physical inventory count',
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_stock_variant (product_variant_id),
    KEY idx_inventory_low_stock           (qty_on_hand, reorder_point),
    CONSTRAINT fk_inventory_stock_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inventory_qty      CHECK (qty_on_hand >= 0),
    CONSTRAINT chk_inventory_reserved CHECK (qty_reserved >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: stock_movements
-- Immutable ledger. Every qty change writes one row.
-- POS sales, returns, PO receipts, adjustments — all logged here.
-- Services never appear in this table.
-- ============================================================
CREATE TABLE stock_movements (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT      NOT NULL,
    movement_type       ENUM(
        'sale',              -- deducted by POS sale trigger
        'sale_return',       -- restored by return trigger
        'purchase_receipt',  -- added on PO item receipt
        'purchase_return',   -- deducted when returned to supplier
        'adjustment_add',    -- manual positive adjustment
        'adjustment_sub',    -- manual negative adjustment
        'opening_stock',     -- initial stock entry
        'damage_write_off',  -- write off damaged goods
        'count_correction'   -- correction after physical count
    ) NOT NULL,
    reference_type      ENUM(
        'sales_transaction',
        'sales_return',
        'purchase_order',
        'stock_adjustment',
        'manual'
    ) NOT NULL,
    reference_id        BIGINT          NOT NULL,
    qty_before          DECIMAL(12,4)   NOT NULL,
    qty_change          DECIMAL(12,4)   NOT NULL COMMENT 'Positive = stock in. Negative = stock out.',
    qty_after           DECIMAL(12,4)   NOT NULL,
    unit_cost           DECIMAL(14,6)   NULL     COMMENT 'Cost per unit at time of movement',
    notes               TEXT            NULL,
    performed_by        BIGINT          NOT NULL COMMENT 'FK → users.id',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_stock_movements_variant (product_variant_id),
    KEY idx_stock_movements_type    (movement_type),
    KEY idx_stock_movements_ref     (reference_type, reference_id),
    KEY idx_stock_movements_date    (created_at),
    CONSTRAINT fk_stock_movements_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: stock_adjustments
-- Header record for a batch manual adjustment event.
-- ============================================================
CREATE TABLE stock_adjustments (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    reason          ENUM('count_correction','damage','expiry','theft','system_error','other') NOT NULL,
    notes           TEXT            NULL,
    status          ENUM('draft','approved','posted') NOT NULL DEFAULT 'draft',
    approved_by     BIGINT          NULL COMMENT 'FK → users.id',
    approved_at     TIMESTAMP       NULL,
    created_by      BIGINT          NOT NULL COMMENT 'FK → users.id',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.3 Supplier & Procurement Tables

```sql
-- ============================================================
-- TABLE: suppliers
-- ============================================================
CREATE TABLE suppliers (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    code            VARCHAR(30)     NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    contact_person  VARCHAR(150)    NULL,
    email           VARCHAR(200)    NULL,
    phone           VARCHAR(30)     NULL,
    address         TEXT            NULL,
    city            VARCHAR(100)    NULL,
    tax_id          VARCHAR(50)     NULL COMMENT 'Supplier TIN / BIR number',
    payment_terms   SMALLINT        NOT NULL DEFAULT 0 COMMENT 'Net days; 0 = COD',
    credit_limit    DECIMAL(14,2)   NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_suppliers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: supplier_products
-- Current/latest price this supplier charges per part variant.
-- When unit_cost is updated, TRIGGER trg_sp_cost_history fires
-- and writes a row to supplier_cost_history automatically.
-- ============================================================
CREATE TABLE supplier_products (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    supplier_id         BIGINT          NOT NULL,
    product_variant_id  BIGINT          NOT NULL,
    supplier_sku        VARCHAR(80)     NULL    COMMENT 'Supplier\'s own part number/SKU',
    unit_cost           DECIMAL(12,4)   NOT NULL COMMENT 'Current purchase price from this supplier',
    min_order_qty       DECIMAL(10,4)   NOT NULL DEFAULT 1,
    lead_time_days      SMALLINT        NULL,
    is_preferred        TINYINT(1)      NOT NULL DEFAULT 0
                        COMMENT '1 = preferred/primary supplier for this part',
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    effective_date      DATE            NOT NULL COMMENT 'Date this cost became active',
    notes               VARCHAR(300)    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_supplier_product      (supplier_id, product_variant_id),
    KEY idx_supplier_products_variant   (product_variant_id),
    KEY idx_supplier_products_supplier  (supplier_id),
    CONSTRAINT fk_sp_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sp_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: supplier_cost_history  ★ CORE CLIENT REQUIREMENT ★
--
-- Immutable log of every supplier price change per part variant.
-- Two automatic sources:
--   1. trg_sp_cost_history  → fires on manual unit_cost update
--      in supplier_products (admin edits price list)
--   2. trg_poi_after_update → fires when PO item is received
--      and the received unit_cost differs from what was recorded
--
-- cost_change_pct is GENERATED ALWAYS AS STORED:
--   positive = cost increased, negative = cost decreased.
-- ============================================================
CREATE TABLE supplier_cost_history (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    supplier_id         BIGINT          NOT NULL,
    product_variant_id  BIGINT          NOT NULL,
    supplier_product_id BIGINT          NULL
                        COMMENT 'FK → supplier_products.id; NULL if record later deleted',
    old_unit_cost       DECIMAL(12,4)   NOT NULL,
    new_unit_cost       DECIMAL(12,4)   NOT NULL,
    cost_change_pct     DECIMAL(8,4)    GENERATED ALWAYS AS (
                            ROUND(
                                ((new_unit_cost - old_unit_cost)
                                 / NULLIF(old_unit_cost, 0)) * 100
                            , 4)
                        ) STORED
                        COMMENT 'Auto-computed. Positive = more expensive.',
    change_source       ENUM('manual_update','po_receipt','initial_entry')
                        NOT NULL DEFAULT 'manual_update'
                        COMMENT 'What triggered this record',
    purchase_order_id   BIGINT          NULL
                        COMMENT 'FK → purchase_orders.id; set when source = po_receipt',
    change_reason       VARCHAR(300)    NULL
                        COMMENT 'Optional note (e.g., "Supplier price list update Mar 2025")',
    changed_by          BIGINT          NOT NULL COMMENT 'FK → users.id',
    effective_date      DATE            NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sch_supplier               (supplier_id),
    KEY idx_sch_variant                (product_variant_id),
    KEY idx_sch_supplier_variant_date  (supplier_id, product_variant_id, effective_date DESC),
    KEY idx_sch_po                     (purchase_order_id),
    CONSTRAINT fk_sch_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sch_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Immutable log of every supplier cost change. Core pricing-intelligence table.';


-- ============================================================
-- TABLE: purchase_orders
-- ============================================================
CREATE TABLE purchase_orders (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    po_number       VARCHAR(30)     NOT NULL,
    supplier_id     BIGINT          NOT NULL,
    status          ENUM('draft','sent','partially_received','received','cancelled')
                    NOT NULL DEFAULT 'draft',
    order_date      DATE            NOT NULL,
    expected_date   DATE            NULL,
    received_date   DATE            NULL,
    subtotal        DECIMAL(14,4)   NOT NULL DEFAULT 0,
    tax_amount      DECIMAL(14,4)   NOT NULL DEFAULT 0,
    shipping_cost   DECIMAL(14,4)   NOT NULL DEFAULT 0,
    total_amount    DECIMAL(14,4)   NOT NULL DEFAULT 0,
    notes           TEXT            NULL,
    created_by      BIGINT          NOT NULL COMMENT 'FK → users.id',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_purchase_orders_number (po_number),
    KEY idx_purchase_orders_supplier     (supplier_id),
    KEY idx_purchase_orders_status       (status),
    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: purchase_order_items
-- unit_cost captures the actual price paid per unit.
-- Receiving triggers stock update + cost history logging.
-- ============================================================
CREATE TABLE purchase_order_items (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    purchase_order_id   BIGINT          NOT NULL,
    product_variant_id  BIGINT          NOT NULL,
    qty_ordered         DECIMAL(12,4)   NOT NULL,
    qty_received        DECIMAL(12,4)   NOT NULL DEFAULT 0,
    unit_cost           DECIMAL(12,4)   NOT NULL COMMENT 'Actual price paid per unit on this PO',
    line_total          DECIMAL(14,4)   NOT NULL,
    notes               VARCHAR(300)    NULL,
    PRIMARY KEY (id),
    KEY idx_poi_po      (purchase_order_id),
    KEY idx_poi_variant (product_variant_id),
    CONSTRAINT fk_poi_purchase_order
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_poi_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_poi_qty
        CHECK (qty_ordered > 0 AND qty_received >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.4 POS & Sales Tables

```sql
-- ============================================================
-- TABLE: cash_sessions
-- One session per shift. All transactions must belong to an open session.
-- ============================================================
CREATE TABLE cash_sessions (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    cashier_id      BIGINT          NOT NULL COMMENT 'FK → users.id',
    session_code    VARCHAR(30)     NOT NULL,
    status          ENUM('open','closed','reconciled') NOT NULL DEFAULT 'open',
    opening_cash    DECIMAL(12,2)   NOT NULL DEFAULT 0,
    closing_cash    DECIMAL(12,2)   NULL,
    expected_cash   DECIMAL(12,2)   NULL COMMENT 'System-computed expected closing cash',
    cash_variance   DECIMAL(12,2)   NULL COMMENT 'closing_cash - expected_cash',
    opened_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at       TIMESTAMP       NULL,
    notes           TEXT            NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cash_sessions_code (session_code),
    KEY idx_cash_sessions_cashier    (cashier_id),
    KEY idx_cash_sessions_status     (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: discounts
-- Pre-configured discounts (Senior, PWD, promos, bulk)
-- ============================================================
CREATE TABLE discounts (
    id              INT             NOT NULL AUTO_INCREMENT,
    code            VARCHAR(30)     NOT NULL,
    name            VARCHAR(120)    NOT NULL,
    type            ENUM('percentage','fixed_amount') NOT NULL,
    value           DECIMAL(10,4)   NOT NULL COMMENT 'Pct (0-100) or fixed peso amount',
    applies_to      ENUM('transaction','item','category','product')
                    NOT NULL DEFAULT 'transaction',
    target_id       BIGINT          NULL COMMENT 'category_id or product_id when applies_to requires',
    min_purchase    DECIMAL(14,2)   NULL,
    start_date      DATE            NULL,
    end_date        DATE            NULL,
    usage_limit     INT             NULL,
    usage_count     INT             NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_discounts_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: sales_transactions
-- Header for every POS transaction (parts + services).
-- ============================================================
CREATE TABLE sales_transactions (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    transaction_number  VARCHAR(30) NOT NULL COMMENT 'e.g., TXN-20250320-0001',
    cash_session_id     BIGINT      NOT NULL,
    customer_id         BIGINT      NULL     COMMENT 'NULL = anonymous walk-in',
    cashier_id          BIGINT      NOT NULL COMMENT 'FK → users.id',
    status              ENUM('pending','completed','voided','refunded','partially_refunded')
                        NOT NULL DEFAULT 'pending',
    transaction_date    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal            DECIMAL(14,4) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(14,4) NOT NULL DEFAULT 0,
    taxable_amount      DECIMAL(14,4) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(14,4) NOT NULL DEFAULT 0,
    total_amount        DECIMAL(14,4) NOT NULL DEFAULT 0,
    amount_tendered     DECIMAL(14,4) NOT NULL DEFAULT 0,
    change_given        DECIMAL(14,4) NOT NULL DEFAULT 0,
    discount_id         INT         NULL,
    notes               TEXT        NULL,
    voided_at           TIMESTAMP   NULL,
    voided_by           BIGINT      NULL COMMENT 'FK → users.id',
    void_reason         VARCHAR(300) NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_txn_number  (transaction_number),
    KEY idx_sales_txn_session       (cash_session_id),
    KEY idx_sales_txn_customer      (customer_id),
    KEY idx_sales_txn_date          (transaction_date),
    KEY idx_sales_txn_status        (status),
    CONSTRAINT fk_sales_txn_session
        FOREIGN KEY (cash_session_id) REFERENCES cash_sessions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sales_txn_discount
        FOREIGN KEY (discount_id) REFERENCES discounts (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_sales_txn_total CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: sales_transaction_items
-- One row per part or service sold per transaction.
-- is_service is copied here so the trigger does not need a
-- separate JOIN to products to decide whether to deduct stock.
-- ============================================================
CREATE TABLE sales_transaction_items (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    sales_transaction_id    BIGINT      NOT NULL,
    product_variant_id      BIGINT      NOT NULL,
    is_service              TINYINT(1)  NOT NULL DEFAULT 0
                            COMMENT 'Snapshot from products.is_service at time of sale',
    qty                     DECIMAL(12,4) NOT NULL,
    unit_price              DECIMAL(12,4) NOT NULL COMMENT 'Price at time of sale',
    unit_cost               DECIMAL(12,4) NOT NULL COMMENT 'Cost at time of sale',
    discount_amount         DECIMAL(12,4) NOT NULL DEFAULT 0,
    tax_amount              DECIMAL(12,4) NOT NULL DEFAULT 0,
    line_total              DECIMAL(14,4) NOT NULL,
    serial_number           VARCHAR(100) NULL COMMENT 'For serialized parts only',
    notes                   VARCHAR(300) NULL,
    PRIMARY KEY (id),
    KEY idx_sti_transaction (sales_transaction_id),
    KEY idx_sti_variant     (product_variant_id),
    CONSTRAINT fk_sti_transaction
        FOREIGN KEY (sales_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sti_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sti_qty   CHECK (qty > 0),
    CONSTRAINT chk_sti_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: payment_methods
-- ============================================================
CREATE TABLE payment_methods (
    id        SMALLINT    NOT NULL AUTO_INCREMENT,
    code      VARCHAR(20) NOT NULL,
    name      VARCHAR(80) NOT NULL,
    type      ENUM('cash','card','ewallet','bank_transfer','credit','check','other') NOT NULL,
    is_active TINYINT(1)  NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_methods_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: transaction_payments
-- Supports split payment (e.g., part GCash + part cash).
-- ============================================================
CREATE TABLE transaction_payments (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    sales_transaction_id    BIGINT      NOT NULL,
    payment_method_id       SMALLINT    NOT NULL,
    amount                  DECIMAL(14,4) NOT NULL,
    reference_number        VARCHAR(100) NULL COMMENT 'GCash ref, card approval code, etc.',
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_txn_payments_txn (sales_transaction_id),
    CONSTRAINT fk_txn_payments_txn
        FOREIGN KEY (sales_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_txn_payments_method
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_txn_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: sales_returns
-- ============================================================
CREATE TABLE sales_returns (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    return_number           VARCHAR(30) NOT NULL,
    original_transaction_id BIGINT      NOT NULL,
    cashier_id              BIGINT      NOT NULL COMMENT 'FK → users.id',
    reason                  ENUM('defective','wrong_item','customer_changed_mind','other') NOT NULL,
    notes                   TEXT        NULL,
    refund_method_id        SMALLINT    NULL,
    refund_amount           DECIMAL(14,4) NOT NULL DEFAULT 0,
    status                  ENUM('pending','approved','completed','rejected')
                            NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_returns_number (return_number),
    KEY idx_sales_returns_txn          (original_transaction_id),
    CONSTRAINT fk_sales_returns_txn
        FOREIGN KEY (original_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: sales_return_items
-- restock = 0 forced for services (is_service = 1).
-- ============================================================
CREATE TABLE sales_return_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    sales_return_id     BIGINT      NOT NULL,
    sales_txn_item_id   BIGINT      NOT NULL,
    product_variant_id  BIGINT      NOT NULL,
    is_service          TINYINT(1)  NOT NULL DEFAULT 0
                        COMMENT 'Copied from original line item',
    qty_returned        DECIMAL(12,4) NOT NULL,
    unit_price          DECIMAL(12,4) NOT NULL,
    restock             TINYINT(1)  NOT NULL DEFAULT 1
                        COMMENT '1 = add back to inventory. Always 0 for services.',
    PRIMARY KEY (id),
    KEY idx_sri_return  (sales_return_id),
    KEY idx_sri_variant (product_variant_id),
    CONSTRAINT fk_sri_return
        FOREIGN KEY (sales_return_id) REFERENCES sales_returns (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sri_txn_item
        FOREIGN KEY (sales_txn_item_id) REFERENCES sales_transaction_items (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sri_qty CHECK (qty_returned > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.5 Receipt Tables

```sql
-- ============================================================
-- TABLE: business_profile
-- Single row (id=1). Shop details frozen on every receipt.
-- ============================================================
CREATE TABLE business_profile (
    id                      INT         NOT NULL AUTO_INCREMENT,
    business_name           VARCHAR(200) NOT NULL,
    tagline                 VARCHAR(300) NULL,
    address_line1           VARCHAR(200) NOT NULL,
    address_line2           VARCHAR(200) NULL,
    city                    VARCHAR(100) NOT NULL,
    province                VARCHAR(100) NULL,
    zip_code                VARCHAR(20)  NULL,
    phone                   VARCHAR(30)  NULL,
    mobile                  VARCHAR(30)  NULL,
    email                   VARCHAR(200) NULL,
    tin                     VARCHAR(50)  NULL COMMENT 'BIR Tax Identification Number',
    bir_accreditation_no    VARCHAR(100) NULL,
    logo_url                VARCHAR(512) NULL,
    receipt_footer          TEXT        NULL,
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: receipt_sequences
-- BIR OR/SI auto-incrementing series control.
-- current_number increments atomically in sp_generate_receipt.
-- ============================================================
CREATE TABLE receipt_sequences (
    id              INT             NOT NULL AUTO_INCREMENT,
    series_code     VARCHAR(20)     NOT NULL COMMENT 'e.g., OR, SI',
    series_label    VARCHAR(60)     NOT NULL COMMENT 'e.g., Official Receipt',
    prefix          VARCHAR(20)     NULL     COMMENT 'e.g., OR-2025-',
    current_number  BIGINT          NOT NULL DEFAULT 0,
    zero_pad        TINYINT         NOT NULL DEFAULT 6 COMMENT 'Pad digits: 000001',
    start_number    BIGINT          NOT NULL DEFAULT 1,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receipt_sequences_code (series_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: receipts
-- Auto-generated on sale completion. One per transaction.
-- ============================================================
CREATE TABLE receipts (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    receipt_number          VARCHAR(50) NOT NULL COMMENT 'e.g., OR-2025-000001',
    receipt_type            ENUM('official_receipt','sales_invoice','delivery_receipt')
                            NOT NULL DEFAULT 'official_receipt',
    receipt_sequence_id     INT         NOT NULL,
    sales_transaction_id    BIGINT      NOT NULL,
    customer_id             BIGINT      NULL,
    -- Buyer snapshot
    buyer_name              VARCHAR(200) NOT NULL DEFAULT 'Walk-in Customer',
    buyer_address           TEXT        NULL,
    buyer_tin               VARCHAR(50) NULL,
    buyer_phone             VARCHAR(30) NULL,
    -- Seller snapshot
    seller_name             VARCHAR(200) NOT NULL,
    seller_address          TEXT        NOT NULL,
    seller_tin              VARCHAR(50) NULL,
    seller_phone            VARCHAR(30) NULL,
    -- Amounts
    subtotal                DECIMAL(14,4) NOT NULL DEFAULT 0,
    discount_amount         DECIMAL(14,4) NOT NULL DEFAULT 0,
    taxable_amount          DECIMAL(14,4) NOT NULL DEFAULT 0,
    vat_exempt_amount       DECIMAL(14,4) NOT NULL DEFAULT 0,
    zero_rated_amount       DECIMAL(14,4) NOT NULL DEFAULT 0,
    tax_amount              DECIMAL(14,4) NOT NULL DEFAULT 0,
    total_amount            DECIMAL(14,4) NOT NULL DEFAULT 0,
    amount_paid             DECIMAL(14,4) NOT NULL DEFAULT 0,
    change_given            DECIMAL(14,4) NOT NULL DEFAULT 0,
    -- Status
    status                  ENUM('issued','void') NOT NULL DEFAULT 'issued',
    issued_at               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voided_at               TIMESTAMP   NULL,
    voided_by               BIGINT      NULL COMMENT 'FK → users.id',
    void_reason             VARCHAR(300) NULL,
    notes                   TEXT        NULL,
    printed_count           SMALLINT    NOT NULL DEFAULT 0,
    last_printed_at         TIMESTAMP   NULL,
    created_by              BIGINT      NOT NULL COMMENT 'FK → users.id',
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receipts_number       (receipt_number),
    UNIQUE KEY uq_receipts_transaction  (sales_transaction_id),
    KEY idx_receipts_customer           (customer_id),
    KEY idx_receipts_issued_at          (issued_at),
    KEY idx_receipts_status             (status),
    CONSTRAINT fk_receipts_sequence
        FOREIGN KEY (receipt_sequence_id) REFERENCES receipt_sequences (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_receipts_transaction
        FOREIGN KEY (sales_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: receipt_items
-- Immutable snapshot. Parts and services both appear here.
-- ============================================================
CREATE TABLE receipt_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    receipt_id          BIGINT      NOT NULL,
    line_number         SMALLINT    NOT NULL,
    product_variant_id  BIGINT      NULL,
    sku                 VARCHAR(100) NOT NULL COMMENT 'Snapshot at time of sale',
    description         VARCHAR(400) NOT NULL COMMENT 'Snapshot of product/service name',
    unit_of_measure     VARCHAR(20) NOT NULL DEFAULT 'pcs',
    is_service          TINYINT(1)  NOT NULL DEFAULT 0,
    qty                 DECIMAL(12,4) NOT NULL,
    unit_price          DECIMAL(12,4) NOT NULL,
    discount_amount     DECIMAL(12,4) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12,4) NOT NULL DEFAULT 0,
    line_total          DECIMAL(14,4) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_receipt_items_receipt (receipt_id),
    CONSTRAINT fk_receipt_items_receipt
        FOREIGN KEY (receipt_id) REFERENCES receipts (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: receipt_payments
-- Payment snapshot printed on the receipt.
-- ============================================================
CREATE TABLE receipt_payments (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    receipt_id          BIGINT      NOT NULL,
    payment_method_id   SMALLINT    NOT NULL,
    payment_method_name VARCHAR(80) NOT NULL COMMENT 'Snapshot of method name',
    amount              DECIMAL(14,4) NOT NULL,
    reference_number    VARCHAR(100) NULL,
    paid_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_receipt_payments_receipt (receipt_id),
    CONSTRAINT fk_receipt_payments_receipt
        FOREIGN KEY (receipt_id) REFERENCES receipts (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_receipt_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.6 Customer Management Tables

```sql
-- ============================================================
-- TABLE: customers
-- is_wholesale = 1 → POS uses wholesale_price when available.
-- ============================================================
CREATE TABLE customers (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    code                VARCHAR(20)     NOT NULL,
    first_name          VARCHAR(80)     NOT NULL,
    last_name           VARCHAR(80)     NOT NULL DEFAULT '',
    email               VARCHAR(200)    NULL,
    phone               VARCHAR(30)     NULL,
    is_wholesale        TINYINT(1)      NOT NULL DEFAULT 0
                        COMMENT '1 = wholesale account; use wholesale_price at POS when available',
    credit_limit        DECIMAL(14,2)   NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(14,2)   NOT NULL DEFAULT 0,
    notes               TEXT            NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_customers_code   (code),
    KEY idx_customers_phone        (phone),
    KEY idx_customers_email        (email),
    KEY idx_customers_wholesale    (is_wholesale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: customer_addresses
-- ============================================================
CREATE TABLE customer_addresses (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    customer_id     BIGINT          NOT NULL,
    label           VARCHAR(50)     NOT NULL DEFAULT 'Default',
    address_line1   VARCHAR(200)    NOT NULL,
    address_line2   VARCHAR(200)    NULL,
    city            VARCHAR(100)    NOT NULL,
    province        VARCHAR(100)    NULL,
    zip_code        VARCHAR(20)     NULL,
    is_default      TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_customer_addresses_customer (customer_id),
    CONSTRAINT fk_customer_addresses_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.7 User & Access Control Tables

Full RBAC with **action-level permissions** per module. Three roles pre-seeded in [Section 13](#13-rbac-seed-data).

```sql
-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE roles (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    name            VARCHAR(50)     NOT NULL,
    description     VARCHAR(300)    NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: permissions
-- Each row is one module:action capability.
-- e.g., module='pos', action='void'
-- ============================================================
CREATE TABLE permissions (
    id          INT             NOT NULL AUTO_INCREMENT,
    module      VARCHAR(60)     NOT NULL COMMENT 'e.g., products, pos, inventory, reports',
    action      VARCHAR(60)     NOT NULL COMMENT 'e.g., read, write, delete, void, approve',
    description VARCHAR(200)    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_permissions (module, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: role_permissions
-- ============================================================
CREATE TABLE role_permissions (
    role_id         SMALLINT    NOT NULL,
    permission_id   INT         NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rp_permission
        FOREIGN KEY (permission_id) REFERENCES permissions (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: users
-- Each user belongs to exactly one role.
-- pin_hash: 4-6 digit PIN for fast POS login (bcrypt hashed).
-- ============================================================
CREATE TABLE users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    role_id         SMALLINT        NOT NULL,
    username        VARCHAR(60)     NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash',
    first_name      VARCHAR(80)     NOT NULL,
    last_name       VARCHAR(80)     NOT NULL,
    email           VARCHAR(200)    NOT NULL,
    phone           VARCHAR(30)     NULL,
    pin_hash        VARCHAR(255)    NULL COMMENT '4-6 digit PIN, bcrypt hashed',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    last_login_at   TIMESTAMP       NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email    (email),
    KEY idx_users_role           (role_id),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.8 Audit & Logging Tables

```sql
-- ============================================================
-- TABLE: audit_log
-- ============================================================
CREATE TABLE audit_log (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NULL COMMENT 'NULL = system/trigger action',
    table_name      VARCHAR(80)     NOT NULL,
    record_id       BIGINT          NOT NULL,
    action          ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    old_values      JSON            NULL,
    new_values      JSON            NULL,
    ip_address      VARCHAR(45)     NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_log_table_record (table_name, record_id),
    KEY idx_audit_log_user         (user_id),
    KEY idx_audit_log_date         (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. POS-Inventory Integration Logic

### Sale Flow

```
STAFF scans barcode or searches product/service by name
         │
         ▼
 Application resolves price:
   IF customer.is_wholesale = 1
      AND COALESCE(variant.wholesale_price, product.wholesale_price) IS NOT NULL
   THEN price = wholesale_price
   ELSE price = selling_price
         │
         ▼
 INSERT sales_transactions (status = 'pending')
         │
         ▼
 INSERT sales_transaction_items (one row per part or service)
         │
         ├──► TRIGGER trg_sti_after_insert fires per row
         │         │
         │         ├── NEW.is_service = 1 → SKIP (no stock deduction)
         │         │
         │         └── NEW.is_service = 0:
         │               ├── SELECT ... FOR UPDATE on inventory_stock
         │               ├── SIGNAL if qty_on_hand < qty (prevents oversell)
         │               ├── UPDATE inventory_stock: qty_on_hand -= qty
         │               └── INSERT stock_movements (type = 'sale')
         │
         ▼
 CALL sp_complete_sale(transaction_id, amount_tendered, payment_method_id)
         ├── Validates cash_session.status = 'open'
         ├── UPDATE sales_transactions SET status = 'completed'
         ├── INSERT transaction_payments
         └── sp_generate_receipt()
               ├── Increments receipt_sequences.current_number (atomic)
               ├── INSERT receipts (header snapshot from business_profile)
               ├── INSERT receipt_items (line snapshots)
               └── INSERT receipt_payments (payment snapshot)
```

### PO Receipt → Cost History Flow

```
ADMIN marks PO item as received
         │
         ▼
 UPDATE purchase_order_items
    SET qty_received = N, unit_cost = <actual cost on invoice>
         │
         ├──► TRIGGER trg_poi_after_update
         │         ├── qty_delta = NEW.qty_received - OLD.qty_received
         │         ├── Recalculate weighted avg_cost
         │         ├── UPDATE inventory_stock: qty_on_hand += delta, avg_cost = new_avg
         │         ├── INSERT stock_movements (type = 'purchase_receipt')
         │         └── IF unit_cost changed:
         │               INSERT supplier_cost_history (source = 'po_receipt')
         │
         └──► TRIGGER trg_sp_cost_history (if admin also updates supplier_products)
                   └── INSERT supplier_cost_history (source = 'manual_update')
```

---

## 6. Normalization Analysis

### 1NF ✅  Atomic values throughout. Barcodes in `product_barcodes`. Fitments in `product_vehicle_fitments`. Payments in `transaction_payments`.

### 2NF ✅  All tables use single-column surrogate PKs. No partial dependencies.

### 3NF ✅

| Removed Transitive Dependency | Resolution |
|-------------------------------|------------|
| `products.brand_country` | Stored in `brands.country_origin` |
| `sales_txn_items.cashier_id` | Accessed via `sales_transactions.cashier_id` |
| `inventory_stock.product_name` | Joined from `products` |
| `receipts.cashier_name` | Referenced via `users.id` |
| `purchase_order_items.supplier_id` | Via `purchase_orders.supplier_id` |

### Intentional Denormalizations

| Field | Table | Reason |
|-------|-------|--------|
| `unit_price`, `unit_cost` | `sales_transaction_items` | Price/cost snapshot at time of sale |
| `is_service` | `sales_transaction_items`, `sales_return_items` | Snapshot avoids JOIN inside trigger |
| `total_amount` | `sales_transactions` | Stored aggregate for fast reporting |
| `outstanding_balance` | `customers` | Running balance; avoids full ledger scan |
| Buyer/seller fields | `receipts` | Immutable receipt snapshot |
| `cost_change_pct` | `supplier_cost_history` | Stored generated column |
| `margin_pct`, `markup_pct` | `product_variants` | Stored generated columns; auto-synced |

---

## 7. Indexes & Query Optimization

```sql
-- POS critical path: barcode scan (sub-millisecond)
CREATE INDEX idx_barcodes_scan
ON product_barcodes (barcode, product_variant_id);

-- Stock check before sale
CREATE INDEX idx_inventory_variant
ON inventory_stock (product_variant_id, qty_on_hand);

-- Low stock alert page
CREATE INDEX idx_inventory_low_stock
ON inventory_stock (qty_on_hand, reorder_point);

-- Date-range sales reports
CREATE INDEX idx_sales_txn_date_status
ON sales_transactions (transaction_date, status);

-- Stock movement history per product
CREATE INDEX idx_stock_movements_variant_date
ON stock_movements (product_variant_id, created_at DESC);

-- Supplier cost trend chart (core analytics)
CREATE INDEX idx_sch_supplier_variant_date
ON supplier_cost_history (supplier_id, product_variant_id, effective_date DESC);

-- Vehicle fitment lookup
CREATE INDEX idx_fitment_model_product
ON product_vehicle_fitments (vehicle_model_id, product_id);

-- Customer lookup by phone at counter
CREATE INDEX idx_customers_phone_active
ON customers (phone, is_active);

-- PO receiving
CREATE INDEX idx_poi_po_variant
ON purchase_order_items (purchase_order_id, product_variant_id);

-- Under-margin product report
CREATE INDEX idx_pv_margin_active
ON product_variants (margin_pct, is_active);

-- Filter parts vs services
CREATE INDEX idx_products_service_active
ON products (is_service, is_active);
```

| Query Pattern | Index |
|--------------|-------|
| Barcode scan at POS | `uq_product_barcodes_barcode` |
| Stock check before sale | `idx_inventory_variant` |
| Low stock alerts | `idx_inventory_low_stock` |
| Daily/date-range sales report | `idx_sales_txn_date_status` |
| Stock movement history | `idx_stock_movements_variant_date` |
| Supplier cost trend report | `idx_sch_supplier_variant_date` |
| Vehicle fitment lookup | `idx_fitment_model_product` |
| Customer lookup by phone | `idx_customers_phone_active` |
| Under-margin product scan | `idx_pv_margin_active` |
| Parts vs services filter | `idx_products_service_active` |

---

## 8. Stored Procedures & Triggers

### TRIGGER: Stock Deduction on Sale (parts only)

```sql
DELIMITER $$

CREATE TRIGGER trg_sti_after_insert
AFTER INSERT ON sales_transaction_items
FOR EACH ROW
BEGIN
    DECLARE v_qty_before DECIMAL(12,4);
    DECLARE v_qty_after  DECIMAL(12,4);
    DECLARE v_cashier_id BIGINT;

    -- Services: no stock to deduct
    IF NEW.is_service = 0 THEN

        SELECT cashier_id INTO v_cashier_id
        FROM   sales_transactions
        WHERE  id = NEW.sales_transaction_id;

        SELECT qty_on_hand INTO v_qty_before
        FROM   inventory_stock
        WHERE  product_variant_id = NEW.product_variant_id
        FOR UPDATE;

        IF v_qty_before < NEW.qty THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock for this product';
        END IF;

        SET v_qty_after = v_qty_before - NEW.qty;

        UPDATE inventory_stock
        SET    qty_on_hand = v_qty_after,
               updated_at  = CURRENT_TIMESTAMP
        WHERE  product_variant_id = NEW.product_variant_id;

        INSERT INTO stock_movements (
            product_variant_id, movement_type, reference_type,
            reference_id, qty_before, qty_change, qty_after,
            unit_cost, performed_by, created_at
        ) VALUES (
            NEW.product_variant_id,
            'sale', 'sales_transaction',
            NEW.sales_transaction_id,
            v_qty_before, -NEW.qty, v_qty_after,
            NEW.unit_cost, v_cashier_id, CURRENT_TIMESTAMP
        );

    END IF;
END$$

DELIMITER ;
```

### TRIGGER: Stock Restoration on Return (parts only)

```sql
DELIMITER $$

CREATE TRIGGER trg_sri_after_insert
AFTER INSERT ON sales_return_items
FOR EACH ROW
BEGIN
    DECLARE v_qty_before DECIMAL(12,4);
    DECLARE v_qty_after  DECIMAL(12,4);
    DECLARE v_cashier_id BIGINT;

    IF NEW.is_service = 0 AND NEW.restock = 1 THEN

        SELECT cashier_id INTO v_cashier_id
        FROM   sales_returns WHERE id = NEW.sales_return_id;

        SELECT qty_on_hand INTO v_qty_before
        FROM   inventory_stock
        WHERE  product_variant_id = NEW.product_variant_id
        FOR UPDATE;

        SET v_qty_after = v_qty_before + NEW.qty_returned;

        UPDATE inventory_stock
        SET    qty_on_hand = v_qty_after,
               updated_at  = CURRENT_TIMESTAMP
        WHERE  product_variant_id = NEW.product_variant_id;

        INSERT INTO stock_movements (
            product_variant_id, movement_type, reference_type,
            reference_id, qty_before, qty_change, qty_after,
            unit_cost, performed_by
        ) VALUES (
            NEW.product_variant_id,
            'sale_return', 'sales_return',
            NEW.sales_return_id,
            v_qty_before, NEW.qty_returned, v_qty_after,
            NEW.unit_price, v_cashier_id
        );

    END IF;
END$$

DELIMITER ;
```

### TRIGGER: Stock & Cost Update on PO Receipt

```sql
DELIMITER $$

CREATE TRIGGER trg_poi_after_update
AFTER UPDATE ON purchase_order_items
FOR EACH ROW
BEGIN
    DECLARE v_qty_before   DECIMAL(12,4);
    DECLARE v_qty_received DECIMAL(12,4);
    DECLARE v_qty_after    DECIMAL(12,4);
    DECLARE v_old_avg_cost DECIMAL(14,6);
    DECLARE v_new_avg_cost DECIMAL(14,6);
    DECLARE v_created_by   BIGINT;

    SET v_qty_received = NEW.qty_received - OLD.qty_received;

    IF v_qty_received > 0 THEN

        SELECT created_by INTO v_created_by
        FROM   purchase_orders WHERE id = NEW.purchase_order_id;

        SELECT qty_on_hand, avg_cost
        INTO   v_qty_before, v_old_avg_cost
        FROM   inventory_stock
        WHERE  product_variant_id = NEW.product_variant_id
        FOR UPDATE;

        -- Weighted average cost
        SET v_new_avg_cost =
            ((v_qty_before * v_old_avg_cost) + (v_qty_received * NEW.unit_cost))
            / (v_qty_before + v_qty_received);

        SET v_qty_after = v_qty_before + v_qty_received;

        UPDATE inventory_stock
        SET    qty_on_hand = v_qty_after,
               avg_cost    = v_new_avg_cost,
               updated_at  = CURRENT_TIMESTAMP
        WHERE  product_variant_id = NEW.product_variant_id;

        INSERT INTO stock_movements (
            product_variant_id, movement_type, reference_type,
            reference_id, qty_before, qty_change, qty_after,
            unit_cost, performed_by
        ) VALUES (
            NEW.product_variant_id,
            'purchase_receipt', 'purchase_order',
            NEW.purchase_order_id,
            v_qty_before, v_qty_received, v_qty_after,
            NEW.unit_cost, v_created_by
        );

        -- Log cost history when received price differs from previous
        IF NEW.unit_cost <> OLD.unit_cost OR OLD.qty_received = 0 THEN
            INSERT INTO supplier_cost_history (
                supplier_id, product_variant_id, supplier_product_id,
                old_unit_cost, new_unit_cost, change_source,
                purchase_order_id, change_reason, changed_by, effective_date
            )
            SELECT
                po.supplier_id,
                NEW.product_variant_id,
                sp.id,
                COALESCE(OLD.unit_cost, NEW.unit_cost),
                NEW.unit_cost,
                'po_receipt',
                NEW.purchase_order_id,
                CONCAT('Auto: PO receipt – ', po.po_number),
                v_created_by,
                CURDATE()
            FROM  purchase_orders po
            LEFT JOIN supplier_products sp
                   ON sp.supplier_id        = po.supplier_id
                  AND sp.product_variant_id = NEW.product_variant_id
            WHERE po.id = NEW.purchase_order_id;
        END IF;

    END IF;
END$$

DELIMITER ;
```

### TRIGGER: Manual Supplier Cost Update → Cost History

```sql
-- Set session variable at app login: SET @current_user_id = <user_id>;

DELIMITER $$

CREATE TRIGGER trg_sp_cost_history
AFTER UPDATE ON supplier_products
FOR EACH ROW
BEGIN
    IF NEW.unit_cost <> OLD.unit_cost THEN
        INSERT INTO supplier_cost_history (
            supplier_id, product_variant_id, supplier_product_id,
            old_unit_cost, new_unit_cost, change_source,
            change_reason, changed_by, effective_date
        ) VALUES (
            NEW.supplier_id, NEW.product_variant_id, NEW.id,
            OLD.unit_cost, NEW.unit_cost,
            'manual_update', NULL, @current_user_id, CURDATE()
        );
    END IF;
END$$

DELIMITER ;
```

### Stored Procedure: Complete POS Sale

```sql
DELIMITER $$

CREATE PROCEDURE sp_complete_sale(
    IN  p_transaction_id    BIGINT,
    IN  p_amount_tendered   DECIMAL(14,4),
    IN  p_payment_method_id SMALLINT,
    OUT p_change_given      DECIMAL(14,4),
    OUT p_result_code       TINYINT,
    OUT p_result_message    VARCHAR(200)
)
BEGIN
    DECLARE v_total_amount   DECIMAL(14,4);
    DECLARE v_session_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code    = 1;
        SET p_result_message = 'Transaction failed. Rolled back.';
    END;

    START TRANSACTION;

    SELECT cs.status INTO v_session_status
    FROM   sales_transactions st
    JOIN   cash_sessions cs ON cs.id = st.cash_session_id
    WHERE  st.id = p_transaction_id FOR UPDATE;

    IF v_session_status != 'open' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cash session is not open';
    END IF;

    SELECT total_amount INTO v_total_amount
    FROM   sales_transactions
    WHERE  id = p_transaction_id AND status = 'pending';

    IF v_total_amount IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction not found or already processed';
    END IF;

    IF p_amount_tendered < v_total_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient payment amount';
    END IF;

    SET p_change_given = p_amount_tendered - v_total_amount;

    UPDATE sales_transactions
    SET    status          = 'completed',
           amount_tendered = p_amount_tendered,
           change_given    = p_change_given
    WHERE  id = p_transaction_id;

    INSERT INTO transaction_payments (sales_transaction_id, payment_method_id, amount)
    VALUES (p_transaction_id, p_payment_method_id, p_amount_tendered);

    COMMIT;

    SET p_result_code    = 0;
    SET p_result_message = 'Sale completed successfully';
END$$

DELIMITER ;
```

---

## 9. Views for Reporting

```sql
-- ============================================================
-- VIEW: v_current_stock  — parts only
-- ============================================================
CREATE OR REPLACE VIEW v_current_stock AS
SELECT
    p.id, p.sku,
    p.name              AS product_name,
    b.name              AS brand_name,
    c.name              AS category_name,
    pv.id               AS variant_id,
    pv.variant_sku, pv.variant_name,
    ist.qty_on_hand, ist.qty_reserved, ist.qty_available, ist.reorder_point,
    ist.avg_cost,
    COALESCE(pv.selling_price,   p.selling_price)   AS selling_price,
    COALESCE(pv.wholesale_price, p.wholesale_price) AS wholesale_price,
    (ist.qty_on_hand * ist.avg_cost)                AS stock_value,
    pv.margin_pct, pv.markup_pct,
    CASE
        WHEN ist.qty_available <= 0                  THEN 'OUT_OF_STOCK'
        WHEN ist.qty_available <= ist.reorder_point  THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM  inventory_stock ist
JOIN  product_variants pv ON pv.id = ist.product_variant_id
JOIN  products p          ON p.id  = pv.product_id AND p.is_service = 0
LEFT JOIN brands b        ON b.id  = p.brand_id
JOIN  categories c        ON c.id  = p.category_id
WHERE pv.deleted_at IS NULL AND p.deleted_at IS NULL;


-- ============================================================
-- VIEW: v_low_stock_alerts
-- ============================================================
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT
    p.sku, p.name AS product_name, pv.variant_sku,
    ist.qty_on_hand, ist.qty_available, ist.reorder_point, ist.reorder_qty,
    (ist.reorder_point - ist.qty_available) AS shortage_qty,
    s.name          AS preferred_supplier,
    sp.unit_cost    AS current_supplier_cost,
    sp.lead_time_days
FROM  inventory_stock ist
JOIN  product_variants pv ON pv.id = ist.product_variant_id
JOIN  products p          ON p.id  = pv.product_id AND p.is_service = 0
LEFT JOIN supplier_products sp ON sp.product_variant_id = pv.id
                               AND sp.is_preferred = 1 AND sp.is_active = 1
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE ist.qty_available <= ist.reorder_point
AND   ist.reorder_point  > 0
AND   pv.is_active = 1 AND p.is_active = 1
ORDER BY shortage_qty DESC;


-- ============================================================
-- VIEW: v_daily_sales_summary
-- ============================================================
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT
    DATE(st.transaction_date) AS sale_date,
    COUNT(*)                  AS transaction_count,
    SUM(st.subtotal)          AS total_subtotal,
    SUM(st.discount_amount)   AS total_discounts,
    SUM(st.tax_amount)        AS total_tax,
    SUM(st.total_amount)      AS total_revenue,
    SUM(st.total_amount - COALESCE((
        SELECT SUM(sti2.qty * sti2.unit_cost)
        FROM   sales_transaction_items sti2
        WHERE  sti2.sales_transaction_id = st.id
    ), 0))                    AS gross_profit
FROM  sales_transactions st
WHERE st.status = 'completed'
GROUP BY DATE(st.transaction_date)
ORDER BY sale_date DESC;


-- ============================================================
-- VIEW: v_sales_performance  — parts and services together
-- ============================================================
CREATE OR REPLACE VIEW v_sales_performance AS
SELECT
    p.id, p.sku, p.name AS product_name, p.is_service,
    b.name AS brand, c.name AS category,
    pv.id AS variant_id, pv.variant_sku,
    SUM(sti.qty)                                    AS total_qty_sold,
    COUNT(DISTINCT sti.sales_transaction_id)        AS transaction_count,
    SUM(sti.line_total)                             AS total_revenue,
    SUM(sti.qty * sti.unit_cost)                    AS total_cogs,
    SUM(sti.line_total - (sti.qty * sti.unit_cost)) AS gross_profit,
    ROUND(
        SUM(sti.line_total - (sti.qty * sti.unit_cost))
        / NULLIF(SUM(sti.line_total), 0) * 100
    , 2)                                            AS margin_pct_realized,
    MIN(st.transaction_date) AS first_sale_date,
    MAX(st.transaction_date) AS last_sale_date
FROM  sales_transaction_items sti
JOIN  sales_transactions st ON st.id = sti.sales_transaction_id AND st.status = 'completed'
JOIN  product_variants   pv ON pv.id = sti.product_variant_id
JOIN  products           p  ON p.id  = pv.product_id
LEFT JOIN brands         b  ON b.id  = p.brand_id
JOIN  categories         c  ON c.id  = p.category_id
GROUP BY p.id, p.sku, p.name, p.is_service, b.name, c.name, pv.id, pv.variant_sku
ORDER BY total_revenue DESC;


-- ============================================================
-- VIEW: v_supplier_cost_trends
-- Every supplier price change per part, newest first.
-- Includes 12-month rolling average cost.
-- ============================================================
CREATE OR REPLACE VIEW v_supplier_cost_trends AS
SELECT
    sch.effective_date,
    s.code AS supplier_code, s.name AS supplier_name,
    p.sku, p.name AS product_name, pv.variant_sku,
    sch.old_unit_cost, sch.new_unit_cost, sch.cost_change_pct,
    CASE
        WHEN sch.cost_change_pct > 0 THEN 'increase'
        WHEN sch.cost_change_pct < 0 THEN 'decrease'
        ELSE 'no change'
    END AS direction,
    sch.change_source, sch.change_reason,
    AVG(sch.new_unit_cost) OVER (
        PARTITION BY sch.supplier_id, sch.product_variant_id
        ORDER BY sch.effective_date
        ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    ) AS rolling_12m_avg_cost
FROM  supplier_cost_history sch
JOIN  suppliers        s  ON s.id  = sch.supplier_id
JOIN  product_variants pv ON pv.id = sch.product_variant_id
JOIN  products         p  ON p.id  = pv.product_id
ORDER BY sch.effective_date DESC, s.name, p.name;
```

---

## 10. Business Rules & Constraints

| Rule | Implementation |
|------|---------------|
| Stock cannot go negative | `trg_sti_after_insert`: SIGNAL if `qty_on_hand < qty` |
| Services never deduct stock | `trg_sti_after_insert`: skips when `NEW.is_service = 1` |
| Services are never restocked on return | `restock` field always = 0 for service return items |
| Sales must belong to an open cash session | `sp_complete_sale` validates `cash_sessions.status = 'open'` |
| `qty_available = qty_on_hand - qty_reserved` | `GENERATED ALWAYS AS` virtual column |
| Selling price must be ≥ min_selling_price | Enforced at application layer |
| PO receipts recalculate weighted avg_cost | `trg_poi_after_update` |
| Every supplier cost change is logged | `trg_sp_cost_history` (manual) + `trg_poi_after_update` (PO) |
| `margin_pct` and `markup_pct` auto-sync | `GENERATED ALWAYS AS (STORED)` on `product_variants` |
| Wholesale price resolved at POS | Application: `is_wholesale = 1` + `wholesale_price IS NOT NULL` |
| Receipts are immutable snapshots | `receipt_items` stores text snapshots independent of product records |
| Soft-deleted products cannot be sold | Application filters `deleted_at IS NULL` |
| Cash session cannot be reopened | ENUM transition enforced at application layer |
| Role-based access enforced per action | Application checks `role_permissions` for `module:action` |

---

## 11. Performance Considerations

```ini
# Recommended InnoDB settings
innodb_buffer_pool_size        = 512M   # 70-80% of available RAM
innodb_flush_log_at_trx_commit = 1      # Full ACID for financial data
innodb_log_file_size           = 128M
```

### Partitioning (when tables grow large)

```sql
ALTER TABLE stock_movements
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

ALTER TABLE sales_transactions
PARTITION BY RANGE (UNIX_TIMESTAMP(transaction_date)) (
    PARTITION p_2025_01 VALUES LESS THAN (UNIX_TIMESTAMP('2025-02-01')),
    PARTITION p_2025_02 VALUES LESS THAN (UNIX_TIMESTAMP('2025-03-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### Caching

| Data | Strategy | TTL |
|------|---------|-----|
| Product/service catalog | Redis | 5 min |
| Stock levels (read) | Redis | 10 sec |
| Tax rates | In-memory app | 1 hour |
| Category tree | Redis | 30 min |
| RBAC permission map per role | In-memory app | Until role updated |

---

## 12. Sample Data Flow Walkthrough

### Scenario A: Staff sells 2× spark plugs + 1× oil change service

```
Staff scans barcode → NGK CR8E (is_service=0), adds Oil Change (is_service=1)
Customer: walk-in (no customer_id)

INSERT sales_transaction_items:
  Row 1: variant_id=1, is_service=0, qty=2, unit_price=165.00, unit_cost=88.00
  Row 2: variant_id=22, is_service=1, qty=1, unit_price=350.00, unit_cost=150.00

Trigger for Row 1 (part):
  inventory_stock: qty_on_hand 45 → 43
  stock_movements: type='sale', qty_change=-2

Trigger for Row 2 (service): SKIPPED

sp_complete_sale():
  total = 330 + 350 = 680 PHP
  customer pays 700 PHP → change = 20 PHP
  receipt OR-2025-000015 generated
```

### Scenario B: Wholesale customer buys engine oil

```
Customer: Mang Auto Parts (is_wholesale=1)
Product: Motul 5W-30 4L
  selling_price   = 1,280.00
  wholesale_price = 1,050.00

Application resolves: is_wholesale=1 AND wholesale_price IS NOT NULL
→ unit_price = 1,050.00 (wholesale)

Cashier processes 6 units → line_total = 6,300.00
Receipt issued with wholesale price captured as snapshot.
```

### Scenario C: Admin receives NGK order with new price

```
PO ordered: 48× NGK CR8E at 82.00/pc
Received: 48 units, supplier invoice shows 86.00/pc

UPDATE purchase_order_items SET qty_received=48, unit_cost=86.00 WHERE id=5;

trg_poi_after_update:
  qty delta = 48
  new avg_cost = ((43 × 82) + (48 × 86)) / 91 = 84.11
  inventory_stock: qty=91, avg_cost=84.11
  stock_movements: type='purchase_receipt', qty_change=+48
  cost changed (82≠86) → supplier_cost_history:
    old=82.00, new=86.00, pct=+4.88%, source='po_receipt'

v_supplier_cost_trends now shows:
  NGK | NGK CR8E | +4.88% | po_receipt | 2025-03-20
```

---

## 13. RBAC Seed Data

```sql
-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (id, name, description) VALUES
  (1, 'superadmin', 'Developer — unrestricted system access'),
  (2, 'admin',      'Shop Owner/Manager — full daily operations'),
  (3, 'staff',      'Cashier/Mechanic — POS and read-only inventory');


-- ============================================================
-- PERMISSIONS  (29 module:action pairs)
-- ============================================================
INSERT INTO permissions (id, module, action, description) VALUES
  -- Products & Services
  ( 1, 'products',        'read',    'View product and service catalog'),
  ( 2, 'products',        'write',   'Create and edit products/services'),
  ( 3, 'products',        'delete',  'Soft-delete products/services'),
  ( 4, 'products',        'pricing', 'Change selling or wholesale prices'),
  -- Inventory
  ( 5, 'inventory',       'read',    'View stock levels and movement history'),
  ( 6, 'inventory',       'adjust',  'Create manual stock adjustments'),
  ( 7, 'inventory',       'approve', 'Approve and post stock adjustments'),
  -- Suppliers & Purchasing
  ( 8, 'suppliers',       'read',    'View suppliers and cost history'),
  ( 9, 'suppliers',       'write',   'Create and edit supplier records'),
  (10, 'purchase_orders', 'read',    'View purchase orders'),
  (11, 'purchase_orders', 'write',   'Create and edit purchase orders'),
  (12, 'purchase_orders', 'receive', 'Mark PO items as received'),
  (13, 'purchase_orders', 'approve', 'Approve and send purchase orders'),
  -- POS / Sales
  (14, 'pos',             'read',    'View transaction history'),
  (15, 'pos',             'sell',    'Process new sales transactions'),
  (16, 'pos',             'discount','Apply discounts at POS'),
  (17, 'pos',             'void',    'Void a completed transaction'),
  (18, 'pos',             'return',  'Process customer returns'),
  (19, 'pos',             'session', 'Open and close cash sessions'),
  -- Customers
  (20, 'customers',       'read',    'View customer profiles'),
  (21, 'customers',       'write',   'Create and edit customer profiles'),
  -- Receipts
  (22, 'receipts',        'read',    'View and reprint receipts'),
  (23, 'receipts',        'void',    'Void an issued receipt'),
  -- Reports
  (24, 'reports',         'read',    'View sales and inventory reports'),
  (25, 'reports',         'export',  'Export reports to CSV/PDF'),
  -- Users
  (26, 'users',           'read',    'View user accounts'),
  (27, 'users',           'write',   'Create and edit user accounts'),
  -- System
  (28, 'system',          'config',  'Manage system settings and business profile'),
  (29, 'system',          'audit',   'View audit log');


-- ============================================================
-- ROLE PERMISSIONS
-- ============================================================

-- superadmin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- admin: full operations, no user management or system config
INSERT INTO role_permissions (role_id, permission_id) VALUES
  (2, 1),(2, 2),(2, 3),(2, 4),    -- products: read, write, delete, pricing
  (2, 5),(2, 6),(2, 7),            -- inventory: read, adjust, approve
  (2, 8),(2, 9),                   -- suppliers: read, write
  (2,10),(2,11),(2,12),(2,13),    -- purchase_orders: all
  (2,14),(2,15),(2,16),(2,17),    -- pos: read, sell, discount, void
  (2,18),(2,19),                   -- pos: return, session
  (2,20),(2,21),                   -- customers: read, write
  (2,22),(2,23),                   -- receipts: read, void
  (2,24),(2,25);                   -- reports: read, export

-- staff: POS counter + read-only views
INSERT INTO role_permissions (role_id, permission_id) VALUES
  (3, 1),                          -- products: read
  (3, 5),                          -- inventory: read
  (3, 8),                          -- suppliers: read (for cost info)
  (3,14),(3,15),(3,16),           -- pos: read, sell, discount
  (3,19),                          -- pos: session (open/close own shift)
  (3,20),                          -- customers: read
  (3,22),                          -- receipts: read/reprint
  (3,24);                          -- reports: read


-- ============================================================
-- DEFAULT USERS (update password_hash in production!)
-- ============================================================
INSERT INTO users (role_id, username, password_hash, first_name, last_name, email, is_active) VALUES
  (1, 'superadmin', '$2b$12$REPLACE_WITH_REAL_HASH', 'System', 'Admin',  'superadmin@shop.local', 1),
  (2, 'admin',      '$2b$12$REPLACE_WITH_REAL_HASH', 'Maria',  'Santos', 'admin@shop.local',      1),
  (3, 'staff',      '$2b$12$REPLACE_WITH_REAL_HASH', 'Juan',   'Cruz',   'staff@shop.local',      1);
```

---

## Summary: Table Reference Sheet

| Table | Purpose | Est. Rows |
|-------|---------|----------|
| `brands` | Product manufacturers | Hundreds |
| `categories` | Part + service category hierarchy | Hundreds |
| `units_of_measure` | pcs, set, L, hr, etc. | Tens |
| `tax_rates` | VAT and exemption rates | Tens |
| `vehicle_makes` | Car/motorcycle makes | Hundreds |
| `vehicle_models` | Car/motorcycle models | Thousands |
| `products` | **Parts AND services unified** (`is_service` flag) | Thousands |
| `product_variants` | Saleable variants (auto margin/markup) | Thousands |
| `product_barcodes` | Barcode lookup — parts only | Thousands |
| `product_vehicle_fitments` | Part-to-model compatibility | Tens of thousands |
| `inventory_stock` | **Single-store stock — parts only** | Thousands |
| `stock_movements` | **Immutable stock event ledger** | Millions |
| `stock_adjustments` | Manual adjustment batch headers | Hundreds |
| `suppliers` | Supplier directory | Dozens |
| `supplier_products` | Current cost per supplier per part | Thousands |
| `supplier_cost_history` | **★ Full supplier price change log** | Tens of thousands |
| `purchase_orders` | PO headers | Thousands |
| `purchase_order_items` | PO line items (cost per line) | Tens of thousands |
| `cash_sessions` | Shift open/close records | Thousands |
| `discounts` | Pre-configured discounts and promos | Tens |
| `sales_transactions` | **POS transaction headers** | Millions |
| `sales_transaction_items` | **POS line items (parts + services)** | Millions |
| `payment_methods` | Cash, GCash, card, etc. | Tens |
| `transaction_payments` | Payment records (split-pay support) | Millions |
| `sales_returns` | Return headers | Thousands |
| `sales_return_items` | Return line items | Thousands |
| `business_profile` | Shop details for receipt header | 1 row |
| `receipt_sequences` | BIR OR/SI series control | Tens |
| `receipts` | **BIR receipt headers (1-to-1 with transactions)** | Millions |
| `receipt_items` | Immutable receipt line snapshots | Millions |
| `receipt_payments` | Immutable payment snapshots | Millions |
| `customers` | Customer profiles (`is_wholesale` flag) | Thousands |
| `customer_addresses` | Delivery addresses | Thousands |
| `roles` | superadmin, admin, staff | 3 rows |
| `permissions` | 29 action-level permission definitions | 29 rows |
| `role_permissions` | Role ↔ permission mapping | ~60 rows |
| `users` | System users (FK → roles) | Tens |
| `audit_log` | Change history across all tables | Millions |

---

*Document Version: 2.0 — Single-Store Edition*
*MySQL 8.0+ / MariaDB 10.6+ | InnoDB | utf8mb4*
