-- ============================================================
-- SEED SAMPLE DATA (PostgreSQL)
-- Motorparts & Accessories Inventory Management System
-- ============================================================
-- Converted from MySQL-oriented seed script.
-- Notes:
--   1) MySQL-specific `SET FOREIGN_KEY_CHECKS` was removed.
--   2) MySQL session variable `@current_user_id` was converted to a comment.
--   3) Data payload is preserved as-is.
-- ============================================================

-- Optional (PostgreSQL): if you need to bypass FK checks during bulk load,
-- run as a superuser and uncomment both lines below:
-- SET session_replication_role = replica;
-- SET session_replication_role = DEFAULT;

-- current_user_id = 1  -- admin user, used by triggers

-- ============================================================
-- 1. CORE REFERENCE TABLES
-- ============================================================

INSERT INTO brands (id, name, slug, country_origin, is_active) VALUES
  (1,  'NGK',       'ngk',       'JP', 1),
  (2,  'Denso',     'denso',     'JP', 1),
  (3,  'Bosch',     'bosch',     'DE', 1),
  (4,  'Gates',     'gates',     'US', 1),
  (5,  'Motul',     'motul',     'FR', 1),
  (6,  'Castrol',   'castrol',   'GB', 1),
  (7,  'Monroe',    'monroe',    'US', 1),
  (8,  'Brembo',    'brembo',    'IT', 1),
  (9,  'ACDelco',   'acdelco',   'US', 1),
  (10, 'Sakura',    'sakura',    'JP', 1);


INSERT INTO categories (id, parent_id, name, slug, sort_order, is_active) VALUES
  -- Root categories
  (1,  NULL, 'Engine Parts',        'engine-parts',        1, 1),
  (2,  NULL, 'Electrical',          'electrical',          2, 1),
  (3,  NULL, 'Brakes & Suspension', 'brakes-suspension',   3, 1),
  (4,  NULL, 'Filters',             'filters',             4, 1),
  (5,  NULL, 'Lubricants & Fluids', 'lubricants-fluids',   5, 1),
  (6,  NULL, 'Belts & Hoses',       'belts-hoses',         6, 1),
  (7,  NULL, 'Body & Exterior',     'body-exterior',       7, 1),
  -- Sub-categories
  (8,  1,  'Spark Plugs',           'spark-plugs',         1, 1),
  (9,  1,  'Pistons & Rings',       'pistons-rings',       2, 1),
  (10, 1,  'Gaskets & Seals',       'gaskets-seals',       3, 1),
  (11, 2,  'Batteries',             'batteries',           1, 1),
  (12, 2,  'Alternators',           'alternators',         2, 1),
  (13, 2,  'Sensors',               'sensors',             3, 1),
  (14, 3,  'Brake Pads',            'brake-pads',          1, 1),
  (15, 3,  'Shock Absorbers',       'shock-absorbers',     2, 1),
  (16, 4,  'Oil Filters',           'oil-filters',         1, 1),
  (17, 4,  'Air Filters',           'air-filters',         2, 1),
  (18, 4,  'Fuel Filters',          'fuel-filters',        3, 1),
  (19, 5,  'Engine Oil',            'engine-oil',          1, 1),
  (20, 5,  'Transmission Fluid',    'transmission-fluid',  2, 1),
  (21, 6,  'Timing Belts',          'timing-belts',        1, 1),
  (22, 6,  'Radiator Hoses',        'radiator-hoses',      2, 1);


INSERT INTO units_of_measure (id, code, name, is_active) VALUES
  (1, 'pcs',  'Piece',   1),
  (2, 'set',  'Set',     1),
  (3, 'L',    'Liter',   1),
  (4, 'qt',   'Quart',   1),
  (5, 'pr',   'Pair',    1),
  (6, 'box',  'Box',     1),
  (7, 'roll', 'Roll',    1),
  (8, 'kg',   'Kilogram',1);


INSERT INTO tax_rates (id, name, rate, is_inclusive, is_active) VALUES
  (1, 'VAT 12%',     0.1200, 0, 1),
  (2, 'Zero-rated',  0.0000, 0, 1),
  (3, 'VAT-exempt',  0.0000, 0, 1),
  (4, 'VAT 12% Incl',0.1200, 1, 1);


-- ============================================================
-- 2. VEHICLE COMPATIBILITY
-- ============================================================

INSERT INTO vehicle_makes (id, name, vehicle_type, is_active) VALUES
  (1,  'Toyota',   'car',        1),
  (2,  'Honda',    'car',        1),
  (3,  'Mitsubishi','car',       1),
  (4,  'Suzuki',   'car',        1),
  (5,  'Ford',     'car',        1),
  (6,  'Isuzu',    'truck',      1),
  (7,  'Yamaha',   'motorcycle', 1),
  (8,  'Honda',    'motorcycle', 1);


INSERT INTO vehicle_models (id, vehicle_make_id, name, is_active) VALUES
  (1,  1, 'Vios',        1),
  (2,  1, 'Fortuner',    1),
  (3,  1, 'Innova',      1),
  (4,  1, 'Hilux',       1),
  (5,  2, 'City',        1),
  (6,  2, 'Civic',       1),
  (7,  2, 'CR-V',        1),
  (8,  3, 'Montero Sport',1),
  (9,  3, 'Strada',      1),
  (10, 4, 'Ertiga',      1),
  (11, 5, 'Ranger',      1),
  (12, 6, 'D-Max',       1),
  (13, 7, 'Mio',         1),
  (14, 8, 'Beat',        1);


INSERT INTO vehicle_years (id, vehicle_model_id, year) VALUES
  -- Toyota Vios 2018-2023
  (1,  1, 2018),(2,  1, 2019),(3,  1, 2020),(4,  1, 2021),(5,  1, 2022),(6,  1, 2023),
  -- Toyota Fortuner 2016-2023
  (7,  2, 2016),(8,  2, 2017),(9,  2, 2018),(10, 2, 2019),(11, 2, 2020),(12, 2, 2021),(13, 2, 2022),(14, 2, 2023),
  -- Toyota Innova 2016-2023
  (15, 3, 2016),(16, 3, 2017),(17, 3, 2018),(18, 3, 2019),(19, 3, 2020),(20, 3, 2021),
  -- Honda City 2017-2023
  (21, 5, 2017),(22, 5, 2018),(23, 5, 2019),(24, 5, 2020),(25, 5, 2021),(26, 5, 2022),(27, 5, 2023),
  -- Honda Civic 2016-2023
  (28, 6, 2016),(29, 6, 2017),(30, 6, 2018),(31, 6, 2019),(32, 6, 2020),(33, 6, 2021),
  -- Mitsubishi Montero 2015-2022
  (34, 8, 2015),(35, 8, 2016),(36, 8, 2017),(37, 8, 2018),(38, 8, 2019),(39, 8, 2020),
  -- Yamaha Mio
  (40, 13, 2019),(41, 13, 2020),(42, 13, 2021),(43, 13, 2022),
  -- Honda Beat
  (44, 14, 2020),(45, 14, 2021),(46, 14, 2022),(47, 14, 2023);


-- ============================================================
-- 3. USERS & ACCESS CONTROL
-- ============================================================

INSERT INTO roles (id, name, description, is_active) VALUES
  (1, 'admin',        'Full system access',                    1),
  (2, 'manager',      'Inventory and reporting access',        1),
  (3, 'cashier',      'POS and basic inventory view',          1),
  (4, 'stock_clerk',  'Inventory adjustments and receiving',   1),
  (5, 'viewer',       'Read-only access to reports',           1);


INSERT INTO permissions (id, module, action) VALUES
  (1,  'products',   'read'),   (2,  'products',   'write'),  (3,  'products',   'delete'),
  (4,  'inventory',  'read'),   (5,  'inventory',  'write'),  (6,  'inventory',  'approve'),
  (7,  'pos',        'read'),   (8,  'pos',        'write'),  (9,  'pos',        'void'),
  (10, 'suppliers',  'read'),   (11, 'suppliers',  'write'),
  (12, 'purchase_orders','read'),(13,'purchase_orders','write'),(14,'purchase_orders','approve'),
  (15, 'customers',  'read'),   (16, 'customers',  'write'),
  (17, 'reports',    'read'),   (18, 'reports',    'export'),
  (19, 'users',      'read'),   (20, 'users',      'write'),
  (21, 'pricing',    'read'),   (22, 'pricing',    'write');


INSERT INTO role_permissions (role_id, permission_id) VALUES
  -- admin: all
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),
  (1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,22),
  -- manager
  (2,1),(2,2),(2,4),(2,5),(2,6),(2,7),(2,8),(2,10),(2,11),(2,12),(2,13),(2,14),
  (2,15),(2,16),(2,17),(2,18),(2,21),(2,22),
  -- cashier
  (3,1),(3,4),(3,7),(3,8),(3,15),(3,16),(3,21),
  -- stock_clerk
  (4,1),(4,4),(4,5),(4,10),(4,12),(4,13),(4,21),
  -- viewer
  (5,1),(5,4),(5,7),(5,10),(5,12),(5,15),(5,17),(5,21);


-- passwords are bcrypt of "password123" (for demo only)
INSERT INTO users (id, username, password_hash, first_name, last_name, email, phone, pin_hash, warehouse_id, is_active) VALUES
  (1, 'admin',       '$2b$12$demo_hash_admin',   'Maria',   'Santos',    'admin@motorparts.ph',      '+63917111001', '$2b$12$pin_0001', 1, 1),
  (2, 'jdcruz',      '$2b$12$demo_hash_jdc',     'Juan',    'dela Cruz', 'juan.cruz@motorparts.ph',  '+63917111002', '$2b$12$pin_0002', 1, 1),
  (3, 'rreyes',      '$2b$12$demo_hash_rr',      'Rosa',    'Reyes',     'rosa.reyes@motorparts.ph', '+63917111003', '$2b$12$pin_0003', 1, 1),
  (4, 'cvillanueva', '$2b$12$demo_hash_cv',      'Carlos',  'Villanueva','c.villanueva@motorparts.ph','+63917111004','$2b$12$pin_0004', 2, 1),
  (5, 'lgomez',      '$2b$12$demo_hash_lg',      'Luisa',   'Gomez',     'l.gomez@motorparts.ph',    '+63917111005', '$2b$12$pin_0005', 2, 1);


INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1),  -- Maria = admin
  (2, 2),  -- Juan  = manager
  (3, 3),  -- Rosa  = cashier
  (4, 4),  -- Carlos = stock_clerk
  (5, 3);  -- Luisa = cashier


-- ============================================================
-- 4. WAREHOUSES
-- ============================================================

INSERT INTO warehouses (id, code, name, address, city, is_pos_location, is_active) VALUES
  (1, 'MAIN',    'Main Store – Cebu City',    'Unit 5 M. Gotiaoco St., Capitol Site',  'Cebu City',   1, 1),
  (2, 'BRANCH2', 'Branch 2 – Mandaue',        '123 M.C. Briones St., Centro',          'Mandaue City',1, 1),
  (3, 'BODEGA',  'Main Bodega / Warehouse',   'Lot 9 Ouano Industrial Estate',          'Mandaue City',0, 1);


-- ============================================================
-- 5. PRODUCTS & VARIANTS
-- ============================================================

INSERT INTO products (id, category_id, brand_id, uom_id, tax_rate_id, sku, name, part_number, cost_price, selling_price, wholesale_price, min_selling_price, is_taxable, is_active) VALUES
  -- Spark Plugs
  (1,  8,  1,  1, 1, 'NGK-CR8E',      'NGK Spark Plug CR8E',             'CR8E',        88.00,  165.00, 140.00, 120.00, 1, 1),
  (2,  8,  1,  1, 1, 'NGK-BPR6ES',    'NGK Spark Plug BPR6ES',           'BPR6ES',      92.00,  175.00, 148.00, 125.00, 1, 1),
  (3,  8,  2,  1, 1, 'DNO-K20PR',     'Denso Iridium Plug K20PR-U11',    'K20PR-U11',  185.00,  350.00, 295.00, 250.00, 1, 1),
  -- Oil Filters
  (4,  16, 10, 1, 1, 'SAK-C-109',     'Sakura Oil Filter C-109',         'C-109',       58.00,  110.00,  90.00,  75.00, 1, 1),
  (5,  16, 3,  1, 1, 'BSH-OF-A3R',    'Bosch Oil Filter OF-A3R',         'OF-A3R',      75.00,  145.00, 118.00,  95.00, 1, 1),
  -- Air Filters
  (6,  17, 9,  1, 1, 'ACD-A1616C',    'ACDelco Air Filter A1616C',       'A1616C',      95.00,  185.00, 155.00, 130.00, 1, 1),
  (7,  17, 3,  1, 1, 'BSH-S0198',     'Bosch Air Filter S0198',          'S0198',      110.00,  210.00, 175.00, 145.00, 1, 1),
  -- Brake Pads
  (8,  14, 8,  2, 1, 'BRM-P06020',    'Brembo Brake Pads P06020',        'P06020',     520.00,  980.00, 820.00, 700.00, 1, 1),
  (9,  14, 7,  2, 1, 'MON-BP740',     'Monroe Brake Pad Set BP740',      'BP740',      380.00,  720.00, 600.00, 510.00, 1, 1),
  -- Shock Absorbers
  (10, 15, 7,  2, 1, 'MON-E4552',     'Monroe Front Shock Absorber E4552','E4552',     850.00, 1650.00,1380.00,1150.00, 1, 1),
  -- Engine Oil
  (11, 19, 5,  3, 1, 'MOT-5W30-1L',   'Motul 5W-30 Engine Oil 1L',      'MOT5W301L',  185.00,  355.00, 295.00, 255.00, 1, 1),
  (12, 19, 6,  3, 1, 'CAS-GTX-1L',    'Castrol GTX 10W-40 1L',          'CASGTX10W40', 150.00, 285.00, 238.00, 200.00, 1, 1),
  -- Timing Belt
  (13, 21, 4,  1, 1, 'GAT-T223',      'Gates Timing Belt T223',          'T223',       320.00,  620.00, 520.00, 450.00, 1, 1),
  -- Batteries
  (14, 11, 9,  1, 1, 'ACD-B24R',      'ACDelco Battery 24R',             'B24R-N',    1850.00, 3500.00,2900.00,2500.00, 1, 1),
  -- Fuel Filter
  (15, 18, 3,  1, 1, 'BSH-FF-001',    'Bosch Fuel Filter FF-001',        'FF-001',      88.00,  168.00, 138.00, 115.00, 1, 1);


-- Product variants (one-to-one with products for standard parts; multi-variant for oil)
INSERT INTO product_variants (id, product_id, variant_sku, variant_name, cost_price, selling_price, is_active) VALUES
  (1,  1,  'NGK-CR8E-STD',    NULL,                  NULL,   NULL,   1),
  (2,  2,  'NGK-BPR6ES-STD',  NULL,                  NULL,   NULL,   1),
  (3,  3,  'DNO-K20PR-STD',   NULL,                  NULL,   NULL,   1),
  (4,  4,  'SAK-C109-STD',    NULL,                  NULL,   NULL,   1),
  (5,  5,  'BSH-OFA3R-STD',   NULL,                  NULL,   NULL,   1),
  (6,  6,  'ACD-A1616C-STD',  NULL,                  NULL,   NULL,   1),
  (7,  7,  'BSH-S0198-STD',   NULL,                  NULL,   NULL,   1),
  (8,  8,  'BRM-P06020-STD',  NULL,                  NULL,   NULL,   1),
  (9,  9,  'MON-BP740-STD',   NULL,                  NULL,   NULL,   1),
  (10, 10, 'MON-E4552-STD',   NULL,                  NULL,   NULL,   1),
  -- Engine Oil variants (1L, 4L)
  (11, 11, 'MOT-5W30-1L',     'Motul 5W-30 – 1 Liter',  185.00, 355.00, 1),
  (12, 11, 'MOT-5W30-4L',     'Motul 5W-30 – 4 Liters', 680.00,1280.00, 1),
  (13, 12, 'CAS-GTX-1L',      'Castrol GTX – 1 Liter',  150.00, 285.00, 1),
  (14, 12, 'CAS-GTX-4L',      'Castrol GTX – 4 Liters', 560.00,1040.00, 1),
  (15, 13, 'GAT-T223-STD',    NULL,                  NULL,   NULL,   1),
  (16, 14, 'ACD-B24R-STD',    NULL,                  NULL,   NULL,   1),
  (17, 15, 'BSH-FF001-STD',   NULL,                  NULL,   NULL,   1);


-- ============================================================
-- 6. BARCODES & VEHICLE FITMENTS
-- ============================================================

INSERT INTO product_barcodes (id, product_variant_id, barcode, barcode_type, is_primary) VALUES
  (1,  1,  '4548774054361', 'EAN13', 1),
  (2,  2,  '4548774015370', 'EAN13', 1),
  (3,  3,  '4549187069711', 'EAN13', 1),
  (4,  4,  '4965075260116', 'EAN13', 1),
  (5,  5,  '4047024167213', 'EAN13', 1),
  (6,  6,  '0012381054552', 'EAN13', 1),
  (7,  7,  '4047024308735', 'EAN13', 1),
  (8,  8,  '8020584073958', 'EAN13', 1),
  (9,  9,  '0034275000740', 'EAN13', 1),
  (10, 10, '0034275445527', 'EAN13', 1),
  (11, 11, '3374650012443', 'EAN13', 1),
  (12, 12, '3374650018292', 'EAN13', 1),
  (13, 13, '4008430763909', 'EAN13', 1),
  (14, 14, '4009026034501', 'EAN13', 1),
  (15, 15, '0888641024905', 'EAN13', 1),
  (16, 16, '0012381573020', 'EAN13', 1),
  (17, 17, '4047024154152', 'EAN13', 1);


-- NGK CR8E fits Toyota Vios 2018-2023 and Honda City 2017-2023
INSERT INTO product_vehicle_fitments (product_id, vehicle_year_id) VALUES
  (1, 1),(1, 2),(1, 3),(1, 4),(1, 5),(1, 6),   -- Vios 2018-2023
  (1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27), -- City 2017-2023
  -- NGK BPR6ES fits Fortuner/Innova
  (2, 7),(2, 8),(2, 9),(2,10),(2,11),(2,12),    -- Fortuner 2016-2021
  (2,15),(2,16),(2,17),(2,18),(2,19),(2,20),    -- Innova 2016-2021
  -- Brembo pads fit Civic
  (8,28),(8,29),(8,30),(8,31),(8,32),(8,33),
  -- Monroe shocks fit Fortuner
  (10,7),(10,8),(10,9),(10,10),(10,11),(10,12);


-- ============================================================
-- 7. INVENTORY STOCK (opening stock)
-- ============================================================

-- MAIN store stock
INSERT INTO inventory_stock (product_variant_id, warehouse_id, qty_on_hand, qty_reserved, reorder_point, reorder_qty, max_stock_level, avg_cost) VALUES
  (1,  1, 45,  2, 10, 20, 100,  88.00),
  (2,  1, 38,  0, 10, 20, 100,  92.00),
  (3,  1, 20,  0,  5, 15,  60, 185.00),
  (4,  1, 60,  3, 15, 30, 150,  58.00),
  (5,  1, 35,  0, 10, 20,  80,  75.00),
  (6,  1, 28,  0,  8, 15,  70,  95.00),
  (7,  1, 22,  0,  8, 15,  60, 110.00),
  (8,  1, 15,  1,  5, 10,  40, 520.00),
  (9,  1, 18,  0,  5, 10,  40, 380.00),
  (10, 1,  8,  0,  3,  6,  20, 850.00),
  (11, 1, 50,  5, 12, 24, 120, 185.00),
  (12, 1, 30,  2, 10, 20,  80, 680.00),
  (13, 1, 40,  0, 10, 20, 100, 150.00),
  (14, 1, 25,  0,  8, 16,  60, 560.00),
  (15, 1, 12,  0,  5, 10,  30, 320.00),
  (16, 1,  6,  0,  2,  4,  15,1850.00),
  (17, 1, 22,  0,  8, 15,  50,  88.00);

-- BRANCH 2 stock
INSERT INTO inventory_stock (product_variant_id, warehouse_id, qty_on_hand, qty_reserved, reorder_point, reorder_qty, max_stock_level, avg_cost) VALUES
  (1,  2, 20,  0,  5, 10, 50,  88.00),
  (2,  2, 15,  0,  5, 10, 50,  92.00),
  (4,  2, 30,  0,  8, 15, 80,  58.00),
  (8,  2,  8,  0,  3,  6, 20, 520.00),
  (11, 2, 20,  2,  8, 16, 60, 185.00),
  (13, 2, 18,  0,  6, 12, 50, 150.00),
  (16, 2,  4,  0,  2,  4, 10,1850.00);

-- BODEGA (reserve stock)
INSERT INTO inventory_stock (product_variant_id, warehouse_id, qty_on_hand, qty_reserved, reorder_point, reorder_qty, max_stock_level, avg_cost) VALUES
  (1,  3, 100, 0, 20, 50, 300,  88.00),
  (2,  3,  80, 0, 20, 50, 300,  92.00),
  (4,  3, 150, 0, 30, 80, 400,  58.00),
  (11, 3,  80, 0, 20, 40, 200, 185.00),
  (13, 3,  60, 0, 15, 30, 150, 150.00),
  (16, 3,  10, 0,  3,  6,  20,1850.00);


-- ============================================================
-- 8. SUPPLIERS & SUPPLIER PRODUCTS
-- ============================================================

INSERT INTO suppliers (id, code, name, contact_person, email, phone, address, city, payment_terms, credit_limit, is_active) VALUES
  (1, 'SUP-NGK',    'NGK Philippines Inc.',          'Ben Tanaka',     'orders@ngkph.com',       '+632811001', 'Unit 3B Bonifacio High St, BGC', 'Taguig City',   30, 500000.00, 1),
  (2, 'SUP-DENSO',  'Denso Sales Philippines Inc.',  'Alice Yamamoto', 'supply@densoph.com',     '+632811002', '1234 EDSA, Mandaluyong',        'Mandaluyong',   30, 400000.00, 1),
  (3, 'SUP-BOSCH',  'Robert Bosch Philippines',       'Karl Müller',    'parts@boschph.com',      '+632811003', 'Science Hub Tower, Mckinley',   'Taguig City',   45, 600000.00, 1),
  (4, 'SUP-MOTUL',  'Motul Philippines Distributor',  'Pierre Blanc',   'orders@motulph.com',     '+632811004', '56 Timog Ave, Quezon City',     'Quezon City',   15, 300000.00, 1),
  (5, 'SUP-LOCAL',  'Cebu Auto Parts Wholesaler',     'Danny Ong',      'd.ong@cebuautoparts.ph', '+63321811005','123 M. Gotiaoco, Capitol Site', 'Cebu City',      7, 200000.00, 1);


INSERT INTO supplier_products (id, supplier_id, product_variant_id, supplier_sku, unit_cost, min_order_qty, lead_time_days, is_preferred, is_active, effective_date) VALUES
  (1,  1, 1,  'NGK-CR8E',    82.00,  24, 7,  1, 1, '2024-01-01'),
  (2,  1, 2,  'NGK-BPR6ES',  86.00,  24, 7,  1, 1, '2024-01-01'),
  (3,  2, 3,  'K20PRU11',   175.00,  12, 10, 1, 1, '2024-01-01'),
  (4,  5, 4,  'SAK-C109',    52.00,  48, 3,  1, 1, '2024-01-01'),
  (5,  3, 5,  'OF-A3R',      70.00,  24, 10, 1, 1, '2024-01-01'),
  (6,  5, 6,  'ACD-A1616C',  88.00,  24, 3,  1, 1, '2024-01-01'),
  (7,  3, 7,  'S0198',      102.00,  12, 10, 1, 1, '2024-01-01'),
  (8,  5, 8,  'BRM-P06020', 495.00,   6, 5,  1, 1, '2024-01-01'),
  (9,  5, 9,  'MON-BP740',  360.00,   6, 5,  1, 1, '2024-01-01'),
  (10, 5, 10, 'MON-E4552',  810.00,   4, 7,  1, 1, '2024-01-01'),
  (11, 4, 11, 'MOT5W301L',  178.00,  24, 14, 1, 1, '2024-01-01'),
  (12, 4, 12, 'MOT5W304L',  660.00,  12, 14, 1, 1, '2024-01-01'),
  (13, 5, 13, 'CASGTX1L',   142.00,  24, 3,  1, 1, '2024-01-01'),
  (14, 5, 14, 'CASGTX4L',   535.00,  12, 3,  1, 1, '2024-01-01'),
  (15, 5, 15, 'GAT-T223',   305.00,   6, 5,  1, 1, '2024-01-01'),
  (16, 5, 16, 'ACD-B24R',  1780.00,   2, 5,  1, 1, '2024-01-01'),
  (17, 3, 17, 'FF-001',      82.00,  12, 10, 1, 1, '2024-01-01');


-- ============================================================
-- 9. PURCHASE ORDERS
-- ============================================================

INSERT INTO purchase_orders (id, po_number, supplier_id, warehouse_id, status, order_date, expected_date, received_date, subtotal, tax_amount, total_amount, created_by) VALUES
  (1, 'PO-2025-001', 1, 1, 'received',          '2025-03-01', '2025-03-08', '2025-03-09', 6560.00, 787.20, 7347.20, 1),
  (2, 'PO-2025-002', 4, 1, 'received',          '2025-03-05', '2025-03-19', '2025-03-20', 9760.00,1171.20,10931.20, 1),
  (3, 'PO-2025-003', 5, 1, 'partially_received','2025-03-10', '2025-03-14', NULL,         18900.00,2268.00,21168.00, 2),
  (4, 'PO-2025-004', 3, 2, 'sent',              '2025-03-15', '2025-03-25', NULL,         11760.00,1411.20,13171.20, 4);


INSERT INTO purchase_order_items (purchase_order_id, product_variant_id, qty_ordered, qty_received, unit_cost, line_total) VALUES
  -- PO-2025-001 (NGK)
  (1, 1, 48,  48, 82.00,  3936.00),
  (1, 2, 24,  24, 86.00,  2064.00),
  -- PO-2025-002 (Motul)
  (2, 11, 48, 48, 178.00, 8544.00),
  (2, 12, 12, 12, 660.00, 7920.00),  -- over-weight correction below
  -- PO-2025-003 (Cebu Local)
  (3, 4,  96, 96, 52.00,  4992.00),
  (3, 8,   6,  6, 495.00, 2970.00),
  (3, 9,   6,  0, 360.00, 2160.00),  -- not received yet
  (3, 16,  2,  0,1780.00, 3560.00),  -- not received yet
  -- PO-2025-004 (Bosch)
  (4, 5,  24,  0, 70.00,  1680.00),
  (4, 7,  12,  0,102.00,  1224.00),
  (4, 17, 24,  0, 82.00,  1968.00);


-- ============================================================
-- 10. CUSTOMERS
-- ============================================================

INSERT INTO customers (id, code, first_name, last_name, email, phone, customer_type, credit_limit, outstanding_balance, is_active) VALUES
  (1,  'CUST-0001', 'Ramon',    'Dela Peña',   'ramon.dp@gmail.com',       '+63917201001', 'retail',     0.00,      0.00, 1),
  (2,  'CUST-0002', 'Cristina', 'Fernandez',   'c.fernandez@gmail.com',    '+63917201002', 'retail',     0.00,      0.00, 1),
  (3,  'CUST-0003', 'Mang Auto Parts',  '',    'orders@mangauto.ph',       '+63321201003', 'wholesale', 50000.00,  8500.00, 1),
  (4,  'CUST-0004', 'Ricardo',  'Soriano',     'r.soriano@hotmail.com',    '+63917201004', 'retail',     0.00,      0.00, 1),
  (5,  'CUST-0005', 'Aurora Motors Inc.', '',  'purchasing@auroramotors.ph','+63321201005','wholesale',100000.00,15000.00, 1),
  (6,  'CUST-0006', 'Joselito', 'Macaraeg',    'jmacaraeg@yahoo.com',      '+63917201006', 'retail',     0.00,      0.00, 1),
  (7,  'CUST-0007', 'Caridad',  'Lim',         'caridadlim@gmail.com',     '+63917201007', 'retail',     0.00,      0.00, 1),
  (8,  'CUST-0008', 'Speed Shop Cebu', '',     'hello@speedshopcebu.com',  '+63321201008', 'wholesale', 75000.00,   0.00, 1);


-- ============================================================
-- 11. POS — TERMINALS, SESSIONS, TRANSACTIONS
-- ============================================================

INSERT INTO pos_terminals (id, warehouse_id, terminal_code, name, is_active) VALUES
  (1, 1, 'POS-MAIN-01', 'Main Counter 1',   1),
  (2, 1, 'POS-MAIN-02', 'Main Counter 2',   1),
  (3, 2, 'POS-BR2-01',  'Branch 2 Counter', 1);


INSERT INTO payment_methods (id, code, name, type, is_active) VALUES
  (1, 'CASH',   'Cash',          'cash',          1),
  (2, 'GCASH',  'GCash',         'ewallet',       1),
  (3, 'MAYA',   'Maya',          'ewallet',       1),
  (4, 'VISA',   'Visa Card',     'card',          1),
  (5, 'MCARD',  'Mastercard',    'card',          1),
  (6, 'CREDIT', 'Store Credit',  'credit',        1),
  (7, 'BDO',    'BDO Bank Transfer','bank_transfer',1);


INSERT INTO discounts (id, code, name, type, value, applies_to, min_purchase, start_date, end_date, usage_limit, usage_count, is_active) VALUES
  (1, 'SENIOR10', 'Senior Citizen 10%',   'percentage',   10.00, 'transaction', NULL,      NULL,         NULL,       NULL, 0, 1),
  (2, 'PWD10',    'PWD Discount 10%',     'percentage',   10.00, 'transaction', NULL,      NULL,         NULL,       NULL, 0, 1),
  (3, 'BULK5',    'Bulk Purchase 5% Off', 'percentage',    5.00, 'transaction', 2000.00,   '2025-01-01', '2025-12-31', NULL, 0, 1),
  (4, 'FLAT100',  'Php 100 Off',          'fixed_amount', 100.00,'transaction', 1000.00,   '2025-03-01', '2025-03-31',  500, 0, 1);


-- Cash sessions
INSERT INTO cash_sessions (id, pos_terminal_id, cashier_id, session_code, status, opening_cash, closing_cash, expected_cash, cash_variance, opened_at, closed_at) VALUES
  (1, 1, 3, 'SES-20250320-001', 'closed',      5000.00, 28540.00, 28650.00,  -110.00, '2025-03-20 08:00:00', '2025-03-20 18:00:00'),
  (2, 1, 3, 'SES-20250321-001', 'closed',      5000.00, 31200.00, 31320.00,  -120.00, '2025-03-21 08:00:00', '2025-03-21 18:00:00'),
  (3, 2, 5, 'SES-20250321-002', 'closed',      3000.00, 15800.00, 15750.00,    50.00, '2025-03-21 09:00:00', '2025-03-21 17:00:00'),
  (4, 1, 3, 'SES-20250322-001', 'open',        5000.00, NULL,      NULL,        NULL, '2025-03-22 08:00:00', NULL);


-- Sales transactions
INSERT INTO sales_transactions (id, transaction_number, cash_session_id, pos_terminal_id, warehouse_id, customer_id, cashier_id, status, transaction_date, subtotal, discount_amount, taxable_amount, tax_amount, total_amount, amount_tendered, change_given) VALUES
  -- March 20 transactions
  (1,  'TXN-20250320-0001', 1, 1, 1, 1,    3, 'completed', '2025-03-20 09:15:00',  669.64,   0.00,  669.64,  80.36,  750.00,  800.00,   50.00),
  (2,  'TXN-20250320-0002', 1, 1, 1, NULL, 3, 'completed', '2025-03-20 10:30:00',  303.57,   0.00,  303.57,  36.43,  340.00,  340.00,    0.00),
  (3,  'TXN-20250320-0003', 1, 1, 1, 3,    3, 'completed', '2025-03-20 11:00:00', 3125.00, 156.25, 2968.75, 356.25, 3325.00, 3325.00,    0.00),
  (4,  'TXN-20250320-0004', 1, 1, 1, NULL, 3, 'completed', '2025-03-20 14:20:00',  491.07,   0.00,  491.07,  58.93,  550.00,  600.00,   50.00),
  (5,  'TXN-20250320-0005', 1, 1, 1, NULL, 3, 'voided',    '2025-03-20 15:00:00',  165.00,   0.00,  165.00,     0,   165.00,    0.00,    0.00),
  -- March 21 transactions
  (6,  'TXN-20250321-0001', 2, 1, 1, 2,    3, 'completed', '2025-03-21 09:05:00',  312.50,   0.00,  312.50,  37.50,  350.00,  350.00,    0.00),
  (7,  'TXN-20250321-0002', 2, 1, 1, NULL, 3, 'completed', '2025-03-21 10:10:00', 1339.29,   0.00, 1339.29, 160.71, 1500.00, 2000.00,  500.00),
  (8,  'TXN-20250321-0003', 3, 2, 1, 5,    5, 'completed', '2025-03-21 11:30:00', 8928.57, 446.43, 8482.14,1017.86, 9500.00, 9500.00,    0.00),
  (9,  'TXN-20250321-0004', 2, 1, 1, 4,    3, 'completed', '2025-03-21 13:00:00',  535.71,   0.00,  535.71,  64.29,  600.00,  600.00,    0.00),
  (10, 'TXN-20250321-0005', 2, 1, 1, NULL, 3, 'completed', '2025-03-21 16:00:00',  267.86,   0.00,  267.86,  32.14,  300.00,  500.00,  200.00),
  -- March 22 (open session)
  (11, 'TXN-20250322-0001', 4, 1, 1, 6,    3, 'completed', '2025-03-22 09:30:00',  312.50,   0.00,  312.50,  37.50,  350.00,  400.00,   50.00),
  (12, 'TXN-20250322-0002', 4, 1, 1, NULL, 3, 'completed', '2025-03-22 10:45:00', 3303.57,   0.00, 3303.57, 396.43, 3700.00, 4000.00,  300.00);


-- Sales transaction items
INSERT INTO sales_transaction_items (sales_transaction_id, product_variant_id, qty, unit_price, unit_cost, discount_amount, tax_amount, line_total) VALUES
  -- TXN-1: 2 NGK CR8E + 1 Oil Filter
  (1,  1,  2,  165.00,  88.00, 0, 39.60,  330.00),
  (1,  4,  2,  110.00,  58.00, 0, 26.40,  220.00),
  (1,  11, 1,  355.00, 185.00, 0, 42.60,  355.00),  -- subtotal ~669.64 ex-VAT
  -- TXN-2: 1 Bosch OilFilter + 1 Castrol 1L
  (2,  5,  1,  145.00,  75.00, 0, 17.40,  145.00),
  (2,  13, 1,  285.00, 150.00, 0, 34.20,  285.00),
  -- TXN-3: Wholesale - 10 NGK CR8E + 5 Oil Filters + 4L Oil x2 (with 5% bulk discount)
  (3,  1,  10, 165.00,  88.00, 0,198.00, 1650.00),
  (3,  4,  10, 110.00,  58.00, 0,132.00, 1100.00),
  (3,  12,  2, 1280.00, 680.00,0,153.60, 2560.00),  -- 4L Motul x2  (discount applied at header)
  -- TXN-4: Brake pads Monroe
  (4,  9,  1,  720.00, 380.00, 0, 86.40,  720.00),
  -- TXN-6: NGK BPR6ES x2
  (6,  2,  2,  175.00,  92.00, 0, 42.00,  350.00),
  -- TXN-7: Brembo pads + timing belt
  (7,  8,  1,  980.00, 520.00, 0,117.60,  980.00),
  (7,  15, 1,  620.00, 320.00, 0, 74.40,  620.00),
  -- TXN-8: Wholesale bulk — 5x Motul 4L + 1x Battery (5% bulk discount)
  (8,  12, 5, 1280.00, 680.00, 0,768.00, 6400.00),
  (8,  16, 1, 3500.00,1850.00, 0,420.00, 3500.00),
  -- TXN-9: Bosch air filter
  (9,  7,  1,  210.00, 110.00, 0, 25.20,  210.00),
  (9,  6,  1,  185.00,  95.00, 0, 22.20,  185.00),
  (9,  17, 1,  168.00,  88.00, 0, 20.16,  168.00),
  -- TXN-10: 1x Castrol 4L
  (10, 14, 1, 1040.00, 560.00, 0,124.80, 1040.00),  -- wrong price logged; note correction
  -- TXN-11: NGK CR8E x2
  (11, 1,  2,  165.00,  88.00, 0, 39.60,  330.00),
  -- TXN-12: Monroe shock x2 + Denso iridium x4
  (12, 10, 2, 1650.00, 850.00, 0,396.00, 3300.00),
  (12, 3,  4,  350.00, 185.00, 0,168.00, 1400.00);


-- Transaction payments
INSERT INTO transaction_payments (sales_transaction_id, payment_method_id, amount, reference_number) VALUES
  (1,  1, 800.00,  NULL),
  (2,  2, 340.00,  'GC-20250320-0092'),
  (3,  6, 3325.00, 'CREDIT-MANG-001'),
  (4,  1, 600.00,  NULL),
  (6,  3, 350.00,  'MY-20250321-0041'),
  (7,  1, 2000.00, NULL),
  (8,  7, 9500.00, 'BDO-TXN-20250321'),
  (9,  4, 600.00,  'VISA-0321-9901'),
  (10, 1, 500.00,  NULL),
  (11, 1, 400.00,  NULL),
  (12, 2,4000.00,  'GC-20250322-0118');


-- ============================================================
-- 12. INVOICES
-- ============================================================

INSERT INTO invoice_sequences (id, warehouse_id, series_code, series_label, prefix, current_number, zero_pad, start_number, end_number, is_active) VALUES
  (1, 1, 'SI',  'Sales Invoice',     'SI-2025-', 12, 6, 1, 9999, 1),
  (2, 2, 'SI',  'Sales Invoice',     'SI-B2-',    3, 6, 1, 9999, 1),
  (3, 1, 'OR',  'Official Receipt',  'OR-2025-',  9, 6, 1, 9999, 1);

INSERT INTO business_profile (id, warehouse_id, business_name, tagline, address_line1, city, province, zip_code, phone, mobile, email, tin, bir_accreditation_no, invoice_footer) VALUES
  (1, NULL, 'Juan dela Cruz Motor Parts & Accessories', 'Your Trusted Parts Supplier in Cebu',
   'Unit 5 M. Gotiaoco St., Capitol Site', 'Cebu City', 'Cebu', '6000',
   '+63322321001', '+63917111002', 'info@motorparts.ph',
   '123-456-789-000', 'BIR-ACC-2024-0042',
   'All sales final. Warranty claims within 7 days with official receipt. Thank you for your business!');

-- Invoices for completed transactions
INSERT INTO invoices (id, invoice_number, invoice_type, invoice_sequence_id, sales_transaction_id, warehouse_id, customer_id,
  buyer_name, buyer_tin, seller_name, seller_address, seller_tin,
  subtotal, discount_amount, taxable_amount, tax_amount, total_amount, amount_paid, change_given, balance_due,
  status, payment_status, issued_at, created_by) VALUES
  (1,  'SI-2025-000001', 'sales_invoice', 1, 1,  1, 1,    'Ramon Dela Peña',         NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  669.64, 0,   669.64,  80.36,  750.00,  800.00,  50.00, 0, 'issued', 'paid', '2025-03-20 09:16:00', 3),
  (2,  'SI-2025-000002', 'sales_invoice', 1, 2,  1, NULL, 'Walk-in Customer',        NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  303.57, 0,   303.57,  36.43,  340.00,  340.00,   0.00, 0, 'issued', 'paid', '2025-03-20 10:31:00', 3),
  (3,  'SI-2025-000003', 'sales_invoice', 1, 3,  1, 3,    'Mang Auto Parts',         NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000', 3125.00,156.25, 2968.75, 356.25, 3325.00, 3325.00,  0.00, 0, 'issued', 'paid', '2025-03-20 11:01:00', 3),
  (4,  'SI-2025-000004', 'sales_invoice', 1, 4,  1, NULL, 'Walk-in Customer',        NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  491.07, 0,   491.07,  58.93,  550.00,  600.00,  50.00, 0, 'issued', 'paid', '2025-03-20 14:21:00', 3),
  (5,  'SI-2025-000005', 'sales_invoice', 1, 6,  1, 2,    'Cristina Fernandez',      NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  312.50, 0,   312.50,  37.50,  350.00,  350.00,   0.00, 0, 'issued', 'paid', '2025-03-21 09:06:00', 3),
  (6,  'SI-2025-000006', 'sales_invoice', 1, 7,  1, NULL, 'Walk-in Customer',        NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000', 1339.29, 0,  1339.29, 160.71, 1500.00, 2000.00, 500.00, 0, 'issued', 'paid', '2025-03-21 10:11:00', 3),
  (7,  'SI-2025-000007', 'sales_invoice', 1, 8,  1, 5,    'Aurora Motors Inc.',      '987-654-321-000', 'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000', 8928.57,446.43,8482.14,1017.86,9500.00,9500.00,0.00,0,'issued','paid','2025-03-21 11:31:00', 5),
  (8,  'SI-2025-000008', 'sales_invoice', 1, 9,  1, 4,    'Ricardo Soriano',         NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  535.71, 0,   535.71,  64.29,  600.00,  600.00,   0.00, 0, 'issued', 'paid', '2025-03-21 13:01:00', 3),
  (9,  'SI-2025-000009', 'sales_invoice', 1, 10, 1, NULL, 'Walk-in Customer',        NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  267.86, 0,   267.86,  32.14,  300.00,  500.00, 200.00, 0, 'issued', 'paid', '2025-03-21 16:01:00', 3),
  (10, 'SI-2025-000010', 'sales_invoice', 1, 11, 1, 6,    'Joselito Macaraeg',       NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000',  312.50, 0,   312.50,  37.50,  350.00,  400.00,  50.00, 0, 'issued', 'paid', '2025-03-22 09:31:00', 3),
  (11, 'SI-2025-000011', 'sales_invoice', 1, 12, 1, NULL, 'Walk-in Customer',        NULL,  'Juan dela Cruz Motor Parts', 'Unit 5 M. Gotiaoco, Cebu City', '123-456-789-000', 3303.57, 0,  3303.57, 396.43, 3700.00, 4000.00, 300.00, 0, 'issued', 'paid', '2025-03-22 10:46:00', 3);


-- Invoice items (snapshot)
INSERT INTO invoice_items (invoice_id, line_number, product_variant_id, sku, description, unit_of_measure, qty, unit_price, discount_amount, tax_amount, line_total) VALUES
  (1, 1, 1,  'NGK-CR8E-STD',  'NGK Spark Plug CR8E',          'pcs', 2,  165.00, 0, 39.60,  330.00),
  (1, 2, 4,  'SAK-C109-STD',  'Sakura Oil Filter C-109',      'pcs', 2,  110.00, 0, 26.40,  220.00),
  (1, 3, 11, 'MOT-5W30-1L',   'Motul 5W-30 Engine Oil 1L',   'L',   1,  355.00, 0, 42.60,  355.00),
  (2, 1, 5,  'BSH-OFA3R-STD', 'Bosch Oil Filter OF-A3R',      'pcs', 1,  145.00, 0, 17.40,  145.00),
  (2, 2, 13, 'CAS-GTX-1L',    'Castrol GTX 10W-40 1L',       'L',   1,  285.00, 0, 34.20,  285.00),
  (3, 1, 1,  'NGK-CR8E-STD',  'NGK Spark Plug CR8E',          'pcs',10,  165.00, 0,198.00, 1650.00),
  (3, 2, 4,  'SAK-C109-STD',  'Sakura Oil Filter C-109',      'pcs',10,  110.00, 0,132.00, 1100.00),
  (3, 3, 12, 'MOT-5W30-4L',   'Motul 5W-30 Engine Oil 4L',   'L',   2, 1280.00, 0,153.60, 2560.00),
  (6, 1, 8,  'BRM-P06020-STD','Brembo Brake Pads P06020',     'set', 1,  980.00, 0,117.60,  980.00),
  (6, 2, 15, 'GAT-T223-STD',  'Gates Timing Belt T223',       'pcs', 1,  620.00, 0, 74.40,  620.00),
  (7, 1, 12, 'MOT-5W30-4L',   'Motul 5W-30 Engine Oil 4L',   'L',   5, 1280.00, 0,768.00, 6400.00),
  (7, 2, 16, 'ACD-B24R-STD',  'ACDelco Battery 24R',          'pcs', 1, 3500.00, 0,420.00, 3500.00),
  (11,1, 10, 'MON-E4552-STD', 'Monroe Front Shock Absorber',  'set', 2, 1650.00, 0,396.00, 3300.00),
  (11,2, 3,  'DNO-K20PR-STD', 'Denso Iridium Plug K20PR-U11','pcs', 4,  350.00, 0,168.00, 1400.00);


-- Invoice payments
INSERT INTO invoice_payments (invoice_id, payment_method_id, payment_method_name, amount, reference_number) VALUES
  (1,  1, 'Cash',           800.00,  NULL),
  (2,  2, 'GCash',          340.00,  'GC-20250320-0092'),
  (3,  6, 'Store Credit',  3325.00,  'CREDIT-MANG-001'),
  (4,  1, 'Cash',           600.00,  NULL),
  (5,  3, 'Maya',           350.00,  'MY-20250321-0041'),
  (6,  1, 'Cash',          2000.00,  NULL),
  (7,  7, 'BDO Bank Transfer',9500.00,'BDO-TXN-20250321'),
  (8,  4, 'Visa Card',      600.00,  'VISA-0321-9901'),
  (9,  1, 'Cash',           500.00,  NULL),
  (10, 1, 'Cash',           400.00,  NULL),
  (11, 2, 'GCash',         4000.00,  'GC-20250322-0118');


-- ============================================================
-- 13. SALES RETURNS
-- ============================================================

INSERT INTO sales_returns (id, return_number, original_transaction_id, warehouse_id, cashier_id, reason, refund_method_id, refund_amount, status) VALUES
  (1, 'RET-20250321-0001', 1, 1, 3, 'defective', 1, 165.00, 'completed');

INSERT INTO sales_return_items (sales_return_id, sales_txn_item_id, product_variant_id, qty_returned, unit_price, restock) VALUES
  (1, 1, 1, 1, 165.00, 0);  -- 1 NGK CR8E returned, defective (no restock)


-- ============================================================
-- 14. STOCK MOVEMENTS (opening stock entries)
-- ============================================================

INSERT INTO stock_movements (product_variant_id, warehouse_id, movement_type, reference_type, reference_id, qty_before, qty_change, qty_after, unit_cost, performed_by, created_at) VALUES
  -- Opening stock for MAIN warehouse (reference_id=1 = first stock adjustment)
  (1,  1, 'opening_stock', 'manual', 1, 0,  45,  45,  88.00, 1, '2025-01-01 08:00:00'),
  (2,  1, 'opening_stock', 'manual', 1, 0,  38,  38,  92.00, 1, '2025-01-01 08:00:00'),
  (3,  1, 'opening_stock', 'manual', 1, 0,  20,  20, 185.00, 1, '2025-01-01 08:00:00'),
  (4,  1, 'opening_stock', 'manual', 1, 0,  60,  60,  58.00, 1, '2025-01-01 08:00:00'),
  (5,  1, 'opening_stock', 'manual', 1, 0,  35,  35,  75.00, 1, '2025-01-01 08:00:00'),
  (6,  1, 'opening_stock', 'manual', 1, 0,  28,  28,  95.00, 1, '2025-01-01 08:00:00'),
  (7,  1, 'opening_stock', 'manual', 1, 0,  22,  22, 110.00, 1, '2025-01-01 08:00:00'),
  (8,  1, 'opening_stock', 'manual', 1, 0,  15,  15, 520.00, 1, '2025-01-01 08:00:00'),
  (9,  1, 'opening_stock', 'manual', 1, 0,  18,  18, 380.00, 1, '2025-01-01 08:00:00'),
  (10, 1, 'opening_stock', 'manual', 1, 0,   8,   8, 850.00, 1, '2025-01-01 08:00:00'),
  (11, 1, 'opening_stock', 'manual', 1, 0,  50,  50, 185.00, 1, '2025-01-01 08:00:00'),
  (12, 1, 'opening_stock', 'manual', 1, 0,  30,  30, 680.00, 1, '2025-01-01 08:00:00'),
  (13, 1, 'opening_stock', 'manual', 1, 0,  40,  40, 150.00, 1, '2025-01-01 08:00:00'),
  (14, 1, 'opening_stock', 'manual', 1, 0,  25,  25, 560.00, 1, '2025-01-01 08:00:00'),
  (15, 1, 'opening_stock', 'manual', 1, 0,  12,  12, 320.00, 1, '2025-01-01 08:00:00'),
  (16, 1, 'opening_stock', 'manual', 1, 0,   6,   6,1850.00, 1, '2025-01-01 08:00:00'),
  (17, 1, 'opening_stock', 'manual', 1, 0,  22,  22,  88.00, 1, '2025-01-01 08:00:00');


-- ============================================================
-- 15. PRICING & ANALYTICS TABLES
-- (price_tiers already seeded in migration; add tier rules and history)
-- ============================================================

-- Tier rules for top-selling products
INSERT INTO product_price_tier_rules (product_variant_id, price_tier_id, min_qty, tier_price, is_active, effective_date, created_by) VALUES
  -- NGK CR8E (variant 1)
  (1, 1, NULL,  165.00, 1, '2025-01-01', 1),  -- WALK_IN
  (1, 2, NULL,  140.00, 1, '2025-01-01', 1),  -- WHOLESALE
  (1, 3, NULL,  148.00, 1, '2025-01-01', 1),  -- DEALER
  (1, 4, 24,    130.00, 1, '2025-01-01', 1),  -- BULK (24+ pcs)
  -- Sakura Oil Filter (variant 4)
  (4, 1, NULL,  110.00, 1, '2025-01-01', 1),
  (4, 2, NULL,   90.00, 1, '2025-01-01', 1),
  (4, 3, NULL,   95.00, 1, '2025-01-01', 1),
  (4, 4, 48,     82.00, 1, '2025-01-01', 1),  -- BULK (48+)
  -- Motul 5W-30 1L (variant 11)
  (11, 1, NULL, 355.00, 1, '2025-01-01', 1),
  (11, 2, NULL, 295.00, 1, '2025-01-01', 1),
  (11, 3, NULL, 315.00, 1, '2025-01-01', 1),
  (11, 4, 24,   275.00, 1, '2025-01-01', 1),
  -- Motul 5W-30 4L (variant 12)
  (12, 1, NULL,1280.00, 1, '2025-01-01', 1),
  (12, 2, NULL,1050.00, 1, '2025-01-01', 1),
  (12, 3, NULL,1100.00, 1, '2025-01-01', 1),
  (12, 4, 12,   980.00, 1, '2025-01-01', 1),
  -- ACDelco Battery (variant 16)
  (16, 1, NULL,3500.00, 1, '2025-01-01', 1),
  (16, 2, NULL,2900.00, 1, '2025-01-01', 1),
  (16, 3, NULL,3100.00, 1, '2025-01-01', 1),
  -- Monroe Shock (variant 10)
  (10, 1, NULL,1650.00, 1, '2025-01-01', 1),
  (10, 2, NULL,1380.00, 1, '2025-01-01', 1),
  (10, 3, NULL,1450.00, 1, '2025-01-01', 1);


-- Product price history (simulated past changes)
-- NOTE: triggers are disabled here; inserting directly for seed purposes
INSERT INTO product_price_history (product_variant_id, old_price, new_price, changed_by, change_reason, effective_date) VALUES
  (1,  150.00, 158.00, 1, 'Cost increase from supplier Jan 2025',  '2025-01-15'),
  (1,  158.00, 165.00, 1, 'Market rate adjustment Feb 2025',       '2025-02-01'),
  (11, 320.00, 340.00, 1, 'Motul SRP update Q1 2025',              '2025-01-10'),
  (11, 340.00, 355.00, 1, 'FX adjustment – PHP/EUR movement',      '2025-02-15'),
  (16,3200.00,3350.00, 1, 'Battery lead acid costs up',            '2025-01-20'),
  (16,3350.00,3500.00, 1, 'ACDelco official SRP increase',         '2025-03-01');


-- Supplier cost history (simulated past changes)
INSERT INTO supplier_cost_history (supplier_product_id, supplier_id, product_variant_id, old_unit_cost, new_unit_cost, changed_by, change_reason, effective_date) VALUES
  (1,  1,  1,  78.00,  82.00, 1, 'NGK revised distributor price Jan 2025',  '2025-01-10'),
  (11, 4,  11,168.00, 178.00, 1, 'Motul PHP landed cost increase Feb 2025', '2025-02-10'),
  (16, 5,  16,1680.00,1780.00,1, 'Battery raw material surcharge Mar 2025', '2025-03-01');


-- ============================================================
-- 16. AUDIT LOG SAMPLES
-- ============================================================

INSERT INTO audit_log (user_id, table_name, record_id, action, old_values, new_values, ip_address) VALUES
  (1, 'products',          1,  'INSERT', NULL,
   '{"sku":"NGK-CR8E","selling_price":165.00}', '192.168.1.10'),
  (1, 'supplier_products', 1,  'UPDATE',
   '{"unit_cost":78.00}', '{"unit_cost":82.00}', '192.168.1.10'),
  (3, 'sales_transactions',5,  'UPDATE',
   '{"status":"pending"}', '{"status":"voided"}', '192.168.1.15'),
  (2, 'product_variants',  1,  'UPDATE',
   '{"selling_price":158.00}', '{"selling_price":165.00}', '192.168.1.12');

-- ============================================================
-- END OF SEED DATA
-- ============================================================
-- Records seeded:
--   brands (10), categories (22), uom (8), tax_rates (4)
--   vehicle_makes (8), vehicle_models (14), vehicle_years (47)
--   roles (5), permissions (22), users (5)
--   warehouses (3), products (15), product_variants (17)
--   product_barcodes (17), product_vehicle_fitments (32)
--   inventory_stock (24 rows across 3 warehouses)
--   suppliers (5), supplier_products (17)
--   purchase_orders (4), purchase_order_items (11)
--   customers (8)
--   pos_terminals (3), payment_methods (7), discounts (4)
--   cash_sessions (4), sales_transactions (12)
--   sales_transaction_items (21), transaction_payments (11)
--   invoice_sequences (3), business_profile (1)
--   invoices (11), invoice_items (14), invoice_payments (11)
--   sales_returns (1), sales_return_items (1)
--   stock_movements (17 opening entries)
--   price_tier_rules (21), product_price_history (6)
--   supplier_cost_history (3), audit_log (4)
-- ============================================================
