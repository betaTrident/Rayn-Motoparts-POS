# Strategic Database Design
# Motorparts & Accessories Inventory Management System with Integrated POS

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
   - 4.5 [Invoice Tables](#45-invoice-tables)
   - 4.6 [Customer Management Tables](#46-customer-management-tables)
   - 4.7 [User & Access Control Tables](#47-user--access-control-tables)
   - 4.8 [Audit & Logging Tables](#48-audit--logging-tables)
   - 4.9 [Pricing & Analytics Tables](#49-pricing--analytics-tables)
5. [Inventory-POS Integration Logic](#5-inventory-pos-integration-logic)
6. [Normalization Analysis](#6-normalization-analysis)
7. [Indexes & Query Optimization](#7-indexes--query-optimization)
8. [Stored Procedures & Triggers](#8-stored-procedures--triggers)
9. [Views for Reporting](#9-views-for-reporting)
10. [Business Rules & Constraints](#10-business-rules--constraints)
11. [Scalability & Performance Considerations](#11-scalability--performance-considerations)
12. [Sample Data Flow Walkthrough](#12-sample-data-flow-walkthrough)
13. [Pricing & Analytics Migration Reference](#13-pricing--analytics-migration-reference)

---

## 1. System Overview

This database design supports a fully integrated **Motorparts & Accessories Inventory Management System with Point-of-Sale (POS)**. The integration ensures that every sales transaction in the POS automatically deducts stock from inventory in real-time, maintains audit trails, supports multi-location warehousing, manages suppliers and purchase orders, and provides comprehensive reporting.

### Key Capabilities

- Real-time inventory deduction on every sale
- Multi-warehouse / multi-branch support
- Supplier and purchase order management
- Customer credit management
- Role-based access control
- Full audit trail for stock movements
- Low-stock alerts and reorder automation
- Compatibility/fitment matrix (vehicle make/model/year)
- Barcode and SKU-based product lookup
- Returns, exchanges, and refund handling
- Comprehensive sales and inventory reporting

---

## 2. Design Philosophy & Principles

### Normalization Strategy

The schema strictly follows **Third Normal Form (3NF)** across all tables, with select use of **denormalization only in reporting views** for performance. Key rules applied:

- **1NF**: Every column contains atomic values; no repeating groups
- **2NF**: Every non-key attribute is fully dependent on the entire primary key
- **3NF**: No transitive dependencies; non-key attributes depend only on the primary key

### Naming Conventions

| Element        | Convention               | Example                    |
|----------------|--------------------------|----------------------------|
| Tables         | `snake_case`, plural     | `product_variants`         |
| Primary Keys   | `id` (surrogate, BIGINT) | `id BIGINT AUTO_INCREMENT` |
| Foreign Keys   | `<table_singular>_id`    | `product_id`, `category_id`|
| Timestamps     | `created_at`, `updated_at` | Standard audit columns   |
| Boolean flags  | `is_<state>`             | `is_active`, `is_taxable`  |
| Soft delete    | `deleted_at` (nullable)  | NULL = active              |

### Primary Key Strategy

- All tables use **surrogate BIGINT AUTO_INCREMENT** primary keys for join performance and immutability.
- Business identifiers (SKU, barcode, order number) are stored as separate `UNIQUE` columns, never as PKs.

### Soft Deletes

All core tables implement soft deletion via `deleted_at TIMESTAMP NULL`. Records are never physically deleted; they are archived. This preserves referential integrity and historical accuracy for sales records.

---

## 3. Entity-Relationship Overview

```
REFERENCE DOMAIN
├── brands
├── categories  (self-referencing tree)
├── units_of_measure
├── tax_rates
└── vehicle_compatibility (make/model/year matrix)

PRODUCT DOMAIN
├── products  ────────────────────────────────────────┐
│   ├── product_variants (color, size, spec)           │
│   │   ├── margin_pct (generated column)              │
│   │   └── markup_pct (generated column)              │
│   ├── product_images                                 │
│   ├── product_barcodes                               │
│   └── product_vehicle_fitments ──── vehicle_compatibility
│
PRICING & ANALYTICS DOMAIN (new)
├── product_price_history  (retail price change log)
├── supplier_cost_history  (supplier cost change log)
├── price_tiers            (walk-in, wholesale, dealer, bulk)
└── product_price_tier_rules (per-variant tier prices + qty breaks)
│
INVENTORY DOMAIN
├── warehouses / branches
├── inventory_stock  (product_variant × warehouse)
├── stock_movements  (every +/- event logged here)
├── stock_adjustments
└── reorder_rules

PROCUREMENT DOMAIN
├── suppliers
├── supplier_products (supplier pricing per product)
├── purchase_orders
└── purchase_order_items ──────────────────────────────┤
                                                       │
POS / SALES DOMAIN                                     │
├── pos_terminals                                      │
├── cash_sessions (open/close drawer)                  │
├── sales_transactions  ◄── TRIGGERS stock_movements  │
├── sales_transaction_items ──────────────────────────┘
├── payment_methods
├── transaction_payments (split payment support)
├── returns & return_items
└── discounts / promotions

INVOICE DOMAIN
├── invoice_sequences (series control, BIR-ready)
├── business_profile (shop details for invoice header)
├── invoices  ◄── auto-generated on sale completion
├── invoice_items (immutable line item snapshot)
└── invoice_payments (payment breakdown snapshot)

CUSTOMER DOMAIN
├── customers
└── customer_addresses

ACCESS CONTROL
├── roles
├── users
└── user_roles

AUDIT
├── audit_log  (all DDL/DML changes)
└── error_log
```

---

## 4. Database Schema

> **Database Engine**: MySQL 8.0+ / MariaDB 10.6+ (InnoDB, supports transactions, foreign keys, triggers)
> **Character Set**: `utf8mb4` | **Collation**: `utf8mb4_unicode_ci`

---

### 4.1 Core Reference Tables

```sql
-- ============================================================
-- TABLE: brands
-- Stores product manufacturers/brands (e.g., NGK, Denso, Bosch)
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
-- Self-referencing adjacency list for category hierarchy
-- e.g., Engine Parts > Filters > Oil Filters
-- ============================================================
CREATE TABLE categories (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    parent_id       BIGINT          NULL COMMENT 'NULL = root category',
    name            VARCHAR(120)    NOT NULL,
    slug            VARCHAR(120)    NOT NULL,
    description     TEXT            NULL,
    icon_url        VARCHAR(512)    NULL,
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
-- e.g., piece, set, liter, pair, box
-- ============================================================
CREATE TABLE units_of_measure (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    code            VARCHAR(20)     NOT NULL COMMENT 'Short code: pcs, set, L, pr',
    name            VARCHAR(60)     NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_uom_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: tax_rates
-- Configurable tax rates (VAT, percentage exemptions, etc.)
-- ============================================================
CREATE TABLE tax_rates (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    name            VARCHAR(80)     NOT NULL COMMENT 'e.g., VAT 12%, Zero-rated',
    rate            DECIMAL(6,4)    NOT NULL COMMENT 'Stored as decimal: 0.12 = 12%',
    is_inclusive    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = tax already in price',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tax_rates_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: vehicle_makes
-- e.g., Toyota, Honda, Yamaha, Suzuki
-- ============================================================
CREATE TABLE vehicle_makes (
    id              INT             NOT NULL AUTO_INCREMENT,
    name            VARCHAR(80)     NOT NULL,
    vehicle_type    ENUM('car','motorcycle','truck','ATV','other') NOT NULL DEFAULT 'car',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehicle_makes_name_type (name, vehicle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: vehicle_models
-- e.g., Civic, Fortuner, Mio, Beat
-- ============================================================
CREATE TABLE vehicle_models (
    id              INT             NOT NULL AUTO_INCREMENT,
    vehicle_make_id INT             NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_vehicle_models_make (vehicle_make_id),
    CONSTRAINT fk_vehicle_models_make
        FOREIGN KEY (vehicle_make_id) REFERENCES vehicle_makes (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: vehicle_years
-- Year ranges supported for a model
-- ============================================================
CREATE TABLE vehicle_years (
    id              INT             NOT NULL AUTO_INCREMENT,
    vehicle_model_id INT            NOT NULL,
    year            YEAR            NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehicle_year (vehicle_model_id, year),
    KEY idx_vehicle_years_model (vehicle_model_id),
    CONSTRAINT fk_vehicle_years_model
        FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.2 Product & Inventory Tables

```sql
-- ============================================================
-- TABLE: products
-- Core product catalog. One product = one item type.
-- Variants (color, spec) are in product_variants.
-- ============================================================
CREATE TABLE products (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    category_id     BIGINT          NOT NULL,
    brand_id        BIGINT          NULL,
    uom_id          SMALLINT        NOT NULL,
    tax_rate_id     SMALLINT        NOT NULL,
    sku             VARCHAR(80)     NOT NULL COMMENT 'Internal Stock Keeping Unit',
    name            VARCHAR(220)    NOT NULL,
    description     TEXT            NULL,
    short_desc      VARCHAR(400)    NULL,
    part_number     VARCHAR(100)    NULL COMMENT 'OEM or aftermarket part number',
    cost_price      DECIMAL(12,4)   NOT NULL DEFAULT 0.0000 COMMENT 'Default cost (overridden per variant)',
    selling_price   DECIMAL(12,4)   NOT NULL DEFAULT 0.0000 COMMENT 'Default retail price',
    wholesale_price DECIMAL(12,4)   NULL,
    min_selling_price DECIMAL(12,4) NULL COMMENT 'Floor price for discounting',
    is_taxable      TINYINT(1)      NOT NULL DEFAULT 1,
    is_serialized   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = track by serial number',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    weight_kg       DECIMAL(8,3)    NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_sku (sku),
    KEY idx_products_category (category_id),
    KEY idx_products_brand (brand_id),
    KEY idx_products_part_number (part_number),
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
-- A variant represents a specific saleable version of a product
-- (e.g., different OEM grade, color, or spec level).
-- Most motorparts have a single variant = the product itself.
-- ============================================================
CREATE TABLE product_variants (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    product_id      BIGINT          NOT NULL,
    variant_sku     VARCHAR(100)    NOT NULL COMMENT 'Unique per variant',
    variant_name    VARCHAR(200)    NULL COMMENT 'e.g., "Blue / Grade A"',
    attributes      JSON            NULL COMMENT 'Flexible: {"color":"blue","grade":"A"}',
    cost_price      DECIMAL(12,4)   NULL COMMENT 'NULL = inherit from product',
    selling_price   DECIMAL(12,4)   NULL COMMENT 'NULL = inherit from product',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_variants_sku (variant_sku),
    KEY idx_product_variants_product (product_id),
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: product_barcodes
-- A variant can have multiple barcodes (EAN-13, QR, custom)
-- ============================================================
CREATE TABLE product_barcodes (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    product_variant_id BIGINT       NOT NULL,
    barcode         VARCHAR(100)    NOT NULL,
    barcode_type    ENUM('EAN13','EAN8','UPC','QR','CODE128','custom') NOT NULL DEFAULT 'EAN13',
    is_primary      TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_barcodes_code (barcode),
    KEY idx_product_barcodes_variant (product_variant_id),
    CONSTRAINT fk_product_barcodes_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: product_vehicle_fitments
-- Many-to-many: which variants fit which vehicle/year
-- Critical for motorparts compatibility lookup
-- ============================================================
CREATE TABLE product_vehicle_fitments (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    product_id          BIGINT      NOT NULL,
    vehicle_year_id     INT         NOT NULL,
    fitment_notes       VARCHAR(400) NULL COMMENT 'e.g., "Fits MT variant only"',
    PRIMARY KEY (id),
    UNIQUE KEY uq_fitment (product_id, vehicle_year_id),
    KEY idx_fitment_product (product_id),
    KEY idx_fitment_vehicle_year (vehicle_year_id),
    CONSTRAINT fk_fitment_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fitment_vehicle_year
        FOREIGN KEY (vehicle_year_id) REFERENCES vehicle_years (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: warehouses
-- Represents physical locations: main store, bodega, branches
-- ============================================================
CREATE TABLE warehouses (
    id              INT             NOT NULL AUTO_INCREMENT,
    code            VARCHAR(20)     NOT NULL,
    name            VARCHAR(120)    NOT NULL,
    address         VARCHAR(400)    NULL,
    city            VARCHAR(100)    NULL,
    is_pos_location TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1 = has a POS terminal',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_warehouses_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: inventory_stock
-- Real-time stock quantity per variant per warehouse.
-- THIS IS THE CENTRAL TABLE for the POS-Inventory integration.
-- ============================================================
CREATE TABLE inventory_stock (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT      NOT NULL,
    warehouse_id        INT         NOT NULL,
    qty_on_hand         DECIMAL(12,4) NOT NULL DEFAULT 0 COMMENT 'Current physical stock',
    qty_reserved        DECIMAL(12,4) NOT NULL DEFAULT 0 COMMENT 'Reserved by pending orders',
    qty_available       DECIMAL(12,4) GENERATED ALWAYS AS (qty_on_hand - qty_reserved) VIRTUAL
                        COMMENT 'Computed: available to sell',
    reorder_point       DECIMAL(12,4) NOT NULL DEFAULT 0 COMMENT 'Trigger low-stock alert',
    reorder_qty         DECIMAL(12,4) NOT NULL DEFAULT 0 COMMENT 'Suggested PO quantity',
    max_stock_level     DECIMAL(12,4) NULL,
    avg_cost            DECIMAL(14,6) NOT NULL DEFAULT 0 COMMENT 'Weighted average cost',
    last_counted_at     TIMESTAMP   NULL COMMENT 'Last physical count date',
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_stock (product_variant_id, warehouse_id),
    KEY idx_inventory_stock_warehouse (warehouse_id),
    KEY idx_inventory_stock_low (qty_on_hand, reorder_point),
    CONSTRAINT fk_inventory_stock_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_stock_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inventory_stock_qty
        CHECK (qty_on_hand >= 0),
    CONSTRAINT chk_inventory_stock_reserved
        CHECK (qty_reserved >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: stock_movements
-- IMMUTABLE ledger of every inventory change event.
-- Source of truth for all stock tracking.
-- Every POS sale writes a row here.
-- ============================================================
CREATE TABLE stock_movements (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT      NOT NULL,
    warehouse_id        INT         NOT NULL,
    movement_type       ENUM(
        'sale',             -- deduction from POS sale
        'sale_return',      -- addition from POS return
        'purchase_receipt', -- addition from supplier PO
        'purchase_return',  -- deduction returned to supplier
        'adjustment_add',   -- manual stock add
        'adjustment_sub',   -- manual stock subtract
        'transfer_out',     -- sent to another warehouse
        'transfer_in',      -- received from another warehouse
        'opening_stock',    -- initial stock entry
        'damage_write_off', -- write off damaged goods
        'count_correction'  -- after physical inventory count
    ) NOT NULL,
    reference_type      ENUM(
        'sales_transaction',
        'sales_return',
        'purchase_order',
        'stock_adjustment',
        'stock_transfer',
        'manual'
    ) NOT NULL,
    reference_id        BIGINT      NOT NULL COMMENT 'FK to the originating record',
    qty_before          DECIMAL(12,4) NOT NULL,
    qty_change          DECIMAL(12,4) NOT NULL COMMENT 'Positive=in, Negative=out',
    qty_after           DECIMAL(12,4) NOT NULL,
    unit_cost           DECIMAL(14,6) NULL COMMENT 'Cost at time of movement',
    notes               TEXT        NULL,
    performed_by        BIGINT      NOT NULL COMMENT 'FK to users.id',
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_stock_movements_variant (product_variant_id),
    KEY idx_stock_movements_warehouse (warehouse_id),
    KEY idx_stock_movements_type (movement_type),
    KEY idx_stock_movements_ref (reference_type, reference_id),
    KEY idx_stock_movements_date (created_at),
    CONSTRAINT fk_stock_movements_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_stock_movements_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: stock_adjustments
-- Header record for manual stock adjustments (used by stock_movements)
-- ============================================================
CREATE TABLE stock_adjustments (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    warehouse_id    INT             NOT NULL,
    reason          ENUM('count_correction','damage','expiry','theft','system_error','other') NOT NULL,
    notes           TEXT            NULL,
    status          ENUM('draft','approved','posted') NOT NULL DEFAULT 'draft',
    approved_by     BIGINT          NULL,
    approved_at     TIMESTAMP       NULL,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_stock_adj_warehouse (warehouse_id),
    CONSTRAINT fk_stock_adj_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
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
    tax_id          VARCHAR(50)     NULL COMMENT 'TIN or BIR number',
    payment_terms   SMALLINT        NOT NULL DEFAULT 0 COMMENT 'Net days',
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
-- Supplier-specific pricing and lead time per product variant
-- ============================================================
CREATE TABLE supplier_products (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    supplier_id         BIGINT      NOT NULL,
    product_variant_id  BIGINT      NOT NULL,
    supplier_sku        VARCHAR(80) NULL COMMENT 'Supplier\'s own SKU',
    unit_cost           DECIMAL(12,4) NOT NULL,
    min_order_qty       DECIMAL(10,4) NOT NULL DEFAULT 1,
    lead_time_days      SMALLINT    NULL,
    is_preferred        TINYINT(1)  NOT NULL DEFAULT 0,
    is_active           TINYINT(1)  NOT NULL DEFAULT 1,
    effective_date      DATE        NOT NULL,
    expiry_date         DATE        NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_supplier_product (supplier_id, product_variant_id, effective_date),
    KEY idx_supplier_products_variant (product_variant_id),
    CONSTRAINT fk_supplier_products_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_supplier_products_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: purchase_orders
-- ============================================================
CREATE TABLE purchase_orders (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    po_number       VARCHAR(30)     NOT NULL,
    supplier_id     BIGINT          NOT NULL,
    warehouse_id    INT             NOT NULL,
    status          ENUM('draft','sent','partially_received','received','cancelled') NOT NULL DEFAULT 'draft',
    order_date      DATE            NOT NULL,
    expected_date   DATE            NULL,
    received_date   DATE            NULL,
    subtotal        DECIMAL(14,4)   NOT NULL DEFAULT 0,
    tax_amount      DECIMAL(14,4)   NOT NULL DEFAULT 0,
    shipping_cost   DECIMAL(14,4)   NOT NULL DEFAULT 0,
    total_amount    DECIMAL(14,4)   NOT NULL DEFAULT 0,
    notes           TEXT            NULL,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_purchase_orders_number (po_number),
    KEY idx_purchase_orders_supplier (supplier_id),
    KEY idx_purchase_orders_warehouse (warehouse_id),
    KEY idx_purchase_orders_status (status),
    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_po_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: purchase_order_items
-- ============================================================
CREATE TABLE purchase_order_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    purchase_order_id   BIGINT      NOT NULL,
    product_variant_id  BIGINT      NOT NULL,
    qty_ordered         DECIMAL(12,4) NOT NULL,
    qty_received        DECIMAL(12,4) NOT NULL DEFAULT 0,
    unit_cost           DECIMAL(12,4) NOT NULL,
    line_total          DECIMAL(14,4) NOT NULL,
    notes               VARCHAR(300) NULL,
    PRIMARY KEY (id),
    KEY idx_poi_po (purchase_order_id),
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
-- TABLE: pos_terminals
-- One terminal per POS station/computer
-- ============================================================
CREATE TABLE pos_terminals (
    id              INT             NOT NULL AUTO_INCREMENT,
    warehouse_id    INT             NOT NULL,
    terminal_code   VARCHAR(20)     NOT NULL,
    name            VARCHAR(80)     NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pos_terminals_code (terminal_code),
    KEY idx_pos_terminals_warehouse (warehouse_id),
    CONSTRAINT fk_pos_terminals_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: cash_sessions
-- Represents an open/close shift for a POS terminal.
-- All sales must belong to an open session.
-- ============================================================
CREATE TABLE cash_sessions (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    pos_terminal_id INT             NOT NULL,
    cashier_id      BIGINT          NOT NULL,
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
    KEY idx_cash_sessions_terminal (pos_terminal_id),
    KEY idx_cash_sessions_cashier (cashier_id),
    KEY idx_cash_sessions_status (status),
    CONSTRAINT fk_cash_sessions_terminal
        FOREIGN KEY (pos_terminal_id) REFERENCES pos_terminals (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: discounts
-- Pre-configured discounts/promotions
-- ============================================================
CREATE TABLE discounts (
    id              INT             NOT NULL AUTO_INCREMENT,
    code            VARCHAR(30)     NOT NULL,
    name            VARCHAR(120)    NOT NULL,
    type            ENUM('percentage','fixed_amount','buy_x_get_y') NOT NULL,
    value           DECIMAL(10,4)   NOT NULL COMMENT 'Percentage (0-100) or fixed amount',
    applies_to      ENUM('transaction','item','category','product') NOT NULL DEFAULT 'transaction',
    target_id       BIGINT          NULL COMMENT 'FK to category or product if applies_to requires',
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
-- Header for every completed or voided POS transaction.
-- This is the MASTER TABLE for the POS-Inventory integration.
-- ============================================================
CREATE TABLE sales_transactions (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    transaction_number  VARCHAR(30) NOT NULL COMMENT 'Human-readable: TXN-20240101-0001',
    cash_session_id     BIGINT      NOT NULL,
    pos_terminal_id     INT         NOT NULL,
    warehouse_id        INT         NOT NULL COMMENT 'Source warehouse for stock deduction',
    customer_id         BIGINT      NULL COMMENT 'NULL = walk-in customer',
    cashier_id          BIGINT      NOT NULL,
    status              ENUM('pending','completed','voided','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
    transaction_date    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal            DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT 'Before tax & discount',
    discount_amount     DECIMAL(14,4) NOT NULL DEFAULT 0,
    taxable_amount      DECIMAL(14,4) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(14,4) NOT NULL DEFAULT 0,
    total_amount        DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT 'Final amount due',
    amount_tendered     DECIMAL(14,4) NOT NULL DEFAULT 0,
    change_given        DECIMAL(14,4) NOT NULL DEFAULT 0,
    discount_id         INT         NULL,
    notes               TEXT        NULL,
    voided_at           TIMESTAMP   NULL,
    voided_by           BIGINT      NULL,
    void_reason         VARCHAR(300) NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_txn_number (transaction_number),
    KEY idx_sales_txn_session (cash_session_id),
    KEY idx_sales_txn_warehouse (warehouse_id),
    KEY idx_sales_txn_customer (customer_id),
    KEY idx_sales_txn_date (transaction_date),
    KEY idx_sales_txn_status (status),
    CONSTRAINT fk_sales_txn_session
        FOREIGN KEY (cash_session_id) REFERENCES cash_sessions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sales_txn_terminal
        FOREIGN KEY (pos_terminal_id) REFERENCES pos_terminals (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sales_txn_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sales_txn_discount
        FOREIGN KEY (discount_id) REFERENCES discounts (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: sales_transaction_items
-- Line items for each sale. Each row = one product sold.
-- The TRIGGER on this table drives inventory deduction.
-- ============================================================
CREATE TABLE sales_transaction_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    sales_transaction_id BIGINT     NOT NULL,
    product_variant_id  BIGINT      NOT NULL,
    qty                 DECIMAL(12,4) NOT NULL,
    unit_price          DECIMAL(12,4) NOT NULL COMMENT 'Price at time of sale',
    unit_cost           DECIMAL(12,4) NOT NULL COMMENT 'Cost at time of sale (for margin reporting)',
    discount_amount     DECIMAL(12,4) NOT NULL DEFAULT 0 COMMENT 'Per-item discount',
    tax_amount          DECIMAL(12,4) NOT NULL DEFAULT 0,
    line_total          DECIMAL(14,4) NOT NULL COMMENT '(unit_price - discount) * qty',
    serial_number       VARCHAR(100) NULL COMMENT 'For serialized items',
    notes               VARCHAR(300) NULL,
    PRIMARY KEY (id),
    KEY idx_sti_transaction (sales_transaction_id),
    KEY idx_sti_variant (product_variant_id),
    CONSTRAINT fk_sti_transaction
        FOREIGN KEY (sales_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sti_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sti_qty CHECK (qty > 0),
    CONSTRAINT chk_sti_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: payment_methods
-- ============================================================
CREATE TABLE payment_methods (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    code            VARCHAR(20)     NOT NULL,
    name            VARCHAR(80)     NOT NULL,
    type            ENUM('cash','card','ewallet','bank_transfer','credit','check','other') NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_methods_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: transaction_payments
-- Supports split payment (e.g., part cash + part e-wallet)
-- ============================================================
CREATE TABLE transaction_payments (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    sales_transaction_id    BIGINT      NOT NULL,
    payment_method_id       SMALLINT    NOT NULL,
    amount                  DECIMAL(14,4) NOT NULL,
    reference_number        VARCHAR(100) NULL COMMENT 'Card approval, GCash ref, etc.',
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
-- Returns linked to original transactions
-- ============================================================
CREATE TABLE sales_returns (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    return_number           VARCHAR(30) NOT NULL,
    original_transaction_id BIGINT      NOT NULL,
    warehouse_id            INT         NOT NULL,
    cashier_id              BIGINT      NOT NULL,
    reason                  ENUM('defective','wrong_item','customer_changed_mind','other') NOT NULL,
    notes                   TEXT        NULL,
    refund_method_id        SMALLINT    NULL,
    refund_amount           DECIMAL(14,4) NOT NULL DEFAULT 0,
    status                  ENUM('pending','approved','completed','rejected') NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_returns_number (return_number),
    KEY idx_sales_returns_txn (original_transaction_id),
    CONSTRAINT fk_sales_returns_txn
        FOREIGN KEY (original_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sales_returns_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: sales_return_items
-- ============================================================
CREATE TABLE sales_return_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    sales_return_id     BIGINT      NOT NULL,
    sales_txn_item_id   BIGINT      NOT NULL COMMENT 'Original line item being returned',
    product_variant_id  BIGINT      NOT NULL,
    qty_returned        DECIMAL(12,4) NOT NULL,
    unit_price          DECIMAL(12,4) NOT NULL,
    restock             TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '1 = add back to inventory',
    PRIMARY KEY (id),
    KEY idx_sri_return (sales_return_id),
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

### 4.5 Invoice Tables

Invoices are generated from completed `sales_transactions`. An invoice is a formal billing document tied to a transaction, supporting both printed receipts and official sales invoices (e.g., BIR-compliant OR/SI in the Philippines).

```sql
-- ============================================================
-- TABLE: invoice_sequences
-- Controls auto-incrementing invoice number per series/branch.
-- Supports BIR-accredited series (e.g., SI-2024-0001).
-- ============================================================
CREATE TABLE invoice_sequences (
    id              INT             NOT NULL AUTO_INCREMENT,
    warehouse_id    INT             NOT NULL,
    series_code     VARCHAR(20)     NOT NULL COMMENT 'e.g., SI, OR, DR',
    series_label    VARCHAR(60)     NOT NULL COMMENT 'e.g., Sales Invoice, Official Receipt',
    prefix          VARCHAR(20)     NULL COMMENT 'e.g., SI-2024-',
    current_number  BIGINT          NOT NULL DEFAULT 0,
    zero_pad        TINYINT         NOT NULL DEFAULT 6 COMMENT 'Pad to N digits: 000001',
    start_number    BIGINT          NOT NULL DEFAULT 1,
    end_number      BIGINT          NULL COMMENT 'BIR authority limit; NULL = no limit',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoice_seq (warehouse_id, series_code),
    CONSTRAINT fk_invoice_seq_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: invoices
-- One invoice per completed sales_transaction.
-- An invoice is auto-generated when a transaction is completed.
-- ============================================================
CREATE TABLE invoices (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    invoice_number          VARCHAR(50) NOT NULL COMMENT 'e.g., SI-2024-000001',
    invoice_type            ENUM('sales_invoice','official_receipt','delivery_receipt','quotation') NOT NULL DEFAULT 'sales_invoice',
    invoice_sequence_id     INT         NOT NULL,
    sales_transaction_id    BIGINT      NOT NULL,
    warehouse_id            INT         NOT NULL,
    customer_id             BIGINT      NULL,

    -- Buyer snapshot (copied at invoice time; customer details may change later)
    buyer_name              VARCHAR(200) NOT NULL DEFAULT 'Walk-in Customer',
    buyer_address           TEXT        NULL,
    buyer_tin               VARCHAR(50) NULL COMMENT 'Tax Identification Number',
    buyer_email             VARCHAR(200) NULL,
    buyer_phone             VARCHAR(30) NULL,

    -- Seller / business details snapshot
    seller_name             VARCHAR(200) NOT NULL,
    seller_address          TEXT        NOT NULL,
    seller_tin              VARCHAR(50) NULL,
    seller_phone            VARCHAR(30) NULL,

    -- Amounts (mirrored from transaction for self-contained printing)
    subtotal                DECIMAL(14,4) NOT NULL DEFAULT 0,
    discount_amount         DECIMAL(14,4) NOT NULL DEFAULT 0,
    taxable_amount          DECIMAL(14,4) NOT NULL DEFAULT 0,
    vat_exempt_amount       DECIMAL(14,4) NOT NULL DEFAULT 0,
    zero_rated_amount       DECIMAL(14,4) NOT NULL DEFAULT 0,
    tax_amount              DECIMAL(14,4) NOT NULL DEFAULT 0,
    total_amount            DECIMAL(14,4) NOT NULL DEFAULT 0,
    amount_paid             DECIMAL(14,4) NOT NULL DEFAULT 0,
    change_given            DECIMAL(14,4) NOT NULL DEFAULT 0,
    balance_due             DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT 'For credit sales',

    -- Status & control
    status                  ENUM('draft','issued','sent','void') NOT NULL DEFAULT 'issued',
    payment_status          ENUM('unpaid','partially_paid','paid','overpaid') NOT NULL DEFAULT 'paid',
    issued_at               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date                DATE        NULL COMMENT 'For credit terms',
    voided_at               TIMESTAMP   NULL,
    voided_by               BIGINT      NULL,
    void_reason             VARCHAR(300) NULL,
    notes                   TEXT        NULL,
    printed_count           SMALLINT    NOT NULL DEFAULT 0,
    last_printed_at         TIMESTAMP   NULL,

    created_by              BIGINT      NOT NULL,
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_number (invoice_number),
    UNIQUE KEY uq_invoices_transaction (sales_transaction_id),
    KEY idx_invoices_warehouse (warehouse_id),
    KEY idx_invoices_customer (customer_id),
    KEY idx_invoices_issued_at (issued_at),
    KEY idx_invoices_status (status, payment_status),
    CONSTRAINT fk_invoices_sequence
        FOREIGN KEY (invoice_sequence_id) REFERENCES invoice_sequences (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_invoices_transaction
        FOREIGN KEY (sales_transaction_id) REFERENCES sales_transactions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_invoices_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_invoices_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: invoice_items
-- Snapshot of line items at the moment the invoice was issued.
-- Decoupled from sales_transaction_items so that post-sale edits
-- to products do NOT alter the printed invoice content.
-- ============================================================
CREATE TABLE invoice_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    invoice_id          BIGINT      NOT NULL,
    line_number         SMALLINT    NOT NULL COMMENT 'Print order (1,2,3...)',
    product_variant_id  BIGINT      NULL COMMENT 'NULL = free-text line item',
    sku                 VARCHAR(100) NOT NULL COMMENT 'Snapshot of SKU at time of sale',
    description         VARCHAR(400) NOT NULL COMMENT 'Snapshot of product name',
    unit_of_measure     VARCHAR(20) NOT NULL DEFAULT 'pcs',
    qty                 DECIMAL(12,4) NOT NULL,
    unit_price          DECIMAL(12,4) NOT NULL,
    discount_amount     DECIMAL(12,4) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12,4) NOT NULL DEFAULT 0,
    line_total          DECIMAL(14,4) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_invoice_items_invoice (invoice_id),
    KEY idx_invoice_items_variant (product_variant_id),
    CONSTRAINT fk_invoice_items_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_invoice_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_invoice_items_qty CHECK (qty > 0),
    CONSTRAINT chk_invoice_items_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: invoice_payments
-- Payment breakdown on the invoice (mirrors transaction_payments).
-- Supports split payments display on printed invoice.
-- ============================================================
CREATE TABLE invoice_payments (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    invoice_id          BIGINT      NOT NULL,
    payment_method_id   SMALLINT    NOT NULL,
    payment_method_name VARCHAR(80) NOT NULL COMMENT 'Snapshot of method name',
    amount              DECIMAL(14,4) NOT NULL,
    reference_number    VARCHAR(100) NULL,
    paid_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_invoice_payments_invoice (invoice_id),
    CONSTRAINT fk_invoice_payments_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_invoice_payments_method
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_invoice_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: business_profile
-- Stores the shop's own details used on invoice headers.
-- Single-row table (or one row per warehouse/branch).
-- ============================================================
CREATE TABLE business_profile (
    id              INT             NOT NULL AUTO_INCREMENT,
    warehouse_id    INT             NULL COMMENT 'NULL = global/default profile',
    business_name   VARCHAR(200)    NOT NULL,
    tagline         VARCHAR(300)    NULL,
    address_line1   VARCHAR(200)    NOT NULL,
    address_line2   VARCHAR(200)    NULL,
    city            VARCHAR(100)    NOT NULL,
    province        VARCHAR(100)    NULL,
    zip_code        VARCHAR(20)     NULL,
    phone           VARCHAR(30)     NULL,
    mobile          VARCHAR(30)     NULL,
    email           VARCHAR(200)    NULL,
    website         VARCHAR(200)    NULL,
    tin             VARCHAR(50)     NULL COMMENT 'BIR Tax Identification Number',
    bir_accreditation_no VARCHAR(100) NULL COMMENT 'BIR accreditation for OR/SI',
    logo_url        VARCHAR(512)    NULL,
    invoice_footer  TEXT            NULL COMMENT 'Printed at bottom of every invoice',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_business_profile_warehouse (warehouse_id),
    CONSTRAINT fk_business_profile_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Stored Procedure: Auto-Generate Invoice on Sale Completion

```sql
-- ============================================================
-- PROCEDURE: sp_generate_invoice
-- Called after sp_complete_sale to create the invoice record.
-- Copies all line items and payment info into invoice tables
-- as a permanent, printable snapshot.
-- ============================================================
DELIMITER $$

CREATE PROCEDURE sp_generate_invoice(
    IN  p_transaction_id    BIGINT,
    IN  p_invoice_type      VARCHAR(30),
    IN  p_created_by        BIGINT,
    OUT p_invoice_id        BIGINT,
    OUT p_invoice_number    VARCHAR(50)
)
BEGIN
    DECLARE v_warehouse_id      INT;
    DECLARE v_seq_id            INT;
    DECLARE v_next_num          BIGINT;
    DECLARE v_prefix            VARCHAR(20);
    DECLARE v_pad               TINYINT;
    DECLARE v_formatted_number  VARCHAR(50);

    -- Get transaction's warehouse
    SELECT warehouse_id INTO v_warehouse_id
    FROM   sales_transactions WHERE id = p_transaction_id;

    -- Lock and increment the invoice sequence
    SELECT id, current_number + 1, prefix, zero_pad
    INTO   v_seq_id, v_next_num, v_prefix, v_pad
    FROM   invoice_sequences
    WHERE  warehouse_id = v_warehouse_id
    AND    series_code  = CASE p_invoice_type
                            WHEN 'official_receipt' THEN 'OR'
                            WHEN 'delivery_receipt' THEN 'DR'
                            ELSE 'SI'
                          END
    AND    is_active = 1
    FOR UPDATE;

    UPDATE invoice_sequences
    SET    current_number = v_next_num
    WHERE  id = v_seq_id;

    -- Format: SI-2024-000001
    SET v_formatted_number = CONCAT(
        COALESCE(v_prefix, ''),
        LPAD(v_next_num, v_pad, '0')
    );

    -- Insert invoice header (snapshot from transaction)
    INSERT INTO invoices (
        invoice_number, invoice_type, invoice_sequence_id,
        sales_transaction_id, warehouse_id, customer_id,
        buyer_name, buyer_address, buyer_tin, buyer_email, buyer_phone,
        seller_name, seller_address, seller_tin, seller_phone,
        subtotal, discount_amount, taxable_amount,
        tax_amount, total_amount, amount_paid, change_given,
        status, payment_status, created_by
    )
    SELECT
        v_formatted_number,
        p_invoice_type,
        v_seq_id,
        st.id,
        st.warehouse_id,
        st.customer_id,
        COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'Walk-in Customer'),
        NULL, NULL,
        c.email, c.phone,
        bp.business_name, bp.address_line1, bp.tin, bp.phone,
        st.subtotal, st.discount_amount, st.taxable_amount,
        st.tax_amount, st.total_amount, st.amount_tendered, st.change_given,
        'issued',
        'paid',
        p_created_by
    FROM  sales_transactions st
    LEFT JOIN customers c    ON c.id = st.customer_id
    LEFT JOIN business_profile bp ON bp.warehouse_id = st.warehouse_id
    WHERE st.id = p_transaction_id;

    SET p_invoice_id = LAST_INSERT_ID();
    SET p_invoice_number = v_formatted_number;

    -- Copy line items as snapshot
    INSERT INTO invoice_items (
        invoice_id, line_number, product_variant_id,
        sku, description, unit_of_measure,
        qty, unit_price, discount_amount, tax_amount, line_total
    )
    SELECT
        p_invoice_id,
        ROW_NUMBER() OVER (ORDER BY sti.id),
        sti.product_variant_id,
        pv.variant_sku,
        p.name,
        uom.code,
        sti.qty, sti.unit_price, sti.discount_amount, sti.tax_amount, sti.line_total
    FROM  sales_transaction_items sti
    JOIN  product_variants pv ON pv.id = sti.product_variant_id
    JOIN  products p          ON p.id  = pv.product_id
    JOIN  units_of_measure uom ON uom.id = p.uom_id
    WHERE sti.sales_transaction_id = p_transaction_id;

    -- Copy payment records
    INSERT INTO invoice_payments (
        invoice_id, payment_method_id, payment_method_name, amount, reference_number
    )
    SELECT
        p_invoice_id,
        tp.payment_method_id,
        pm.name,
        tp.amount,
        tp.reference_number
    FROM  transaction_payments tp
    JOIN  payment_methods pm ON pm.id = tp.payment_method_id
    WHERE tp.sales_transaction_id = p_transaction_id;

END$$

DELIMITER ;
```

---

### 4.6 Customer Management Tables

```sql
-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE customers (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    code            VARCHAR(20)     NOT NULL,
    first_name      VARCHAR(80)     NOT NULL,
    last_name       VARCHAR(80)     NOT NULL,
    email           VARCHAR(200)    NULL,
    phone           VARCHAR(30)     NULL,
    customer_type   ENUM('retail','wholesale','corporate') NOT NULL DEFAULT 'retail',
    credit_limit    DECIMAL(14,2)   NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_customers_code (code),
    KEY idx_customers_phone (phone),
    KEY idx_customers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


```

---

### 4.7 User & Access Control Tables

```sql
-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE roles (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    name            VARCHAR(50)     NOT NULL,
    description     VARCHAR(200)    NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: permissions
-- ============================================================
CREATE TABLE permissions (
    id              INT             NOT NULL AUTO_INCREMENT,
    module          VARCHAR(50)     NOT NULL COMMENT 'e.g., inventory, pos, reports',
    action          VARCHAR(50)     NOT NULL COMMENT 'e.g., read, write, delete, approve',
    PRIMARY KEY (id),
    UNIQUE KEY uq_permissions (module, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: role_permissions
-- ============================================================
CREATE TABLE role_permissions (
    role_id         SMALLINT        NOT NULL,
    permission_id   INT             NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(60)     NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash',
    first_name      VARCHAR(80)     NOT NULL,
    last_name       VARCHAR(80)     NOT NULL,
    email           VARCHAR(200)    NOT NULL,
    phone           VARCHAR(30)     NULL,
    pin_hash        VARCHAR(255)    NULL COMMENT 'POS quick PIN hash',
    warehouse_id    INT             NULL COMMENT 'Primary assigned warehouse',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    last_login_at   TIMESTAMP       NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: user_roles
-- ============================================================
CREATE TABLE user_roles (
    user_id         BIGINT          NOT NULL,
    role_id         SMALLINT        NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.8 Audit & Logging Tables

```sql
-- ============================================================
-- TABLE: audit_log
-- Tracks who changed what and when across the system
-- ============================================================
CREATE TABLE audit_log (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NULL,
    table_name      VARCHAR(80)     NOT NULL,
    record_id       BIGINT          NOT NULL,
    action          ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    old_values      JSON            NULL,
    new_values      JSON            NULL,
    ip_address      VARCHAR(45)     NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_log_table_record (table_name, record_id),
    KEY idx_audit_log_user (user_id),
    KEY idx_audit_log_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE: error_log
-- Application and integration error tracking
-- ============================================================
CREATE TABLE error_log (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    error_code      VARCHAR(30)     NULL,
    message         TEXT            NOT NULL,
    context         JSON            NULL,
    user_id         BIGINT          NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_error_log_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.9 Pricing & Analytics Tables

These tables support retail price history tracking, supplier cost trend monitoring, customer price tiers (walk-in, wholesale, dealer, bulk quantity breaks), and the computed margin/markup columns added to `product_variants`.

```sql
-- ============================================================
-- TABLE: product_price_history
-- Immutable audit log of every retail selling-price change.
-- Populated automatically by TRIGGER trg_pv_price_history.
-- ============================================================
CREATE TABLE product_price_history (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT          NOT NULL,
    old_price           DECIMAL(12,4)   NOT NULL COMMENT 'Price before change',
    new_price           DECIMAL(12,4)   NOT NULL COMMENT 'Price after change',
    changed_by          BIGINT          NOT NULL COMMENT 'FK → users.id',
    change_reason       VARCHAR(300)    NULL      COMMENT 'Optional note (promo, cost-push, etc.)',
    effective_date      DATE            NOT NULL  COMMENT 'Date the new price takes effect',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pph_variant        (product_variant_id),
    KEY idx_pph_effective_date (effective_date),
    CONSTRAINT fk_pph_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Immutable audit log of every retail selling-price change per variant.';


-- ============================================================
-- TABLE: supplier_cost_history
-- Immutable audit log of every supplier unit-cost change.
-- Populated automatically by TRIGGER trg_sp_cost_history.
-- cost_change_pct is a stored generated column: positive = cost increase.
-- ============================================================
CREATE TABLE supplier_cost_history (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    supplier_product_id BIGINT          NOT NULL COMMENT 'FK → supplier_products.id',
    supplier_id         BIGINT          NOT NULL,
    product_variant_id  BIGINT          NOT NULL,
    old_unit_cost       DECIMAL(12,4)   NOT NULL,
    new_unit_cost       DECIMAL(12,4)   NOT NULL,
    cost_change_pct     DECIMAL(8,4)    GENERATED ALWAYS AS (
                            ROUND(((new_unit_cost - old_unit_cost) / NULLIF(old_unit_cost, 0)) * 100, 4)
                        ) STORED
                        COMMENT 'Computed % change; positive = cost increase',
    changed_by          BIGINT          NOT NULL COMMENT 'FK → users.id',
    change_reason       VARCHAR(300)    NULL,
    effective_date      DATE            NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sch_supplier_product (supplier_product_id),
    KEY idx_sch_supplier         (supplier_id),
    KEY idx_sch_variant          (product_variant_id),
    KEY idx_sch_effective_date   (effective_date),
    CONSTRAINT fk_sch_supplier_product
        FOREIGN KEY (supplier_product_id) REFERENCES supplier_products (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sch_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sch_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Immutable audit log of every supplier unit-cost change.';


-- ============================================================
-- TABLE: price_tiers
-- Named customer-type tiers. Seeded with 4 default tiers.
-- ============================================================
CREATE TABLE price_tiers (
    id              SMALLINT        NOT NULL AUTO_INCREMENT,
    code            VARCHAR(30)     NOT NULL COMMENT 'e.g., WALK_IN, WHOLESALE, DEALER, BULK',
    name            VARCHAR(80)     NOT NULL COMMENT 'Human label',
    description     VARCHAR(300)    NULL,
    priority        TINYINT         NOT NULL DEFAULT 0
                    COMMENT 'Lower = applied first when multiple tiers match',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_price_tiers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Named customer pricing tiers (walk-in, wholesale, dealer, bulk).';

-- Seed default tiers
INSERT INTO price_tiers (code, name, description, priority) VALUES
  ('WALK_IN',   'Walk-in / Retail',  'Standard retail price for walk-in customers',         1),
  ('WHOLESALE', 'Wholesale',         'Bulk distributor price for wholesale accounts',        2),
  ('DEALER',    'Dealer',            'Authorized dealer/reseller discounted price',          3),
  ('BULK',      'Bulk Quantity',     'Quantity-break price applied when min_qty is reached', 4);


-- ============================================================
-- TABLE: product_price_tier_rules
-- Per-variant price per tier, with optional quantity-break support.
-- NULL min_qty = tier price applies regardless of qty ordered.
-- ============================================================
CREATE TABLE product_price_tier_rules (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    product_variant_id  BIGINT          NOT NULL,
    price_tier_id       SMALLINT        NOT NULL,
    min_qty             DECIMAL(12,4)   NULL
                        COMMENT 'Minimum qty to activate this price; NULL = no minimum',
    tier_price          DECIMAL(12,4)   NOT NULL COMMENT 'Price for this tier',
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    effective_date      DATE            NOT NULL,
    expiry_date         DATE            NULL,
    created_by          BIGINT          NOT NULL COMMENT 'FK → users.id',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pptr_variant_tier_qty_eff (product_variant_id, price_tier_id, min_qty, effective_date),
    KEY idx_pptr_variant    (product_variant_id),
    KEY idx_pptr_tier       (price_tier_id),
    CONSTRAINT fk_pptr_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pptr_tier
        FOREIGN KEY (price_tier_id) REFERENCES price_tiers (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pptr_price
        CHECK (tier_price >= 0),
    CONSTRAINT chk_pptr_min_qty
        CHECK (min_qty IS NULL OR min_qty > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Tier-based and quantity-break prices per product variant.';


-- ============================================================
-- ALTER: product_variants — Add stored margin & markup columns
-- margin_pct = (sell - cost) / sell * 100
-- markup_pct = (sell - cost) / cost * 100
-- Both auto-update when cost_price or selling_price changes.
-- ============================================================
ALTER TABLE product_variants
    ADD COLUMN margin_pct   DECIMAL(8,4)    GENERATED ALWAYS AS (
        CASE
            WHEN COALESCE(selling_price, 0) > 0
            THEN ROUND(
                    ((COALESCE(selling_price, 0) - COALESCE(cost_price, 0))
                      / COALESCE(selling_price, 0)) * 100
                 , 4)
            ELSE NULL
        END
    ) STORED
    COMMENT 'Gross margin %: (sell - cost) / sell * 100',

    ADD COLUMN markup_pct   DECIMAL(8,4)    GENERATED ALWAYS AS (
        CASE
            WHEN COALESCE(cost_price, 0) > 0
            THEN ROUND(
                    ((COALESCE(selling_price, 0) - COALESCE(cost_price, 0))
                      / COALESCE(cost_price, 0)) * 100
                 , 4)
            ELSE NULL
        END
    ) STORED
    COMMENT 'Markup %: (sell - cost) / cost * 100';

ALTER TABLE product_variants
    ADD KEY idx_pv_margin_pct (margin_pct);
```

---

## 5. Inventory-POS Integration Logic

This section describes the **critical integration mechanism** — the heart of the system ensuring that every POS sale automatically deducts inventory in an ACID-compliant transaction.

### Integration Flow Diagram

```
CASHIER scans items at POS
         │
         ▼
 sales_transactions (INSERT, status='pending')
         │
         ▼
 sales_transaction_items (INSERT each line)
         │
         ├──► TRIGGER: trg_sti_after_insert FIRES for each item
         │         │
         │         ├── 1. Lock inventory_stock row (SELECT ... FOR UPDATE)
         │         ├── 2. Check qty_available >= qty sold
         │         ├── 3. UPDATE inventory_stock: qty_on_hand -= qty
         │         └── 4. INSERT stock_movements (movement_type='sale')
         │
         ▼
 sales_transactions UPDATE status='completed'
         │
         ▼
 transaction_payments (INSERT payment records)
         │
         ▼
 sp_generate_invoice() ──► invoices (header snapshot)
         │                ──► invoice_items (line snapshots)
         │                ──► invoice_payments (payment snapshot)
         ▼
 Invoice ready for printing / PDF export
```

### TRIGGER: Inventory Deduction on Sale

```sql
-- ============================================================
-- TRIGGER: trg_sti_after_insert
-- Fires AFTER each sales_transaction_item row is inserted.
-- Deducts qty from inventory_stock and records the movement.
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_sti_after_insert
AFTER INSERT ON sales_transaction_items
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id      INT;
    DECLARE v_qty_before        DECIMAL(12,4);
    DECLARE v_qty_after         DECIMAL(12,4);
    DECLARE v_avg_cost          DECIMAL(14,6);
    DECLARE v_cashier_id        BIGINT;

    -- Retrieve the warehouse and cashier from the parent transaction
    SELECT warehouse_id, cashier_id
    INTO   v_warehouse_id, v_cashier_id
    FROM   sales_transactions
    WHERE  id = NEW.sales_transaction_id;

    -- Lock and read current stock (pessimistic lock)
    SELECT qty_on_hand, avg_cost
    INTO   v_qty_before, v_avg_cost
    FROM   inventory_stock
    WHERE  product_variant_id = NEW.product_variant_id
    AND    warehouse_id = v_warehouse_id
    FOR UPDATE;

    -- Guard: prevent sale if stock is insufficient
    IF v_qty_before < NEW.qty THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock for product variant';
    END IF;

    SET v_qty_after = v_qty_before - NEW.qty;

    -- Deduct from inventory_stock
    UPDATE inventory_stock
    SET    qty_on_hand = v_qty_after,
           updated_at  = CURRENT_TIMESTAMP
    WHERE  product_variant_id = NEW.product_variant_id
    AND    warehouse_id = v_warehouse_id;

    -- Record the movement in the immutable ledger
    INSERT INTO stock_movements (
        product_variant_id,
        warehouse_id,
        movement_type,
        reference_type,
        reference_id,
        qty_before,
        qty_change,
        qty_after,
        unit_cost,
        performed_by,
        created_at
    ) VALUES (
        NEW.product_variant_id,
        v_warehouse_id,
        'sale',
        'sales_transaction',
        NEW.sales_transaction_id,
        v_qty_before,
        -NEW.qty,        -- Negative = stock out
        v_qty_after,
        NEW.unit_cost,
        v_cashier_id,
        CURRENT_TIMESTAMP
    );
END$$

DELIMITER ;
```

### TRIGGER: Inventory Restoration on Return

```sql
DELIMITER $$

CREATE TRIGGER trg_sri_after_insert
AFTER INSERT ON sales_return_items
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id  INT;
    DECLARE v_qty_before    DECIMAL(12,4);
    DECLARE v_qty_after     DECIMAL(12,4);
    DECLARE v_cashier_id    BIGINT;

    -- Only restock if flagged
    IF NEW.restock = 1 THEN

        SELECT sr.warehouse_id, sr.cashier_id
        INTO   v_warehouse_id, v_cashier_id
        FROM   sales_returns sr
        WHERE  sr.id = NEW.sales_return_id;

        SELECT qty_on_hand INTO v_qty_before
        FROM   inventory_stock
        WHERE  product_variant_id = NEW.product_variant_id
        AND    warehouse_id = v_warehouse_id
        FOR UPDATE;

        SET v_qty_after = v_qty_before + NEW.qty_returned;

        UPDATE inventory_stock
        SET    qty_on_hand = v_qty_after,
               updated_at  = CURRENT_TIMESTAMP
        WHERE  product_variant_id = NEW.product_variant_id
        AND    warehouse_id = v_warehouse_id;

        INSERT INTO stock_movements (
            product_variant_id, warehouse_id,
            movement_type, reference_type, reference_id,
            qty_before, qty_change, qty_after,
            unit_cost, performed_by
        ) VALUES (
            NEW.product_variant_id, v_warehouse_id,
            'sale_return', 'sales_return', NEW.sales_return_id,
            v_qty_before, NEW.qty_returned, v_qty_after,
            NEW.unit_price, v_cashier_id
        );

    END IF;
END$$

DELIMITER ;
```

### TRIGGER: Inventory Addition on PO Receipt

```sql
DELIMITER $$

CREATE TRIGGER trg_poi_after_update
AFTER UPDATE ON purchase_order_items
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id  INT;
    DECLARE v_qty_before    DECIMAL(12,4);
    DECLARE v_qty_received  DECIMAL(12,4);
    DECLARE v_qty_after     DECIMAL(12,4);
    DECLARE v_new_avg_cost  DECIMAL(14,6);

    SET v_qty_received = NEW.qty_received - OLD.qty_received;

    IF v_qty_received > 0 THEN

        SELECT warehouse_id INTO v_warehouse_id
        FROM   purchase_orders
        WHERE  id = NEW.purchase_order_id;

        SELECT qty_on_hand, avg_cost INTO v_qty_before, @old_avg_cost
        FROM   inventory_stock
        WHERE  product_variant_id = NEW.product_variant_id
        AND    warehouse_id = v_warehouse_id
        FOR UPDATE;

        -- Recalculate weighted average cost
        SET v_new_avg_cost = ((v_qty_before * @old_avg_cost) + (v_qty_received * NEW.unit_cost))
                           / (v_qty_before + v_qty_received);

        SET v_qty_after = v_qty_before + v_qty_received;

        UPDATE inventory_stock
        SET    qty_on_hand = v_qty_after,
               avg_cost    = v_new_avg_cost,
               updated_at  = CURRENT_TIMESTAMP
        WHERE  product_variant_id = NEW.product_variant_id
        AND    warehouse_id = v_warehouse_id;

        INSERT INTO stock_movements (
            product_variant_id, warehouse_id,
            movement_type, reference_type, reference_id,
            qty_before, qty_change, qty_after,
            unit_cost, performed_by
        ) VALUES (
            NEW.product_variant_id, v_warehouse_id,
            'purchase_receipt', 'purchase_order', NEW.purchase_order_id,
            v_qty_before, v_qty_received, v_qty_after,
            NEW.unit_cost, 1  -- system user or authorized user
        );

    END IF;
END$$

DELIMITER ;
```

### TRIGGER: Retail Price Change → product_price_history

Fires after any `selling_price` update on `product_variants`. Replace the hardcoded `changed_by = 1` with `@current_user_id` (a session variable set at login by the application layer).

```sql
DROP TRIGGER IF EXISTS trg_pv_price_history;

DELIMITER $$

CREATE TRIGGER trg_pv_price_history
AFTER UPDATE ON product_variants
FOR EACH ROW
BEGIN
    IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
        INSERT INTO product_price_history (
            product_variant_id,
            old_price,
            new_price,
            changed_by,
            change_reason,
            effective_date
        ) VALUES (
            NEW.id,
            COALESCE(OLD.selling_price, 0),
            COALESCE(NEW.selling_price, 0),
            @current_user_id,   -- Set via SET @current_user_id = ? at session start
            NULL,
            CURDATE()
        );
    END IF;
END$$

DELIMITER ;
```

### TRIGGER: Supplier Cost Change → supplier_cost_history

Fires after any `unit_cost` update on `supplier_products`.

```sql
DROP TRIGGER IF EXISTS trg_sp_cost_history;

DELIMITER $$

CREATE TRIGGER trg_sp_cost_history
AFTER UPDATE ON supplier_products
FOR EACH ROW
BEGIN
    IF NEW.unit_cost <> OLD.unit_cost THEN
        INSERT INTO supplier_cost_history (
            supplier_product_id,
            supplier_id,
            product_variant_id,
            old_unit_cost,
            new_unit_cost,
            changed_by,
            change_reason,
            effective_date
        ) VALUES (
            NEW.id,
            NEW.supplier_id,
            NEW.product_variant_id,
            OLD.unit_cost,
            NEW.unit_cost,
            @current_user_id,   -- Set via SET @current_user_id = ? at session start
            NULL,
            CURDATE()
        );
    END IF;
END$$

DELIMITER ;
```

---

## 6. Normalization Analysis

### 1NF — First Normal Form ✅

- All columns store atomic values (no comma-separated lists, no arrays in columns)
- Barcode values are in `product_barcodes` (separate rows, not a comma list)
- Vehicle fitments use a junction table, not a JSON blob in `products`
- `attributes` JSON in `product_variants` is an intentional design choice for flexible variant data; it does not violate 1NF as it is a single-attribute column

### 2NF — Second Normal Form ✅

- All tables use single-column surrogate PKs (BIGINT AUTO_INCREMENT)
- No partial dependencies possible: every non-key attribute depends on the full PK
- Junction tables (`product_vehicle_fitments`, `user_roles`) only carry the composite key plus optional descriptive columns

### 3NF — Third Normal Form ✅

Key design decisions to eliminate transitive dependencies:

| Removed Transitive Dependency | Resolution |
|-------------------------------|------------|
| `products.brand_country` → `brands.country_origin` | Moved to `brands` table |
| `sales_txn_items.warehouse_id` (from transaction) | Not stored on items; fetched from parent header |
| `inventory_stock.product_name` | Not stored; joined from `products` |
| `sales_txn.cashier_name` | Not stored; referenced via `users.id` FK |
| `purchase_order_items.supplier_id` | Not stored; accessible via `purchase_orders.supplier_id` |

### Controlled Denormalization (Performance Only)

The following denormalizations are intentional and documented:

| Field | Location | Reason |
|-------|----------|--------|
| `unit_price`, `unit_cost` | `sales_transaction_items` | Snapshot price at time of sale; products change price |
| `total_amount` | `sales_transactions` | Computed from items but stored for fast reporting |
| `outstanding_balance` | `customers` | Running balance; avoids full ledger scan on each lookup |
| `usage_count` | `discounts` | Counter updated on use; avoids expensive COUNT query |

---

## 7. Indexes & Query Optimization

### Critical Composite Indexes

```sql
-- Fast stock lookup by product + warehouse (most common query)
CREATE INDEX idx_inventory_stock_lookup
ON inventory_stock (product_variant_id, warehouse_id, qty_on_hand);

-- Sales reporting: date range + warehouse
CREATE INDEX idx_sales_txn_reporting
ON sales_transactions (warehouse_id, transaction_date, status);

-- Stock movements history per product
CREATE INDEX idx_stock_movements_product_date
ON stock_movements (product_variant_id, warehouse_id, created_at DESC);

-- Barcode scan lookup (POS critical path, must be sub-millisecond)
CREATE INDEX idx_barcodes_scan
ON product_barcodes (barcode, product_variant_id);

-- Low stock alert query
CREATE INDEX idx_inventory_low_stock
ON inventory_stock (warehouse_id, qty_on_hand, reorder_point);

-- Vehicle compatibility search
CREATE INDEX idx_fitment_lookup
ON product_vehicle_fitments (vehicle_year_id, product_id);

-- Purchase order items receiving
CREATE INDEX idx_poi_receiving
ON purchase_order_items (purchase_order_id, product_variant_id);

-- Customer search by phone (common at POS counter)
CREATE INDEX idx_customers_search
ON customers (phone, is_active, deleted_at);

-- Price history: fast lookup by variant + date range
CREATE INDEX idx_pph_variant_date
ON product_price_history (product_variant_id, effective_date DESC);

-- Supplier cost history: trend queries by supplier + date
CREATE INDEX idx_sch_supplier_date
ON supplier_cost_history (supplier_id, effective_date DESC);

-- Tier price resolution: variant + tier + qty
CREATE INDEX idx_pptr_resolution
ON product_price_tier_rules (product_variant_id, price_tier_id, min_qty, effective_date);

-- Margin reporting: fast scan of under-margin products
CREATE INDEX idx_pv_margin_lookup
ON product_variants (margin_pct, is_active);
```

### Index Usage Strategy

| Query Pattern | Index Used |
|---------------|-----------|
| Barcode scan at POS | `uq_product_barcodes_code` (unique) |
| Stock check before sale | `uq_inventory_stock` composite unique |
| Daily sales report | `idx_sales_txn_reporting` |
| Low stock alert | `idx_inventory_low_stock` |
| Vehicle fitment search | `idx_fitment_lookup` |
| Customer search by phone (common at POS counter) | `uq_customers_code` or `idx_customers_phone` |
| Stock movement history | `idx_stock_movements_product_date` |
| Retail price change history | `idx_pph_variant_date` |
| Supplier cost trend queries | `idx_sch_supplier_date` |
| Tier price resolution at POS | `idx_pptr_resolution` |
| Under-margin product scan | `idx_pv_margin_lookup` |

---

## 8. Stored Procedures & Triggers

### Stored Procedure: Complete POS Sale

```sql
-- ============================================================
-- PROCEDURE: sp_complete_sale
-- Wraps the entire sale completion in a single transaction.
-- Automatically leverages triggers for inventory deduction.
-- ============================================================
DELIMITER $$

CREATE PROCEDURE sp_complete_sale(
    IN  p_transaction_id    BIGINT,
    IN  p_amount_tendered   DECIMAL(14,4),
    IN  p_payment_method_id SMALLINT,
    OUT p_change_given      DECIMAL(14,4),
    OUT p_result_code       TINYINT,      -- 0=success, 1=error
    OUT p_result_message    VARCHAR(200)
)
BEGIN
    DECLARE v_total_amount  DECIMAL(14,4);
    DECLARE v_session_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code    = 1;
        SET p_result_message = 'Transaction failed. Rolled back.';
    END;

    START TRANSACTION;

    -- Validate session is open
    SELECT cs.status INTO v_session_status
    FROM   sales_transactions st
    JOIN   cash_sessions cs ON cs.id = st.cash_session_id
    WHERE  st.id = p_transaction_id
    FOR UPDATE;

    IF v_session_status != 'open' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cash session is not open';
    END IF;

    -- Get total amount
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

    -- Mark transaction as completed
    UPDATE sales_transactions
    SET    status           = 'completed',
           amount_tendered  = p_amount_tendered,
           change_given     = p_change_given
    WHERE  id = p_transaction_id;

    -- Record payment
    INSERT INTO transaction_payments (sales_transaction_id, payment_method_id, amount)
    VALUES (p_transaction_id, p_payment_method_id, p_amount_tendered);

    COMMIT;

    SET p_result_code    = 0;
    SET p_result_message = 'Sale completed successfully';
END$$

DELIMITER ;
```

### Stored Procedure: Get Stock Availability

```sql
DELIMITER $$

CREATE PROCEDURE sp_get_stock_availability(
    IN  p_product_variant_id  BIGINT,
    IN  p_warehouse_id        INT
)
BEGIN
    SELECT
        pv.variant_sku,
        p.name          AS product_name,
        w.name          AS warehouse_name,
        ist.qty_on_hand,
        ist.qty_reserved,
        ist.qty_available,
        ist.reorder_point,
        ist.avg_cost,
        CASE
            WHEN ist.qty_available <= 0          THEN 'OUT_OF_STOCK'
            WHEN ist.qty_available <= ist.reorder_point THEN 'LOW_STOCK'
            ELSE 'IN_STOCK'
        END             AS stock_status
    FROM  inventory_stock ist
    JOIN  product_variants pv ON pv.id = ist.product_variant_id
    JOIN  products p          ON p.id  = pv.product_id
    JOIN  warehouses w        ON w.id  = ist.warehouse_id
    WHERE ist.product_variant_id = p_product_variant_id
    AND   ist.warehouse_id       = p_warehouse_id;
END$$

DELIMITER ;
```

---

## 9. Views for Reporting

```sql
-- ============================================================
-- VIEW: v_current_stock
-- Real-time stock status across all warehouses
-- ============================================================
CREATE VIEW v_current_stock AS
SELECT
    p.id            AS product_id,
    p.sku,
    p.name          AS product_name,
    b.name          AS brand_name,
    c.name          AS category_name,
    pv.id           AS variant_id,
    pv.variant_sku,
    pv.variant_name,
    w.id            AS warehouse_id,
    w.name          AS warehouse_name,
    ist.qty_on_hand,
    ist.qty_reserved,
    ist.qty_available,
    ist.reorder_point,
    ist.avg_cost,
    (ist.qty_on_hand * ist.avg_cost) AS stock_value,
    CASE
        WHEN ist.qty_available <= 0                    THEN 'OUT_OF_STOCK'
        WHEN ist.qty_available <= ist.reorder_point    THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM  inventory_stock ist
JOIN  product_variants pv ON pv.id = ist.product_variant_id
JOIN  products p          ON p.id  = pv.product_id
LEFT JOIN brands b        ON b.id  = p.brand_id
JOIN  categories c        ON c.id  = p.category_id
JOIN  warehouses w        ON w.id  = ist.warehouse_id
WHERE pv.deleted_at IS NULL
AND   p.deleted_at  IS NULL;


-- ============================================================
-- VIEW: v_daily_sales_summary
-- Daily sales aggregated by warehouse
-- ============================================================
CREATE VIEW v_daily_sales_summary AS
SELECT
    DATE(st.transaction_date)   AS sale_date,
    w.id                        AS warehouse_id,
    w.name                      AS warehouse_name,
    COUNT(*)                    AS transaction_count,
    SUM(st.subtotal)            AS total_subtotal,
    SUM(st.discount_amount)     AS total_discounts,
    SUM(st.tax_amount)          AS total_tax,
    SUM(st.total_amount)        AS total_revenue,
    SUM(st.total_amount - COALESCE(
        (SELECT SUM(sti2.qty * sti2.unit_cost)
         FROM sales_transaction_items sti2
         WHERE sti2.sales_transaction_id = st.id), 0
    ))                          AS gross_profit
FROM  sales_transactions st
JOIN  warehouses w ON w.id = st.warehouse_id
WHERE st.status = 'completed'
GROUP BY DATE(st.transaction_date), w.id, w.name;


-- ============================================================
-- VIEW: v_top_selling_products
-- Products ranked by quantity sold (all time)
-- ============================================================
CREATE VIEW v_top_selling_products AS
SELECT
    p.id            AS product_id,
    p.sku,
    p.name          AS product_name,
    b.name          AS brand,
    c.name          AS category,
    SUM(sti.qty)    AS total_qty_sold,
    SUM(sti.line_total) AS total_revenue,
    SUM(sti.qty * (sti.unit_price - sti.unit_cost)) AS total_gross_profit,
    COUNT(DISTINCT sti.sales_transaction_id) AS transaction_count
FROM  sales_transaction_items sti
JOIN  sales_transactions st   ON st.id  = sti.sales_transaction_id AND st.status = 'completed'
JOIN  product_variants pv     ON pv.id  = sti.product_variant_id
JOIN  products p              ON p.id   = pv.product_id
LEFT JOIN brands b            ON b.id   = p.brand_id
JOIN  categories c            ON c.id   = p.category_id
GROUP BY p.id, p.sku, p.name, b.name, c.name
ORDER BY total_qty_sold DESC;


-- ============================================================
-- VIEW: v_low_stock_alerts
-- Items at or below reorder point
-- ============================================================
CREATE VIEW v_low_stock_alerts AS
SELECT
    w.name          AS warehouse,
    p.sku,
    p.name          AS product_name,
    pv.variant_sku,
    ist.qty_on_hand,
    ist.qty_available,
    ist.reorder_point,
    ist.reorder_qty,
    (ist.reorder_point - ist.qty_available) AS shortage_qty,
    s.name          AS preferred_supplier,
    sp.unit_cost    AS supplier_cost,
    sp.lead_time_days
FROM  inventory_stock ist
JOIN  product_variants pv   ON pv.id = ist.product_variant_id
JOIN  products p            ON p.id  = pv.product_id
JOIN  warehouses w          ON w.id  = ist.warehouse_id
LEFT JOIN supplier_products sp
    ON sp.product_variant_id = pv.id
    AND sp.is_preferred = 1
    AND sp.is_active = 1
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE ist.qty_available <= ist.reorder_point
AND   ist.reorder_point > 0
AND   pv.is_active = 1
AND   p.is_active = 1
ORDER BY shortage_qty DESC;


-- ============================================================
-- VIEW: v_sales_performance
-- Best sellers and slow movers per product variant.
-- Use ORDER BY total_qty_sold DESC / ASC for top/bottom lists.
-- ============================================================
CREATE OR REPLACE VIEW v_sales_performance AS
SELECT
    p.id                                            AS product_id,
    p.sku,
    p.name                                          AS product_name,
    pv.id                                           AS variant_id,
    pv.variant_sku,
    b.name                                          AS brand,
    c.name                                          AS category,
    SUM(sti.qty)                                    AS total_qty_sold,
    COUNT(DISTINCT sti.sales_transaction_id)        AS transaction_count,
    SUM(sti.line_total)                             AS total_revenue,
    SUM(sti.qty * sti.unit_price)                   AS gross_sales,
    SUM(sti.discount_amount * sti.qty)              AS total_discounts_given,
    SUM(sti.qty * sti.unit_cost)                    AS total_cogs,
    SUM(sti.line_total - (sti.qty * sti.unit_cost)) AS gross_profit,
    ROUND(
        SUM(sti.line_total - (sti.qty * sti.unit_cost))
        / NULLIF(SUM(sti.line_total), 0) * 100
    , 2)                                            AS margin_pct_realized,
    MIN(st.transaction_date)                        AS first_sale_date,
    MAX(st.transaction_date)                        AS last_sale_date,
    SUM(ist.qty_on_hand)                            AS current_stock_all_warehouses
FROM sales_transaction_items sti
JOIN sales_transactions  st  ON st.id  = sti.sales_transaction_id
                              AND st.status = 'completed'
JOIN product_variants    pv  ON pv.id  = sti.product_variant_id
JOIN products            p   ON p.id   = pv.product_id
LEFT JOIN brands         b   ON b.id   = p.brand_id
JOIN categories          c   ON c.id   = p.category_id
LEFT JOIN inventory_stock ist ON ist.product_variant_id = pv.id
GROUP BY
    p.id, p.sku, p.name,
    pv.id, pv.variant_sku,
    b.name, c.name;


-- ============================================================
-- VIEW: v_profit_margin
-- Stored margin (from generated column) vs realized margin
-- (from actual sales), with category-level rollup via window fn.
-- ============================================================
CREATE OR REPLACE VIEW v_profit_margin AS
SELECT
    p.id                                        AS product_id,
    p.sku,
    p.name                                      AS product_name,
    b.name                                      AS brand,
    c.id                                        AS category_id,
    c.name                                      AS category,
    COALESCE(pv.cost_price,    p.cost_price)    AS current_cost,
    COALESCE(pv.selling_price, p.selling_price) AS current_price,
    pv.margin_pct                               AS margin_pct_stored,
    pv.markup_pct                               AS markup_pct_stored,
    ROUND(
        SUM(sti.line_total - (sti.qty * sti.unit_cost))
        / NULLIF(SUM(sti.line_total), 0) * 100
    , 2)                                        AS margin_pct_realized,
    SUM(sti.line_total)                         AS total_revenue,
    SUM(sti.line_total - (sti.qty * sti.unit_cost)) AS gross_profit,
    SUM(SUM(sti.line_total - (sti.qty * sti.unit_cost)))
        OVER (PARTITION BY c.id)                AS category_gross_profit,
    ROUND(
        SUM(SUM(sti.line_total - (sti.qty * sti.unit_cost)))
            OVER (PARTITION BY c.id) /
        NULLIF(SUM(SUM(sti.line_total)) OVER (PARTITION BY c.id), 0) * 100
    , 2)                                        AS category_margin_pct
FROM product_variants    pv
JOIN products            p   ON p.id  = pv.product_id
LEFT JOIN brands         b   ON b.id  = p.brand_id
JOIN categories          c   ON c.id  = p.category_id
LEFT JOIN sales_transaction_items sti ON sti.product_variant_id = pv.id
LEFT JOIN sales_transactions      st  ON st.id = sti.sales_transaction_id
                                       AND st.status = 'completed'
WHERE pv.deleted_at IS NULL
  AND p.deleted_at  IS NULL
GROUP BY
    p.id, p.sku, p.name, b.name,
    c.id, c.name,
    pv.cost_price, pv.selling_price,
    p.cost_price,  p.selling_price,
    pv.margin_pct, pv.markup_pct;


-- ============================================================
-- VIEW: v_supplier_cost_trends
-- Supplier price changes over time with rolling 12-month avg.
-- Useful for spotting supplier inflation or cost reductions.
-- ============================================================
CREATE OR REPLACE VIEW v_supplier_cost_trends AS
SELECT
    sch.effective_date,
    s.id                    AS supplier_id,
    s.name                  AS supplier_name,
    p.id                    AS product_id,
    p.sku,
    p.name                  AS product_name,
    pv.variant_sku,
    sch.old_unit_cost,
    sch.new_unit_cost,
    sch.cost_change_pct,
    CASE
        WHEN sch.cost_change_pct > 0 THEN 'increase'
        WHEN sch.cost_change_pct < 0 THEN 'decrease'
        ELSE 'unchanged'
    END                     AS direction,
    AVG(sch.new_unit_cost) OVER (
        PARTITION BY sch.supplier_id, sch.product_variant_id
        ORDER BY sch.effective_date
        ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    )                       AS rolling_12m_avg_cost,
    sch.change_reason,
    sch.created_at
FROM supplier_cost_history sch
JOIN suppliers        s  ON s.id  = sch.supplier_id
JOIN product_variants pv ON pv.id = sch.product_variant_id
JOIN products         p  ON p.id  = pv.product_id
ORDER BY sch.effective_date DESC, s.name, p.name;


-- ============================================================
-- VIEW: v_price_change_impact
-- Compares unit sales and revenue in the 30 days before vs
-- 30 days after each retail price change.
-- Answers: "Did raising price hurt unit sales?"
-- ============================================================
CREATE OR REPLACE VIEW v_price_change_impact AS
SELECT
    pph.id                  AS price_change_id,
    pph.effective_date      AS change_date,
    pv.id                   AS variant_id,
    pv.variant_sku,
    p.name                  AS product_name,
    pph.old_price,
    pph.new_price,
    ROUND((pph.new_price - pph.old_price) / NULLIF(pph.old_price, 0) * 100, 2)
                            AS price_change_pct,
    SUM(CASE
        WHEN DATE(st.transaction_date)
             BETWEEN DATE_SUB(pph.effective_date, INTERVAL 30 DAY)
                 AND DATE_SUB(pph.effective_date, INTERVAL 1 DAY)
        THEN sti.qty ELSE 0
    END)                    AS qty_sold_30d_before,
    SUM(CASE
        WHEN DATE(st.transaction_date)
             BETWEEN DATE_SUB(pph.effective_date, INTERVAL 30 DAY)
                 AND DATE_SUB(pph.effective_date, INTERVAL 1 DAY)
        THEN sti.line_total ELSE 0
    END)                    AS revenue_30d_before,
    SUM(CASE
        WHEN DATE(st.transaction_date)
             BETWEEN pph.effective_date
                 AND DATE_ADD(pph.effective_date, INTERVAL 30 DAY)
        THEN sti.qty ELSE 0
    END)                    AS qty_sold_30d_after,
    SUM(CASE
        WHEN DATE(st.transaction_date)
             BETWEEN pph.effective_date
                 AND DATE_ADD(pph.effective_date, INTERVAL 30 DAY)
        THEN sti.line_total ELSE 0
    END)                    AS revenue_30d_after,
    SUM(CASE
        WHEN DATE(st.transaction_date)
             BETWEEN pph.effective_date
                 AND DATE_ADD(pph.effective_date, INTERVAL 30 DAY)
        THEN sti.qty ELSE 0
    END) -
    SUM(CASE
        WHEN DATE(st.transaction_date)
             BETWEEN DATE_SUB(pph.effective_date, INTERVAL 30 DAY)
                 AND DATE_SUB(pph.effective_date, INTERVAL 1 DAY)
        THEN sti.qty ELSE 0
    END)                    AS qty_delta,
    pph.change_reason
FROM product_price_history pph
JOIN product_variants  pv  ON pv.id = pph.product_variant_id
JOIN products          p   ON p.id  = pv.product_id
LEFT JOIN sales_transaction_items sti ON sti.product_variant_id = pv.id
LEFT JOIN sales_transactions      st  ON st.id = sti.sales_transaction_id
                                       AND st.status = 'completed'
GROUP BY
    pph.id, pph.effective_date,
    pv.id, pv.variant_sku, p.name,
    pph.old_price, pph.new_price, pph.change_reason;
```

---

## 10. Business Rules & Constraints

| Rule | Implementation |
|------|---------------|
| Stock cannot go negative from a sale | `TRIGGER trg_sti_after_insert` raises SIGNAL if insufficient |
| A sale can only be processed in an open cash session | `sp_complete_sale` checks session status |
| Transaction amounts must be non-negative | `CHECK` constraints on `line_total`, `total_amount` |
| `qty_available = qty_on_hand - qty_reserved` | `GENERATED ALWAYS AS` virtual column |
| Selling price must be ≥ min_selling_price | Enforced at application layer + DB CHECK |
| PO receipts update weighted average cost | `TRIGGER trg_poi_after_update` recalculates `avg_cost` |
| Return qty cannot exceed original qty sold | Enforced at application layer |
| Users can only access their assigned warehouse | Role-based filtering at application layer |
| Soft-deleted products cannot be sold | Application layer filters `deleted_at IS NULL` |
| A cash session cannot be reopened once closed | `status` ENUM transition enforced by application |
| Every retail price change is logged | `TRIGGER trg_pv_price_history` writes to `product_price_history` |
| Every supplier cost change is logged | `TRIGGER trg_sp_cost_history` writes to `supplier_cost_history` |
| Tier prices cannot be negative | `CHECK chk_pptr_price` on `product_price_tier_rules` |
| Bulk qty breaks must have min_qty > 0 | `CHECK chk_pptr_min_qty` on `product_price_tier_rules` |
| margin_pct and markup_pct stay in sync | `GENERATED ALWAYS AS (STORED)` columns on `product_variants` |

---

## 11. Scalability & Performance Considerations

### Partitioning Strategy

For high-volume deployments, partition large tables by date:

```sql
-- Partition stock_movements by year (most queried by recent date)
ALTER TABLE stock_movements
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Partition sales_transactions by month for reporting performance
ALTER TABLE sales_transactions
PARTITION BY RANGE (UNIX_TIMESTAMP(transaction_date)) (
    PARTITION p_2025_01 VALUES LESS THAN (UNIX_TIMESTAMP('2025-02-01')),
    -- ... continue for each month
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### Caching Recommendations

| Data | Cache Strategy | TTL |
|------|---------------|-----|
| Product catalog | Redis / Memcached | 5 minutes |
| Stock levels (read) | Redis | 10 seconds |
| Tax rates | In-memory (app) | 1 hour |
| Category tree | Redis | 30 minutes |
| Customer profile | Redis | 5 minutes |

### Connection Pooling

- Use **PgBouncer** (Postgres) or **ProxySQL** (MySQL) for connection pooling
- Configure `innodb_buffer_pool_size` to 70–80% of available RAM
- Set `innodb_flush_log_at_trx_commit = 1` (durability over speed for financial data)

### Read Replica Separation

- Route all **reporting queries** (views, aggregates) to a **read replica**
- All **write operations** (POS sales, inventory updates) go to the **primary**
- Use middleware (e.g., middleware DB proxy) for transparent read/write splitting

---

## 12. Sample Data Flow Walkthrough

### Scenario: Customer Buys 2x NGK Spark Plugs at POS

```
1. Cashier scans barcode: "4548774054361"
   → SELECT pv.id, p.name, ist.qty_available, pv.selling_price
     FROM product_barcodes pb
     JOIN product_variants pv ON pv.id = pb.product_variant_id
     JOIN inventory_stock ist ON ist.product_variant_id = pv.id
     WHERE pb.barcode = '4548774054361'
     AND ist.warehouse_id = 1;
   ← Returns: variant_id=42, "NGK Spark Plug CR8E", qty=15, price=185.00

2. Cashier enters qty = 2
   → INSERT INTO sales_transaction_items
     (sales_transaction_id, product_variant_id, qty, unit_price, unit_cost, line_total)
     VALUES (1001, 42, 2, 185.00, 95.00, 370.00);

3. TRIGGER fires automatically:
   → Reads inventory_stock: qty_on_hand=15 (locked FOR UPDATE)
   → 15 >= 2: OK
   → UPDATE inventory_stock SET qty_on_hand=13 WHERE ...
   → INSERT INTO stock_movements (type='sale', qty_change=-2, qty_before=15, qty_after=13)

4. Cashier accepts ₱400 cash payment
   → CALL sp_complete_sale(1001, 400.00, 1, @change, @code, @msg);
   → UPDATE sales_transactions SET status='completed', amount_tendered=400, change_given=30
   → INSERT INTO transaction_payments (sales_transaction_id=1001, amount=400.00)
   → Returns: change=30.00

5. Result state after transaction:
   inventory_stock.qty_on_hand = 13  (was 15)
   stock_movements: 1 new row (sale, -2, ref: txn #1001)
   sales_transactions: status=completed
   sales_transaction_items: 1 row, qty=2, line_total=370.00
   transaction_payments: 1 row, ₱400 cash
```

---

## Summary: Table Reference Sheet

| Table | Purpose | Rows (Est.) |
|-------|---------|------------|
| `brands` | Product brands | Hundreds |
| `categories` | Hierarchical product categories | Hundreds |
| `products` | Product master catalog | Thousands |
| `product_variants` | Saleable variants (+ margin_pct, markup_pct) | Thousands |
| `product_barcodes` | Barcode lookup | Thousands |
| `product_vehicle_fitments` | Vehicle compatibility | Tens of thousands |
| `warehouses` | Physical locations | Tens |
| `inventory_stock` | **Real-time stock** | Millions (variant × warehouse) |
| `stock_movements` | **Immutable stock ledger** | Tens of millions |
| `suppliers` | Supplier directory | Hundreds |
| `purchase_orders` | PO headers | Thousands |
| `purchase_order_items` | PO line items | Tens of thousands |
| `sales_transactions` | **POS transaction headers** | Millions |
| `sales_transaction_items` | **POS line items** | Tens of millions |
| `transaction_payments` | Payment records | Millions |
| `customers` | Customer profiles | Thousands |
| `invoice_sequences` | Invoice number series control | Tens |
| `business_profile` | Shop details for invoice header | Ones |
| `invoices` | Invoice headers (1-to-1 with transactions) | Millions |
| `invoice_items` | Invoice line item snapshots | Tens of millions |
| `invoice_payments` | Invoice payment breakdown | Millions |
| `users` | System users | Tens |
| `audit_log` | Change history | Tens of millions |
| `product_price_history` | **Retail price change log** | Thousands–Millions |
| `supplier_cost_history` | **Supplier cost change log** | Thousands |
| `price_tiers` | Named pricing tiers (walk-in, wholesale, dealer, bulk) | Ones (seeded) |
| `product_price_tier_rules` | Per-variant tier prices + qty breaks | Thousands |

---

## 13. Pricing & Analytics Migration Reference

This section summarises every object added in the pricing & analytics migration. Run these in order against an existing database that already has the base schema deployed.

### Execution Order

1. `CREATE TABLE product_price_history` — no dependencies beyond `product_variants`
2. `CREATE TABLE supplier_cost_history` — depends on `supplier_products`, `suppliers`, `product_variants`
3. `CREATE TABLE price_tiers` + seed `INSERT`
4. `CREATE TABLE product_price_tier_rules` — depends on `product_variants`, `price_tiers`
5. `ALTER TABLE product_variants` — adds `margin_pct`, `markup_pct`, and `idx_pv_margin_pct`
6. Additional indexes (section 7)
7. `CREATE TRIGGER trg_pv_price_history`
8. `CREATE TRIGGER trg_sp_cost_history`
9. Analytics views (section 9)

### Session Variable Requirement

Both triggers write `@current_user_id` as the `changed_by` value. Set this at the start of every authenticated database session:

```sql
SET @current_user_id = ?;  -- bind the logged-in users.id from the application
```

### Helper Function: Tier Price Resolution

Resolves the correct tier price for a given variant, tier code, and quantity at today's date. Returns `NULL` if no matching rule exists (fall back to `selling_price` in application logic).

```sql
DROP FUNCTION IF EXISTS fn_get_tier_price;

DELIMITER $$

CREATE FUNCTION fn_get_tier_price(
    p_variant_id  BIGINT,
    p_tier_code   VARCHAR(30),
    p_qty         DECIMAL(12,4)
)
RETURNS DECIMAL(12,4)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_price DECIMAL(12,4);

    SELECT  r.tier_price
    INTO    v_price
    FROM    product_price_tier_rules r
    JOIN    price_tiers t ON t.id = r.price_tier_id
    WHERE   r.product_variant_id = p_variant_id
      AND   t.code               = p_tier_code
      AND   r.is_active          = 1
      AND   r.effective_date    <= CURDATE()
      AND   (r.expiry_date IS NULL OR r.expiry_date >= CURDATE())
      AND   (r.min_qty IS NULL OR p_qty >= r.min_qty)
    ORDER BY COALESCE(r.min_qty, 0) DESC   -- pick highest applicable qty break
    LIMIT 1;

    RETURN v_price;
END$$

DELIMITER ;
```

**Usage example:**

```sql
-- Get dealer price for variant 42, buying 5 units
SELECT fn_get_tier_price(42, 'DEALER', 5);

-- Get bulk price for variant 42 when buying 20 units
SELECT fn_get_tier_price(42, 'BULK', 20);
```

### New Analytics Views Summary

| View | Purpose |
|------|---------|
| `v_sales_performance` | Best sellers / slow movers — qty, revenue, gross profit, realized margin per variant |
| `v_profit_margin` | Stored margin vs realized margin per product, with category rollup |
| `v_supplier_cost_trends` | Supplier price changes over time with 12-month rolling avg cost |
| `v_price_change_impact` | 30-day before/after comparison for each retail price change |

---

*Document Version: 1.1 | Database: MySQL 8.0+ / MariaDB 10.6+ | Engine: InnoDB | Charset: utf8mb4*
