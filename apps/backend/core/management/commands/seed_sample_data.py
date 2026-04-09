from decimal import Decimal

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
from inventory.models import InventoryStock
from pos.models import (
    CashSession,
    PaymentMethod,
    SalesTransaction,
    SalesTransactionItem,
)
from pos.services import complete_sale
from vehicles.models import ProductVehicleFitment, VehicleMake, VehicleModel


class Command(BaseCommand):
    help = 'Seed Django-compatible sample data adapted from contexts/seed_sample_data.postgresql.sql'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Seeding sample data...')

        users = self.seed_users_and_roles()
        refs = self.seed_reference_data()
        self.seed_vehicle_data()
        products = self.seed_products(refs)
        variants = self.seed_product_variants(products)
        self.seed_barcodes(variants)
        self.seed_fitments(products)
        self.seed_inventory(variants)
        customers = self.seed_customers()
        self.seed_pos(customers, users, variants)

        self.stdout.write(self.style.SUCCESS('Sample data seeding complete.'))

    def seed_users_and_roles(self):
        allowed_emails = ['superadmin@motorparts.ph', 'admin@motorparts.ph', 'staff@motorparts.ph']
        group_names = ['superadmin', 'admin', 'staff']
        groups = {name: Group.objects.get_or_create(name=name)[0] for name in group_names}

        # Remove legacy sample roles from prior seed runs.
        Group.objects.filter(name__in=['manager', 'stock_clerk', 'viewer']).delete()

        # Keep historical rows intact: legacy sample users may be referenced by
        # protected foreign keys (transactions, invoices, stock movements).
        # We deactivate them and clear roles so only superadmin/admin/staff can log in.
        User.objects.filter(email__in=[
            'juan.cruz@motorparts.ph',
            'c.villanueva@motorparts.ph',
            'l.gomez@motorparts.ph',
            'rosa.reyes@motorparts.ph',
        ]).exclude(email='staff@motorparts.ph').update(is_active=False)

        User.objects.exclude(email__in=allowed_emails).exclude(is_superuser=True).update(is_active=False)

        for legacy_user in User.objects.exclude(email__in=allowed_emails):
            legacy_user.groups.clear()

        data = [
            ('superadmin@motorparts.ph', 'superadmin', 'Dev', 'Admin', '+63917111000', '0000', 'superadmin'),
            ('admin@motorparts.ph', 'admin', 'Maria', 'Santos', '+63917111001', '0001', 'admin'),
            ('staff@motorparts.ph', 'staff', 'Rosa', 'Reyes', '+63917111003', '0003', 'staff'),
        ]

        out = {}
        for email, username, first_name, last_name, phone, pin_hash, role in data:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone,
                    'pin_hash': pin_hash,
                    'is_active': True,
                    'is_staff': role in {'superadmin', 'admin'},
                    'is_superuser': role == 'superadmin',
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
            ('batteries', 'Batteries', None, 7),
            ('spark-plugs', 'Spark Plugs', 'engine-parts', 1),
            ('brake-pads', 'Brake Pads', 'brakes-suspension', 1),
            ('oil-filters', 'Oil Filters', 'filters', 1),
            ('engine-oil', 'Engine Oil', 'lubricants-fluids', 1),
            ('timing-belts', 'Timing Belts', 'belts-hoses', 1),
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

        VehicleModel.objects.update_or_create(
            make=toyota,
            slug='vios',
            defaults={'name': 'Vios', 'is_active': True},
        )
        VehicleModel.objects.update_or_create(
            make=honda,
            slug='city',
            defaults={'name': 'City', 'is_active': True},
        )

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
                    'cost_price': Decimal(cost_price),
                    'tax_rate': refs['tax_rates']['VAT 12%'],
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
            ('MOT-5W30-1L', 'MOT-5W30-1L', None, None),
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
        ProductVehicleFitment.objects.update_or_create(
            product=products['NGK-CR8E'],
            vehicle_model=vios,
            year_range='2019-2023',
            defaults={'fitment_notes': None, 'is_active': True},
        )
        ProductVehicleFitment.objects.update_or_create(
            product=products['NGK-CR8E'],
            vehicle_model=city,
            year_range='2019-2023',
            defaults={'fitment_notes': None, 'is_active': True},
        )

    def seed_inventory(self, variants):
        stock_rows = [
            ('NGK-CR8E-STD', '45', '2', '10', '20', '100', '88'),
            ('NGK-BPR6ES-STD', '38', '0', '10', '20', '100', '92'),
            ('SAK-C109-STD', '60', '3', '15', '30', '150', '58'),
            ('BRM-P06020-STD', '15', '1', '5', '10', '40', '520'),
            ('MOT-5W30-1L', '50', '5', '12', '24', '120', '185'),
            ('MOT-5W30-4L', '30', '2', '10', '20', '80', '680'),
            ('GAT-T223-STD', '12', '0', '5', '10', '30', '320'),
            ('ACD-B24R-STD', '6', '0', '2', '4', '15', '1850'),
        ]

        for variant_sku, on_hand, reserved, reorder_point, reorder_qty, max_level, avg_cost in stock_rows:
            InventoryStock.objects.update_or_create(
                product_variant=variants[variant_sku],
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
        return {}

    def seed_procurement(self, users, variants, suppliers):
        return None

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
        return None

    def seed_pos(self, customers, users, variants):
        cash = PaymentMethod.objects.update_or_create(
            code='CASH', defaults={'name': 'Cash', 'is_active': True}
        )[0]
        gcash = PaymentMethod.objects.update_or_create(
            code='GCASH', defaults={'name': 'GCash', 'is_active': True}
        )[0]
        maya = PaymentMethod.objects.update_or_create(
            code='MAYA', defaults={'name': 'Maya', 'is_active': True}
        )[0]

        session, _ = CashSession.objects.update_or_create(
            session_code='CS-SEED-001',
            defaults={
                'cashier': users['staff'],
                'status': CashSession.Status.OPEN,
                'opening_balance': Decimal('5000.00'),
            },
        )

        self._create_and_complete_transaction(
            transaction_number='TXN-20250322-0001',
            session=session,
            customer=customers['CUST-0001'],
            cashier=users['staff'],
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
            customer=None,
            cashier=users['staff'],
            payment_method=gcash,
            amount_tendered=Decimal('2000.00'),
            items=[
                ('BRM-P06020-STD', '1', '980.00', '520.00', '12.0'),
                ('GAT-T223-STD', '1', '620.00', '320.00', '12.0'),
            ],
            variants=variants,
        )

        self._create_and_complete_transaction(
            transaction_number='TXN-20250322-0003',
            session=session,
            customer=customers['CUST-0002'],
            cashier=users['staff'],
            payment_method=maya,
            amount_tendered=Decimal('800.00'),
            items=[
                ('NGK-BPR6ES-STD', '2', '175.00', '92.00', '12.0'),
            ],
            variants=variants,
        )

    def _create_and_complete_transaction(
        self,
        transaction_number,
        session,
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
                'customer': customer,
                'cashier': cashier,
                'status': SalesTransaction.Status.PENDING,
                'subtotal': Decimal('0'),
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
