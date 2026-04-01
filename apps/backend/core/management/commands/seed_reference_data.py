from django.core.management.base import BaseCommand

from catalog.models import TaxRate, UnitOfMeasure
from pos.models import PaymentMethod
from pricing.models import PriceTier


class Command(BaseCommand):
    help = 'Seed baseline reference data for POS setup.'

    def handle(self, *args, **options):
        self._seed_uoms()
        self._seed_tax_rates()
        self._seed_payment_methods()
        self._seed_price_tiers()
        self.stdout.write(self.style.SUCCESS('Reference data seeding complete.'))

    def _seed_uoms(self):
        data = [
            ('PCS', 'Pieces'),
            ('SET', 'Set'),
            ('BOX', 'Box'),
            ('LTR', 'Liter'),
        ]
        for code, name in data:
            UnitOfMeasure.objects.get_or_create(
                code=code,
                defaults={'name': name, 'is_active': True},
            )

    def _seed_tax_rates(self):
        data = [
            ('VAT 12%', '12.0000'),
            ('Zero Rated', '0.0000'),
        ]
        for name, rate in data:
            TaxRate.objects.get_or_create(
                name=name,
                defaults={'rate': rate, 'is_active': True},
            )

    def _seed_payment_methods(self):
        data = [
            ('CASH', 'Cash'),
            ('GCASH', 'GCash'),
            ('CARD', 'Card'),
            ('BANK_TRANSFER', 'Bank Transfer'),
        ]
        for code, name in data:
            PaymentMethod.objects.get_or_create(
                code=code,
                defaults={'name': name, 'is_active': True},
            )

    def _seed_price_tiers(self):
        data = [
            ('RETAIL', 'Retail', 10),
            ('WHOLESALE', 'Wholesale', 20),
            ('VIP', 'VIP', 30),
        ]
        for code, name, priority in data:
            PriceTier.objects.get_or_create(
                code=code,
                defaults={'name': name, 'priority': priority, 'is_active': True},
            )
