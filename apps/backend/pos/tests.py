import json
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Category, Product, ProductVariant, TaxRate, UnitOfMeasure
from inventory.models import InventoryStock, StockMovement, Warehouse

from .models import CashSession, PaymentMethod, SalesTransaction


class PosCheckoutViewTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="cashier1",
            email="cashier@example.com",
            password="testpass123",
        )
        staff_group, _ = Group.objects.get_or_create(name="staff")
        self.user.groups.add(staff_group)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name="Engine", slug="engine")
        self.uom = UnitOfMeasure.objects.create(code="pcs", name="Pieces")
        self.tax_rate = TaxRate.objects.create(name="VAT 12%", rate=Decimal("12.0000"))
        self.product = Product.objects.create(
            category=self.category,
            uom=self.uom,
            tax_rate=self.tax_rate,
            sku="OIL001",
            name="Engine Oil",
            part_number="EO-001",
            cost_price=Decimal("100.0000"),
            selling_price=Decimal("150.0000"),
            is_taxable=True,
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            variant_sku="OIL001-STD",
            selling_price=Decimal("150.0000"),
            cost_price=Decimal("100.0000"),
            is_active=True,
        )
        self.warehouse = Warehouse.objects.create(
            code="MAIN",
            name="Main Warehouse",
            is_pos_location=True,
            is_active=True,
        )
        self.stock = InventoryStock.objects.create(
            product_variant=self.variant,
            warehouse=self.warehouse,
            qty_on_hand=Decimal("10.0000"),
            qty_reserved=Decimal("0.0000"),
            reorder_point=Decimal("2.0000"),
        )
        self.cash_session = CashSession.objects.create(
            session_code="CS-20260430-001",
            cashier=self.user,
            status=CashSession.Status.OPEN,
            opening_balance=Decimal("1000.0000"),
        )
        self.cash_method = PaymentMethod.objects.create(name="Cash", code="CASH", is_active=True)

    def _checkout_payload(self, **overrides):
        payload = {
            "cash_session_id": self.cash_session.id,
            "customer_name": "Walk-in Customer",
            "items": [{"variant_id": self.variant.id, "qty": "2.0000"}],
            "payments": [
                {
                    "payment_method_id": self.cash_method.id,
                    "amount": "336.0000",
                    "reference_number": "",
                }
            ],
            "notes": "",
        }
        payload.update(overrides)
        return payload

    def test_open_cash_session_endpoint_creates_session_and_default_store(self):
        CashSession.objects.all().delete()
        InventoryStock.objects.all().delete()
        Warehouse.objects.all().delete()

        response = self.client.post(
            "/api/pos/cash-sessions/open/",
            data=json.dumps({"opening_balance": "250.00"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["created"])
        self.assertEqual(body["cashSession"]["openingBalance"], 250.0)
        self.assertEqual(Warehouse.objects.count(), 1)
        self.assertEqual(CashSession.objects.filter(status=CashSession.Status.OPEN).count(), 1)

    def test_checkout_creates_completed_transaction_and_deducts_stock(self):
        response = self.client.post(
            "/api/pos/checkout/",
            data=json.dumps(self._checkout_payload()),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["transaction"]["status"], SalesTransaction.Status.COMPLETED)
        self.assertEqual(body["transaction"]["totalAmount"], 336.0)
        self.assertEqual(body["transaction"]["changeGiven"], 0.0)

        txn = SalesTransaction.objects.get(pk=body["transaction"]["id"])
        self.assertEqual(txn.items.count(), 1)

        self.stock.refresh_from_db()
        self.assertEqual(self.stock.qty_on_hand, Decimal("8.0000"))
        self.assertEqual(
            StockMovement.objects.filter(
                reference_id=txn.id,
                movement_type=StockMovement.MovementType.SALE,
            ).count(),
            1,
        )

    def test_checkout_rejects_underpayment(self):
        response = self.client.post(
            "/api/pos/checkout/",
            data=json.dumps(self._checkout_payload(
                payments=[
                    {
                        "payment_method_id": self.cash_method.id,
                        "amount": "300.0000",
                        "reference_number": "",
                    }
                ]
            )),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Insufficient payment amount.")
        self.assertEqual(SalesTransaction.objects.count(), 0)

    def test_checkout_rejects_insufficient_stock(self):
        response = self.client.post(
            "/api/pos/checkout/",
            data=json.dumps(
                self._checkout_payload(items=[{"variant_id": self.variant.id, "qty": "11.0000"}])
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Insufficient stock", response.json()["detail"])
        self.assertEqual(SalesTransaction.objects.count(), 0)
