from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import SoftDeleteModel, TimeStampedModel


class Supplier(SoftDeleteModel):
    name = models.CharField(max_length=180, unique=True)
    code = models.CharField(max_length=30, unique=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    address = models.CharField(max_length=400, null=True, blank=True)
    city = models.CharField(max_length=120, null=True, blank=True)
    contact_person = models.CharField(max_length=160, null=True, blank=True)
    payment_terms_days = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class SupplierProduct(TimeStampedModel):
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='products')
    product_variant = models.ForeignKey(
        'catalog.ProductVariant',
        on_delete=models.PROTECT,
        related_name='supplier_links',
    )
    supplier_sku = models.CharField(max_length=100, null=True, blank=True)
    lead_time_days = models.PositiveSmallIntegerField(default=0)
    last_cost = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    is_preferred = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'supplier_products'
        constraints = [
            models.UniqueConstraint(
                fields=['supplier', 'product_variant'],
                name='uq_supplier_product_supplier_variant',
            ),
        ]

    def __str__(self):
        return f"{self.supplier.code} -> {self.product_variant.variant_sku}"


class PurchaseOrder(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        APPROVED = 'approved', 'Approved'
        PARTIALLY_RECEIVED = 'partially_received', 'Partially Received'
        RECEIVED = 'received', 'Received'
        CANCELLED = 'cancelled', 'Cancelled'

    po_number = models.CharField(max_length=40, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.PROTECT)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.DRAFT)
    order_date = models.DateField(auto_now_add=True)
    expected_date = models.DateField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    ordered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='purchase_orders_created',
    )
    subtotal = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'order_date'], name='idx_po_status_order_date'),
            models.Index(fields=['supplier', 'status'], name='idx_po_supplier_status'),
        ]

    def __str__(self):
        return self.po_number


class PurchaseOrderItem(TimeStampedModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    ordered_qty = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0.0001)])
    received_qty = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    unit_cost = models.DecimalField(max_digits=14, decimal_places=6, validators=[MinValueValidator(0)])
    line_total = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta:
        db_table = 'purchase_order_items'
        constraints = [
            models.UniqueConstraint(
                fields=['purchase_order', 'product_variant'],
                name='uq_po_item_order_variant',
            ),
            models.CheckConstraint(
                condition=models.Q(ordered_qty__gte=0),
                name='chk_po_item_ordered_qty_non_negative',
            ),
            models.CheckConstraint(
                condition=models.Q(received_qty__gte=0),
                name='chk_po_item_received_qty_non_negative',
            ),
        ]
        indexes = [
            models.Index(fields=['purchase_order', 'product_variant'], name='idx_po_item_lookup'),
        ]

    def save(self, *args, **kwargs):
        self.line_total = self.ordered_qty * self.unit_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase_order.po_number} :: {self.product_variant.variant_sku}"
