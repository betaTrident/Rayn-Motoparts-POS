from decimal import Decimal
from datetime import date

from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.db import transaction

from authentication.models import User
from catalog.models import (
    Brand,
    Category,
    Product,
    ProductBarcode,
    ProductVariant,
    TaxRate,
    UnitOfMeasure,
)
from customers.models import Customer
from inventory.models import InventoryStock, Warehouse
from pos.models import (
    CashSession,
    Discount,
    PaymentMethod,
    PosTerminal,
    SalesReturn,
    SalesReturnItem,
    SalesTransaction,
    SalesTransactionItem,
)
from pos.services import complete_sale
from pricing.models import PriceTier, ProductPriceHistory, ProductPriceTierRule, SupplierCostHistory
from procurement.models import PurchaseOrder, PurchaseOrderItem, Supplier, SupplierProduct
from vehicles.models import ProductVehicleFitment, VehicleMake, VehicleModel, VehicleYear


class Command(BaseCommand):
    help = 'Seed Django-compatible sample data adapted from contexts/seed_sample_data.postgresql.sql'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Seeding sample data...')

        warehouses = self.seed_warehouses()
        users = self.seed_users_and_roles(warehouses)
        refs = self.seed_reference_data()
        self.seed_vehicle_data()
        products = self.seed_products(refs)
        variants = self.seed_product_variants(products)
        self.seed_barcodes(variants)
        self.seed_fitments(products)
        self.seed_inventory(variants, warehouses)
        suppliers = self.seed_suppliers(variants)
        self.seed_procurement(users, warehouses, variants, suppliers)
        customers = self.seed_customers()
        self.seed_pricing(variants, users, suppliers)
        self.seed_pos(customers, users, warehouses, variants)

        self.stdout.write(self.style.SUCCESS('Sample data seeding complete.'))

    def seed_warehouses(self):
        data = [
            ('MAIN', 'Main Store - Cebu City', 'Unit 5 M. Gotiaoco St., Capitol Site', 'Cebu City', True),
            ('BRANCH2', 'Branch 2 - Mandaue', '123 M.C. Briones St., Centro', 'Mandaue City', True),
            ('BODEGA', 'Main Bodega / Warehouse', 'Lot 9 Ouano Industrial Estate', 'Mandaue City', False),
        ]
        out = {}
        for code, name, address, city, is_pos_location in data:
            obj, _ = Warehouse.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'address': address,
                    'city': city,
                    'is_pos_location': is_pos_location,
                    'is_active': True,
                },
            )
            out[code] = obj
        return out

    def seed_users_and_roles(self, warehouses):
        group_names = ['admin', 'manager', 'cashier', 'stock_clerk', 'viewer']
        groups = {name: Group.objects.get_or_create(name=name)[0] for name in group_names}

        data = [
            ('admin@motorparts.ph', 'admin', 'Maria', 'Santos', '+63917111001', '0001', 'MAIN', 'admin'),
            ('juan.cruz@motorparts.ph', 'jdcruz', 'Juan', 'Dela Cruz', '+63917111002', '0002', 'MAIN', 'manager'),
            ('rosa.reyes@motorparts.ph', 'rreyes', 'Rosa', 'Reyes', '+63917111003', '0003', 'MAIN', 'cashier'),
            ('c.villanueva@motorparts.ph', 'cvillanueva', 'Carlos', 'Villanueva', '+63917111004', '0004', 'BRANCH2', 'stock_clerk'),
            ('l.gomez@motorparts.ph', 'lgomez', 'Luisa', 'Gomez', '+63917111005', '0005', 'BRANCH2', 'cashier'),
        ]

        out = {}
        for email, username, first_name, last_name, phone, pin_hash, wh_code, role in data:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone,
                    'pin_hash': pin_hash,
                    'warehouse': warehouses[wh_code],
                    'is_active': True,
                },
            )
            user.set_password('password123')
            user.save(update_fields=['password', 'updated_at'])
            user.groups.clear()
            user.groups.add(groups[role])
            out[username] = user

        return out

    def seed_reference_data(self):
        brands_data = [
            ('NGK', 'ngk', 'JP'),
            ('Denso', 'denso', 'JP'),
            ('Bosch', 'bosch', 'DE'),
            ('Gates', 'gates', 'US'),
            ('Motul', 'motul', 'FR'),
            ('Castrol', 'castrol', 'GB'),
            ('Monroe', 'monroe', 'US'),
            ('Brembo', 'brembo', 'IT'),
            ('ACDelco', 'acdelco', 'US'),
            ('Sakura', 'sakura', 'JP'),
        ]
        brands = {}
        for name, slug, origin in brands_data:
            brands[name] = Brand.objects.update_or_create(
                slug=slug,
                defaults={'name': name, 'country_origin': origin, 'is_active': True},
            )[0]

        categories_data = [
            ('engine-parts', 'Engine Parts', None, 1),
            ('electrical', 'Electrical', None, 2),
            ('brakes-suspension', 'Brakes & Suspension', None, 3),
            ('filters', 'Filters', None, 4),
            ('lubricants-fluids', 'Lubricants & Fluids', None, 5),
            ('belts-hoses', 'Belts & Hoses', None, 6),
            ('spark-plugs', 'Spark Plugs', 'engine-parts', 1),
            ('brake-pads', 'Brake Pads', 'brakes-suspension', 1),
            ('oil-filters', 'Oil Filters', 'filters', 1),
            ('engine-oil', 'Engine Oil', 'lubricants-fluids', 1),
            ('timing-belts', 'Timing Belts', 'belts-hoses', 1),
            ('batteries', 'Batteries', 'electrical', 1),
        ]
        categories = {}
        for slug, name, parent_slug, sort_order in categories_data:
            parent = categories.get(parent_slug) if parent_slug else None
            categories[slug] = Category.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'parent': parent,
                    'sort_order': sort_order,
                    'is_active': True,
                },
            )[0]

        uom_data = [('pcs', 'Piece'), ('set', 'Set'), ('L', 'Liter'), ('box', 'Box')]
        uoms = {
            code: UnitOfMeasure.objects.update_or_create(
                code=code,
                defaults={'name': name, 'is_active': True},
            )[0]
            for code, name in uom_data
        }

        tax_rates_data = [('VAT 12%', Decimal('0.1200')), ('Zero-rated', Decimal('0.0000'))]
        tax_rates = {
            name: TaxRate.objects.update_or_create(
                name=name,
                defaults={'rate': rate, 'is_active': True},
            )[0]
            for name, rate in tax_rates_data
        }

        return {'brands': brands, 'categories': categories, 'uoms': uoms, 'tax_rates': tax_rates}

    def seed_vehicle_data(self):
        toyota = VehicleMake.objects.update_or_create(
            slug='toyota', defaults={'name': 'Toyota', 'is_active': True}
        )[0]
        honda = VehicleMake.objects.update_or_create(
            slug='honda-car', defaults={'name': 'Honda', 'is_active': True}
        )[0]

        vios = VehicleModel.objects.update_or_create(
            make=toyota, slug='vios', defaults={'name': 'Vios', 'is_active': True}
        )[0]
        city = VehicleModel.objects.update_or_create(
            make=honda, slug='city', defaults={'name': 'City', 'is_active': True}
        )[0]

        for year in [2019, 2020, 2021, 2022, 2023]:
            VehicleYear.objects.update_or_create(model=vios, year=year, defaults={'is_active': True})
            VehicleYear.objects.update_or_create(model=city, year=year, defaults={'is_active': True})

    def seed_products(self, refs):
        products_data = [
            ('NGK-CR8E', 'NGK Spark Plug CR8E', 'CR8E', 'spark-plugs', 'NGK', 'pcs', '88.00', '165.00'),
            ('NGK-BPR6ES', 'NGK Spark Plug BPR6ES', 'BPR6ES', 'spark-plugs', 'NGK', 'pcs', '92.00', '175.00'),
            ('SAK-C-109', 'Sakura Oil Filter C-109', 'C-109', 'oil-filters', 'Sakura', 'pcs', '58.00', '110.00'),
            ('BRM-P06020', 'Brembo Brake Pads P06020', 'P06020', 'brake-pads', 'Brembo', 'set', '520.00', '980.00'),
            ('MOT-5W30-1L', 'Motul 5W-30 Engine Oil 1L', 'MOT5W301L', 'engine-oil', 'Motul', 'L', '185.00', '355.00'),
            ('GAT-T223', 'Gates Timing Belt T223', 'T223', 'timing-belts', 'Gates', 'pcs', '320.00', '620.00'),
            ('ACD-B24R', 'ACDelco Battery 24R', 'B24R-N', 'batteries', 'ACDelco', 'pcs', '1850.00', '3500.00'),
        ]

        products = {}
        for sku, name, part_number, category_slug, brand_name, uom_code, cost_price, selling_price in products_data:
            products[sku] = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'part_number': part_number,
                    'category': refs['categories'][category_slug],
                    'brand': refs['brands'][brand_name],
                    'uom': refs['uoms'][uom_code],
                    'tax_rate': refs['tax_rates']['VAT 12%'],
                    'cost_price': Decimal(cost_price),
                    'selling_price': Decimal(selling_price),
                    'is_taxable': True,
                    'is_active': True,
                },
            )[0]

        return products

    def seed_product_variants(self, products):
        variants_data = [
            ('NGK-CR8E-STD', 'NGK-CR8E', None, None),
            ('NGK-BPR6ES-STD', 'NGK-BPR6ES', None, None),
            ('SAK-C109-STD', 'SAK-C-109', None, None),
            ('BRM-P06020-STD', 'BRM-P06020', None, None),
            ('MOT-5W30-1L', 'MOT-5W30-1L', 'Motul 5W-30 - 1 Liter', '355.00'),
            ('MOT-5W30-4L', 'MOT-5W30-1L', 'Motul 5W-30 - 4 Liters', '1280.00'),
            ('GAT-T223-STD', 'GAT-T223', None, None),
            ('ACD-B24R-STD', 'ACD-B24R', None, None),
        ]

        variants = {}
        for variant_sku, product_sku, variant_name, selling_price in variants_data:
            defaults = {
                'product': products[product_sku],
                'variant_name': variant_name,
                'is_active': True,
            }
            if selling_price is not None:
                defaults['selling_price'] = Decimal(selling_price)
            variants[variant_sku] = ProductVariant.objects.update_or_create(
                variant_sku=variant_sku,
                defaults=defaults,
            )[0]

        return variants

    def seed_barcodes(self, variants):
        barcodes = [
            ('NGK-CR8E-STD', '4548774054361'),
            ('NGK-BPR6ES-STD', '4548774015370'),
            ('SAK-C109-STD', '4965075260116'),
            ('BRM-P06020-STD', '8020584073958'),
            ('MOT-5W30-1L', '3374650012443'),
            ('MOT-5W30-4L', '3374650018292'),
            ('GAT-T223-STD', '0888641024905'),
            ('ACD-B24R-STD', '0012381573020'),
        ]
        for variant_sku, barcode in barcodes:
            ProductBarcode.objects.update_or_create(
                barcode=barcode,
                defaults={
                    'product_variant': variants[variant_sku],
                    'is_primary': True,
                    'is_active': True,
                },
            )

    def seed_fitments(self, products):
        vios = VehicleModel.objects.get(slug='vios')
        city = VehicleModel.objects.get(slug='city')

        for year in [2019, 2020, 2021, 2022, 2023]:
            vy_vios = VehicleYear.objects.get(model=vios, year=year)
            vy_city = VehicleYear.objects.get(model=city, year=year)
            ProductVehicleFitment.objects.update_or_create(
                product=products['NGK-CR8E'], vehicle_year=vy_vios, defaults={'is_active': True}
            )
            ProductVehicleFitment.objects.update_or_create(
                product=products['NGK-CR8E'], vehicle_year=vy_city, defaults={'is_active': True}
            )

    def seed_inventory(self, variants, warehouses):
        stock_rows = [
            ('NGK-CR8E-STD', 'MAIN', '45', '2', '10', '20', '100', '88'),
            ('NGK-BPR6ES-STD', 'MAIN', '38', '0', '10', '20', '100', '92'),
            ('SAK-C109-STD', 'MAIN', '60', '3', '15', '30', '150', '58'),
            ('BRM-P06020-STD', 'MAIN', '15', '1', '5', '10', '40', '520'),
            ('MOT-5W30-1L', 'MAIN', '50', '5', '12', '24', '120', '185'),
            ('MOT-5W30-4L', 'MAIN', '30', '2', '10', '20', '80', '680'),
            ('GAT-T223-STD', 'MAIN', '12', '0', '5', '10', '30', '320'),
            ('ACD-B24R-STD', 'MAIN', '6', '0', '2', '4', '15', '1850'),
            ('NGK-CR8E-STD', 'BRANCH2', '20', '0', '5', '10', '50', '88'),
            ('NGK-BPR6ES-STD', 'BRANCH2', '15', '0', '5', '10', '50', '92'),
            ('SAK-C109-STD', 'BRANCH2', '30', '0', '8', '15', '80', '58'),
        ]

        for variant_sku, wh_code, on_hand, reserved, reorder_point, reorder_qty, max_level, avg_cost in stock_rows:
            InventoryStock.objects.update_or_create(
                product_variant=variants[variant_sku],
                warehouse=warehouses[wh_code],
                defaults={
                    'qty_on_hand': Decimal(on_hand),
                    'qty_reserved': Decimal(reserved),
                    'reorder_point': Decimal(reorder_point),
                    'reorder_qty': Decimal(reorder_qty),
                    'max_stock_level': Decimal(max_level),
                    'avg_cost': Decimal(avg_cost),
                },
            )

    def seed_suppliers(self, variants):
        suppliers_data = [
            ('SUP-NGK', 'NGK Philippines Inc.', 'orders@ngkph.com', '+632811001', 'Taguig City', 30),
            ('SUP-BOSCH', 'Robert Bosch Philippines', 'parts@boschph.com', '+632811003', 'Taguig City', 45),
            ('SUP-MOTUL', 'Motul Philippines Distributor', 'orders@motulph.com', '+632811004', 'Quezon City', 15),
            ('SUP-LOCAL', 'Cebu Auto Parts Wholesaler', 'd.ong@cebuautoparts.ph', '+63321811005', 'Cebu City', 7),
        ]
        suppliers = {}
        for code, name, email, phone, city, terms in suppliers_data:
            suppliers[code] = Supplier.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'email': email,
                    'phone': phone,
                    'city': city,
                    'payment_terms_days': terms,
                    'is_active': True,
                },
            )[0]

        sp_data = [
            ('SUP-NGK', 'NGK-CR8E-STD', 'NGK-CR8E', '82.00', 7),
            ('SUP-NGK', 'NGK-BPR6ES-STD', 'NGK-BPR6ES', '86.00', 7),
            ('SUP-LOCAL', 'SAK-C109-STD', 'SAK-C109', '52.00', 3),
            ('SUP-LOCAL', 'BRM-P06020-STD', 'BRM-P06020', '495.00', 5),
            ('SUP-MOTUL', 'MOT-5W30-1L', 'MOT5W301L', '178.00', 14),
            ('SUP-MOTUL', 'MOT-5W30-4L', 'MOT5W304L', '660.00', 14),
            ('SUP-LOCAL', 'ACD-B24R-STD', 'ACD-B24R', '1780.00', 5),
        ]
        for sup_code, variant_sku, supplier_sku, last_cost, lead in sp_data:
            SupplierProduct.objects.update_or_create(
                supplier=suppliers[sup_code],
                product_variant=variants[variant_sku],
                defaults={
                    'supplier_sku': supplier_sku,
                    'last_cost': Decimal(last_cost),
                    'lead_time_days': lead,
                    'is_preferred': True,
                    'is_active': True,
                },
            )

        return suppliers

    def seed_procurement(self, users, warehouses, variants, suppliers):
        po_1, _ = PurchaseOrder.objects.update_or_create(
            po_number='PO-2025-001',
            defaults={
                'supplier': suppliers['SUP-NGK'],
                'warehouse': warehouses['MAIN'],
                'status': PurchaseOrder.Status.RECEIVED,
                'ordered_by': users['admin'],
                'subtotal': Decimal('6000.0000'),
                'tax_amount': Decimal('720.0000'),
                'total_amount': Decimal('6720.0000'),
            },
        )
        PurchaseOrderItem.objects.update_or_create(
            purchase_order=po_1,
            product_variant=variants['NGK-CR8E-STD'],
            defaults={
                'ordered_qty': Decimal('48.0000'),
                'received_qty': Decimal('48.0000'),
                'unit_cost': Decimal('82.000000'),
            },
        )
        PurchaseOrderItem.objects.update_or_create(
            purchase_order=po_1,
            product_variant=variants['NGK-BPR6ES-STD'],
            defaults={
                'ordered_qty': Decimal('24.0000'),
                'received_qty': Decimal('24.0000'),
                'unit_cost': Decimal('86.000000'),
            },
        )

        po_2, _ = PurchaseOrder.objects.update_or_create(
            po_number='PO-2025-002',
            defaults={
                'supplier': suppliers['SUP-MOTUL'],
                'warehouse': warehouses['MAIN'],
                'status': PurchaseOrder.Status.PARTIALLY_RECEIVED,
                'ordered_by': users['jdcruz'],
                'subtotal': Decimal('16464.0000'),
                'tax_amount': Decimal('1975.6800'),
                'total_amount': Decimal('18439.6800'),
            },
        )
        PurchaseOrderItem.objects.update_or_create(
            purchase_order=po_2,
            product_variant=variants['MOT-5W30-1L'],
            defaults={
                'ordered_qty': Decimal('48.0000'),
                'received_qty': Decimal('48.0000'),
                'unit_cost': Decimal('178.000000'),
            },
        )
        PurchaseOrderItem.objects.update_or_create(
            purchase_order=po_2,
            product_variant=variants['MOT-5W30-4L'],
            defaults={
                'ordered_qty': Decimal('24.0000'),
                'received_qty': Decimal('12.0000'),
                'unit_cost': Decimal('660.000000'),
            },
        )

    def seed_customers(self):
        data = [
            ('CUST-0001', 'Ramon', 'Dela Pena', 'ramon.dp@gmail.com', '+63917201001'),
            ('CUST-0002', 'Cristina', 'Fernandez', 'c.fernandez@gmail.com', '+63917201002'),
            ('CUST-0003', 'Mang Auto Parts', '', 'orders@mangauto.ph', '+63321201003'),
            ('CUST-0004', 'Ricardo', 'Soriano', 'r.soriano@hotmail.com', '+63917201004'),
        ]
        customers = {}
        for code, first, last, email, phone in data:
            customers[code] = Customer.objects.update_or_create(
                customer_code=code,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'email': email,
                    'phone': phone,
                    'is_active': True,
                },
            )[0]
        return customers

    def seed_pricing(self, variants, users, suppliers):
        tiers_data = [('RETAIL', 'Retail', 10), ('WHOLESALE', 'Wholesale', 20), ('VIP', 'VIP', 30)]
        tiers = {}
        for code, name, priority in tiers_data:
            tiers[code] = PriceTier.objects.update_or_create(
                code=code,
                defaults={'name': name, 'priority': priority, 'is_active': True},
            )[0]

        rules_data = [
            ('NGK-CR8E-STD', 'RETAIL', '1', '165.00'),
            ('NGK-CR8E-STD', 'WHOLESALE', '10', '140.00'),
            ('SAK-C109-STD', 'RETAIL', '1', '110.00'),
            ('SAK-C109-STD', 'WHOLESALE', '20', '90.00'),
            ('MOT-5W30-1L', 'RETAIL', '1', '355.00'),
            ('MOT-5W30-4L', 'WHOLESALE', '12', '980.00'),
        ]
        for variant_sku, tier_code, min_qty, price in rules_data:
            ProductPriceTierRule.objects.update_or_create(
                product_variant=variants[variant_sku],
                price_tier=tiers[tier_code],
                effective_date='2025-01-01',
                defaults={
                    'min_qty': Decimal(min_qty),
                    'price': Decimal(price),
                },
            )

        ProductPriceHistory.objects.get_or_create(
            product_variant=variants['NGK-CR8E-STD'],
            old_price=Decimal('158.0000'),
            new_price=Decimal('165.0000'),
            changed_by=users['admin'],
            effective_date=date(2025, 2, 1),
        )
        ProductPriceHistory.objects.get_or_create(
            product_variant=variants['MOT-5W30-1L'],
            old_price=Decimal('340.0000'),
            new_price=Decimal('355.0000'),
            changed_by=users['admin'],
            effective_date=date(2025, 2, 15),
        )

        SupplierCostHistory.objects.get_or_create(
            supplier=suppliers['SUP-NGK'],
            product_variant=variants['NGK-CR8E-STD'],
            old_cost=Decimal('78.000000'),
            new_cost=Decimal('82.000000'),
            changed_by=users['admin'],
            effective_date=date(2025, 1, 10),
        )
        SupplierCostHistory.objects.get_or_create(
            supplier=suppliers['SUP-MOTUL'],
            product_variant=variants['MOT-5W30-1L'],
            old_cost=Decimal('168.000000'),
            new_cost=Decimal('178.000000'),
            changed_by=users['admin'],
            effective_date=date(2025, 2, 10),
        )

    def seed_pos(self, customers, users, warehouses, variants):
        terminal, _ = PosTerminal.objects.update_or_create(
            code='POS-MAIN-01',
            defaults={'name': 'Main Counter 1', 'warehouse': warehouses['MAIN'], 'is_active': True},
        )
        terminal_b2, _ = PosTerminal.objects.update_or_create(
            code='POS-BR2-01',
            defaults={'name': 'Branch 2 Counter', 'warehouse': warehouses['BRANCH2'], 'is_active': True},
        )

        cash = PaymentMethod.objects.update_or_create(
            code='CASH', defaults={'name': 'Cash', 'is_active': True}
        )[0]
        gcash = PaymentMethod.objects.update_or_create(
            code='GCASH', defaults={'name': 'GCash', 'is_active': True}
        )[0]
        maya = PaymentMethod.objects.update_or_create(
            code='MAYA', defaults={'name': 'Maya', 'is_active': True}
        )[0]

        Discount.objects.update_or_create(
            name='Bulk Purchase 5% Off',
            defaults={'discount_type': Discount.DiscountType.PERCENT, 'value': Decimal('5.0'), 'is_active': True},
        )

        session, _ = CashSession.objects.update_or_create(
            pos_terminal=terminal,
            cashier=users['rreyes'],
            status=CashSession.Status.OPEN,
            defaults={'opening_balance': Decimal('5000.00')},
        )

        branch_session, _ = CashSession.objects.update_or_create(
            pos_terminal=terminal_b2,
            cashier=users['lgomez'],
            status=CashSession.Status.OPEN,
            defaults={'opening_balance': Decimal('3000.00')},
        )

        self._create_and_complete_transaction(
            transaction_number='TXN-20250322-0001',
            session=session,
            terminal=terminal,
            warehouse=warehouses['MAIN'],
            customer=customers['CUST-0001'],
            cashier=users['rreyes'],
            payment_method=cash,
            amount_tendered=Decimal('500.00'),
            items=[
                ('NGK-CR8E-STD', '2', '165.00', '88.00', '12.0'),
                ('SAK-C109-STD', '1', '110.00', '58.00', '12.0'),
            ],
            variants=variants,
        )

        self._create_and_complete_transaction(
            transaction_number='TXN-20250322-0002',
            session=session,
            terminal=terminal,
            warehouse=warehouses['MAIN'],
            customer=None,
            cashier=users['rreyes'],
            payment_method=gcash,
            amount_tendered=Decimal('2000.00'),
            items=[
                ('BRM-P06020-STD', '1', '980.00', '520.00', '12.0'),
                ('GAT-T223-STD', '1', '620.00', '320.00', '12.0'),
            ],
            variants=variants,
        )

        txn_branch = self._create_and_complete_transaction(
            transaction_number='TXN-20250322-0003',
            session=branch_session,
            terminal=terminal_b2,
            warehouse=warehouses['BRANCH2'],
            customer=customers['CUST-0002'],
            cashier=users['lgomez'],
            payment_method=maya,
            amount_tendered=Decimal('800.00'),
            items=[
                ('NGK-BPR6ES-STD', '2', '175.00', '92.00', '12.0'),
            ],
            variants=variants,
        )

        sales_return, return_created = SalesReturn.objects.get_or_create(
            sales_transaction=txn_branch,
            defaults={
                'warehouse': warehouses['BRANCH2'],
                'cashier': users['lgomez'],
                'reason': 'defective',
            },
        )
        if return_created:
            SalesReturnItem.objects.create(
                sales_return=sales_return,
                product_variant=variants['NGK-BPR6ES-STD'],
                qty_returned=Decimal('1.0000'),
                unit_price=Decimal('175.0000'),
                restock=False,
            )

    def _create_and_complete_transaction(
        self,
        transaction_number,
        session,
        terminal,
        warehouse,
        customer,
        cashier,
        payment_method,
        amount_tendered,
        items,
        variants,
    ):
        txn, created = SalesTransaction.objects.get_or_create(
            transaction_number=transaction_number,
            defaults={
                'cash_session': session,
                'pos_terminal': terminal,
                'warehouse': warehouse,
                'customer': customer,
                'cashier': cashier,
                'status': SalesTransaction.Status.PENDING,
                'subtotal': Decimal('0'),
                'discount_amount': Decimal('0'),
                'taxable_amount': Decimal('0'),
                'tax_amount': Decimal('0'),
                'total_amount': Decimal('0'),
            },
        )

        if created:
            for variant_sku, qty, unit_price, unit_cost, tax_rate in items:
                SalesTransactionItem.objects.create(
                    sales_transaction=txn,
                    product_variant=variants[variant_sku],
                    qty=Decimal(qty),
                    unit_price=Decimal(unit_price),
                    unit_cost=Decimal(unit_cost),
                    tax_rate=Decimal(tax_rate),
                )

            txn_items = list(txn.items.all())
            subtotal = sum((item.line_subtotal for item in txn_items), Decimal('0'))
            tax_amount = sum((item.line_tax_amount for item in txn_items), Decimal('0'))
            total_amount = sum((item.line_total for item in txn_items), Decimal('0'))

            txn.subtotal = subtotal
            txn.taxable_amount = subtotal
            txn.tax_amount = tax_amount
            txn.total_amount = total_amount
            txn.save(update_fields=['subtotal', 'taxable_amount', 'tax_amount', 'total_amount', 'updated_at'])

            complete_sale(
                transaction_id=txn.id,
                amount_tendered=amount_tendered,
                payment_method_id=payment_method.id,
                performed_by=cashier,
            )

        return txn
