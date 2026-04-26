from django.test import TestCase

from .models import Category, Product, TaxRate, UnitOfMeasure
from .serializers import ProductReadSerializer


class ProductReadSerializerTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Brakes', slug='brakes')
        self.uom = UnitOfMeasure.objects.create(code='pcs', name='Pieces')
        self.tax_rate = TaxRate.objects.create(name='VAT 12%', rate='12.0000')

    def test_serializer_data_includes_status_fields_without_assertion(self):
        product = Product.objects.create(
            category=self.category,
            uom=self.uom,
            tax_rate=self.tax_rate,
            sku='PAD001',
            name='Brake Pad',
            part_number='BP-001',
            cost_price='100.0000',
            selling_price='150.0000',
            is_active=True,
            is_taxable=True,
            is_serialized=False,
        )

        data = ProductReadSerializer(product).data

        self.assertEqual(data['is_active'], True)
        self.assertEqual(data['is_available'], True)
        self.assertEqual(data['is_taxable'], True)
        self.assertEqual(data['is_serialized'], False)
