from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.models import Permission, Role, RolePermission
from catalog.models import Category, Product, ProductVariant, TaxRate, UnitOfMeasure

User = get_user_model()


class CatalogSecurityAndTaxTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Brakes', slug='brakes')
        self.uom = UnitOfMeasure.objects.create(code='PCS', name='Pieces')
        self.tax_rate_vat = TaxRate.objects.create(name='VAT 12%', rate='12.0000', is_active=True)
        self.tax_rate_zero = TaxRate.objects.create(name='Zero Rated', rate='0.0000', is_active=True)

        self.product = Product.objects.create(
            category=self.category,
            uom=self.uom,
            tax_rate=self.tax_rate_vat,
            sku='PAD001',
            name='Brake Pad',
            part_number='BP-001',
            cost_price='100.0000',
            selling_price='150.0000',
            is_active=True,
            is_taxable=True,
            is_serialized=False,
        )
        ProductVariant.objects.create(
            product=self.product,
            variant_sku='PAD001-STD',
            variant_name='Standard',
            attributes={'size': 'Small'},
            cost_price='100.0000',
            selling_price='150.0000',
            is_active=True,
        )

        self.staff_role = Role.objects.create(name='staff', is_active=True)
        self.admin_role = Role.objects.create(name='admin', is_active=True)

        self.staff_user = self._create_user('staff@example.com', self.staff_role)
        self.admin_user = self._create_user('admin@example.com', self.admin_role)

        self.products_read = self._grant_permission('products', 'read')
        self.products_write = self._grant_permission('products', 'write')
        self.products_pricing = self._grant_permission('products', 'pricing')
        self.products_cost = self._grant_permission('products', 'cost')

        self._assign_permissions(self.staff_role, [self.products_read, self.products_write])
        self._assign_permissions(
            self.admin_role,
            [self.products_read, self.products_write, self.products_pricing, self.products_cost],
        )

    def _create_user(self, email: str, role: Role):
        return User.objects.create_user(
            email=email,
            username=email.split('@')[0],
            password='TestPass123!',
            first_name='Test',
            last_name='User',
            role=role,
            is_active=True,
        )

    def _grant_permission(self, module: str, action: str):
        permission, _ = Permission.objects.get_or_create(module=module, action=action)
        return permission

    def _assign_permissions(self, role: Role, permissions):
        for permission in permissions:
            RolePermission.objects.get_or_create(role=role, permission=permission)

    def test_staff_product_list_omits_cost_fields(self):
        self.client.force_authenticate(self.staff_user)
        response = self.client.get('/api/products/items/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        first = response.data[0]
        self.assertNotIn('cost_price', first)
        self.assertFalse(first['can_view_cost'])
        self.assertIn('variants', first)
        self.assertNotIn('cost_price', first['variants'][0])

    def test_admin_product_list_includes_cost_fields(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get('/api/products/items/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first = response.data[0]
        self.assertIn('cost_price', first)
        self.assertTrue(first['can_view_cost'])
        self.assertIn('cost_price', first['variants'][0])

    def test_staff_cannot_update_cost_price(self):
        self.client.force_authenticate(self.staff_user)
        response = self.client.patch(
            f'/api/products/items/{self.product.id}/',
            {'cost_price': '120.0000'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cost_price', response.data)

    def test_staff_cannot_update_tax_fields_without_pricing_permission(self):
        self.client.force_authenticate(self.staff_user)
        response = self.client.patch(
            f'/api/products/items/{self.product.id}/',
            {'is_taxable': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_size_is_optional_and_inputtable(self):
        self.client.force_authenticate(self.admin_user)
        payload = {
            'name': 'Chain Lube',
            'category': self.category.id,
            'selling_price': '250.0000',
            'cost_price': '120.0000',
            'is_taxable': True,
            'tax_rate': self.tax_rate_vat.id,
            'size': '',
        }
        response = self.client.post('/api/products/items/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Product.objects.get(id=response.data['id'])
        variant = created.variants.filter(deleted_at__isnull=True).first()
        self.assertIsNotNone(variant)
        self.assertEqual(variant.attributes or {}, {})

    def test_taxable_product_requires_valid_tax_rate(self):
        self.client.force_authenticate(self.admin_user)
        payload = {
            'name': 'Spark Plug',
            'category': self.category.id,
            'selling_price': '300.0000',
            'cost_price': '140.0000',
            'is_taxable': True,
            'tax_rate': 999999,
        }

        response = self.client.post('/api/products/items/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_rate', response.data)

    def test_tax_rates_endpoint_returns_active_rates(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get('/api/products/items/tax-rates/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertTrue(all(item['is_active'] for item in response.data))

    def test_sizes_endpoint_returns_dynamic_sizes(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get('/api/products/items/sizes/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [{'value': 'Small', 'label': 'Small'}])
