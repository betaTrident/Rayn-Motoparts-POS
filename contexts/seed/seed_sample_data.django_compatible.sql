-- ============================================================
-- DJANGO-COMPATIBLE SAMPLE SEED (PostgreSQL)
-- Rayn Motoparts POS
-- ============================================================
-- This file is adapted to the current Django schema.
-- Use this only AFTER running all Django migrations.
--
-- Recommended:
--   python manage.py seed_sample_data
--
-- Notes:
-- 1) User password hashing is not handled in SQL; use the management command for users.
-- 2) Invoice creation is normally generated through service logic from completed sales.
-- ============================================================

BEGIN;

-- Brands
INSERT INTO brands (name, slug, country_origin, is_active, created_at, updated_at)
VALUES
  ('NGK', 'ngk', 'JP', TRUE, NOW(), NOW()),
  ('Denso', 'denso', 'JP', TRUE, NOW(), NOW()),
  ('Bosch', 'bosch', 'DE', TRUE, NOW(), NOW()),
  ('Gates', 'gates', 'US', TRUE, NOW(), NOW()),
  ('Motul', 'motul', 'FR', TRUE, NOW(), NOW()),
  ('Castrol', 'castrol', 'GB', TRUE, NOW(), NOW()),
  ('Monroe', 'monroe', 'US', TRUE, NOW(), NOW()),
  ('Brembo', 'brembo', 'IT', TRUE, NOW(), NOW()),
  ('ACDelco', 'acdelco', 'US', TRUE, NOW(), NOW()),
  ('Sakura', 'sakura', 'JP', TRUE, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  country_origin = EXCLUDED.country_origin,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Categories (roots first)
INSERT INTO categories (parent_id, name, slug, sort_order, is_active, created_at, updated_at)
VALUES
  (NULL, 'Engine Parts', 'engine-parts', 1, TRUE, NOW(), NOW()),
  (NULL, 'Electrical', 'electrical', 2, TRUE, NOW(), NOW()),
  (NULL, 'Brakes & Suspension', 'brakes-suspension', 3, TRUE, NOW(), NOW()),
  (NULL, 'Filters', 'filters', 4, TRUE, NOW(), NOW()),
  (NULL, 'Lubricants & Fluids', 'lubricants-fluids', 5, TRUE, NOW(), NOW()),
  (NULL, 'Belts & Hoses', 'belts-hoses', 6, TRUE, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO categories (parent_id, name, slug, sort_order, is_active, created_at, updated_at)
VALUES
  ((SELECT id FROM categories WHERE slug = 'engine-parts'), 'Spark Plugs', 'spark-plugs', 1, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug = 'filters'), 'Oil Filters', 'oil-filters', 1, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug = 'brakes-suspension'), 'Brake Pads', 'brake-pads', 1, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug = 'lubricants-fluids'), 'Engine Oil', 'engine-oil', 1, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug = 'belts-hoses'), 'Timing Belts', 'timing-belts', 1, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug = 'electrical'), 'Batteries', 'batteries', 1, TRUE, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- UOM + tax
INSERT INTO units_of_measure (code, name, is_active, created_at, updated_at)
VALUES
  ('pcs', 'Piece', TRUE, NOW(), NOW()),
  ('set', 'Set', TRUE, NOW(), NOW()),
  ('L', 'Liter', TRUE, NOW(), NOW()),
  ('box', 'Box', TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO tax_rates (name, rate, is_active, created_at, updated_at)
VALUES
  ('VAT 12%', 0.1200, TRUE, NOW(), NOW()),
  ('Zero-rated', 0.0000, TRUE, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  rate = EXCLUDED.rate,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Warehouses
INSERT INTO warehouses (code, name, address, city, is_pos_location, is_active, created_at, updated_at)
VALUES
  ('MAIN', 'Main Store - Cebu City', 'Unit 5 M. Gotiaoco St., Capitol Site', 'Cebu City', TRUE, TRUE, NOW(), NOW()),
  ('BRANCH2', 'Branch 2 - Mandaue', '123 M.C. Briones St., Centro', 'Mandaue City', TRUE, TRUE, NOW(), NOW()),
  ('BODEGA', 'Main Bodega / Warehouse', 'Lot 9 Ouano Industrial Estate', 'Mandaue City', FALSE, TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  is_pos_location = EXCLUDED.is_pos_location,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Products
INSERT INTO products (
  category_id, brand_id, uom_id, tax_rate_id, sku, name, part_number, cost_price, selling_price,
  is_taxable, is_serialized, is_active, created_at, updated_at
)
VALUES
  ((SELECT id FROM categories WHERE slug='spark-plugs'), (SELECT id FROM brands WHERE slug='ngk'), (SELECT id FROM units_of_measure WHERE code='pcs'), (SELECT id FROM tax_rates WHERE name='VAT 12%'), 'NGK-CR8E', 'NGK Spark Plug CR8E', 'CR8E', 88.0000, 165.0000, TRUE, FALSE, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug='spark-plugs'), (SELECT id FROM brands WHERE slug='ngk'), (SELECT id FROM units_of_measure WHERE code='pcs'), (SELECT id FROM tax_rates WHERE name='VAT 12%'), 'NGK-BPR6ES', 'NGK Spark Plug BPR6ES', 'BPR6ES', 92.0000, 175.0000, TRUE, FALSE, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug='oil-filters'), (SELECT id FROM brands WHERE slug='sakura'), (SELECT id FROM units_of_measure WHERE code='pcs'), (SELECT id FROM tax_rates WHERE name='VAT 12%'), 'SAK-C-109', 'Sakura Oil Filter C-109', 'C-109', 58.0000, 110.0000, TRUE, FALSE, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug='brake-pads'), (SELECT id FROM brands WHERE slug='brembo'), (SELECT id FROM units_of_measure WHERE code='set'), (SELECT id FROM tax_rates WHERE name='VAT 12%'), 'BRM-P06020', 'Brembo Brake Pads P06020', 'P06020', 520.0000, 980.0000, TRUE, FALSE, TRUE, NOW(), NOW()),
  ((SELECT id FROM categories WHERE slug='engine-oil'), (SELECT id FROM brands WHERE slug='motul'), (SELECT id FROM units_of_measure WHERE code='L'), (SELECT id FROM tax_rates WHERE name='VAT 12%'), 'MOT-5W30-1L', 'Motul 5W-30 Engine Oil 1L', 'MOT5W301L', 185.0000, 355.0000, TRUE, FALSE, TRUE, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  part_number = EXCLUDED.part_number,
  cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Variants
INSERT INTO product_variants (product_id, variant_sku, variant_name, cost_price, selling_price, is_active, created_at, updated_at)
VALUES
  ((SELECT id FROM products WHERE sku='NGK-CR8E'), 'NGK-CR8E-STD', NULL, NULL, NULL, TRUE, NOW(), NOW()),
  ((SELECT id FROM products WHERE sku='NGK-BPR6ES'), 'NGK-BPR6ES-STD', NULL, NULL, NULL, TRUE, NOW(), NOW()),
  ((SELECT id FROM products WHERE sku='SAK-C-109'), 'SAK-C109-STD', NULL, NULL, NULL, TRUE, NOW(), NOW()),
  ((SELECT id FROM products WHERE sku='BRM-P06020'), 'BRM-P06020-STD', NULL, NULL, NULL, TRUE, NOW(), NOW()),
  ((SELECT id FROM products WHERE sku='MOT-5W30-1L'), 'MOT-5W30-1L', 'Motul 5W-30 - 1 Liter', 185.0000, 355.0000, TRUE, NOW(), NOW()),
  ((SELECT id FROM products WHERE sku='MOT-5W30-1L'), 'MOT-5W30-4L', 'Motul 5W-30 - 4 Liters', 680.0000, 1280.0000, TRUE, NOW(), NOW())
ON CONFLICT (variant_sku) DO UPDATE SET
  variant_name = EXCLUDED.variant_name,
  cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Customers
INSERT INTO customers (customer_code, first_name, last_name, email, phone, is_active, created_at, updated_at)
VALUES
  ('CUST-0001', 'Ramon', 'Dela Pena', 'ramon.dp@gmail.com', '+63917201001', TRUE, NOW(), NOW()),
  ('CUST-0002', 'Cristina', 'Fernandez', 'c.fernandez@gmail.com', '+63917201002', TRUE, NOW(), NOW()),
  ('CUST-0003', 'Mang Auto Parts', '', 'orders@mangauto.ph', '+63321201003', TRUE, NOW(), NOW())
ON CONFLICT (customer_code) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
