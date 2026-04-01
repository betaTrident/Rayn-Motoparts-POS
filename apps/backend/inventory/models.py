from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import TimeStampedModel


class Warehouse(TimeStampedModel):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=400, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    is_pos_location = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'warehouses'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class InventoryStock(models.Model):
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    qty_on_hand = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=0,
        validators=[MinValueValidator(0)],
    )
    qty_reserved = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=0,
        validators=[MinValueValidator(0)],
    )
    reorder_point = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    reorder_qty = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    max_stock_level = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    avg_cost = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    last_counted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def qty_available(self):
        return self.qty_on_hand - self.qty_reserved

    @property
    def stock_status(self):
        if self.qty_available <= 0:
            return 'OUT_OF_STOCK'
        if self.qty_available <= self.reorder_point:
            return 'LOW_STOCK'
        return 'IN_STOCK'

    class Meta:
        db_table = 'inventory_stock'
        constraints = [
            models.UniqueConstraint(
                fields=['product_variant', 'warehouse'],
                name='uq_inventory_stock_variant_warehouse',
            ),
            models.CheckConstraint(
                condition=models.Q(qty_on_hand__gte=0),
                name='chk_stock_qty_non_negative',
            ),
            models.CheckConstraint(
                condition=models.Q(qty_reserved__gte=0),
                name='chk_stock_reserved_non_negative',
            ),
        ]
        indexes = [
            models.Index(
                fields=['product_variant', 'warehouse', 'qty_on_hand'],
                name='idx_inventory_stock_lookup',
            ),
            models.Index(
                fields=['warehouse', 'qty_on_hand', 'reorder_point'],
                name='idx_inventory_low_stock',
            ),
        ]


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        SALE = 'sale', 'Sale'
        SALE_RETURN = 'sale_return', 'Sale Return'
        PURCHASE_RECEIPT = 'purchase_receipt', 'Purchase Receipt'
        PURCHASE_RETURN = 'purchase_return', 'Purchase Return'
        ADJUSTMENT_ADD = 'adjustment_add', 'Adjustment Add'
        ADJUSTMENT_SUB = 'adjustment_sub', 'Adjustment Subtract'
        TRANSFER_OUT = 'transfer_out', 'Transfer Out'
        TRANSFER_IN = 'transfer_in', 'Transfer In'
        OPENING_STOCK = 'opening_stock', 'Opening Stock'
        DAMAGE_WRITE_OFF = 'damage_write_off', 'Damage Write-Off'
        COUNT_CORRECTION = 'count_correction', 'Count Correction'

    class ReferenceType(models.TextChoices):
        SALES_TRANSACTION = 'sales_transaction', 'Sales Transaction'
        SALES_RETURN = 'sales_return', 'Sales Return'
        PURCHASE_ORDER = 'purchase_order', 'Purchase Order'
        STOCK_ADJUSTMENT = 'stock_adjustment', 'Stock Adjustment'
        STOCK_TRANSFER = 'stock_transfer', 'Stock Transfer'
        MANUAL = 'manual', 'Manual'

    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    movement_type = models.CharField(max_length=30, choices=MovementType.choices)
    reference_type = models.CharField(max_length=30, choices=ReferenceType.choices)
    reference_id = models.BigIntegerField()
    qty_before = models.DecimalField(max_digits=12, decimal_places=4)
    qty_change = models.DecimalField(max_digits=12, decimal_places=4)
    qty_after = models.DecimalField(max_digits=12, decimal_places=4)
    unit_cost = models.DecimalField(max_digits=14, decimal_places=6, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        indexes = [
            models.Index(
                fields=['product_variant', 'warehouse', '-created_at'],
                name='idx_stk_mov_prod_date',
            ),
            models.Index(
                fields=['reference_type', 'reference_id'],
                name='idx_stock_movements_ref',
            ),
            models.Index(fields=['movement_type'], name='idx_stock_movements_type'),
        ]


class StockAdjustment(TimeStampedModel):
    class AdjustmentType(models.TextChoices):
        ADD = 'add', 'Add'
        SUBTRACT = 'subtract', 'Subtract'

    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    adjustment_type = models.CharField(max_length=20, choices=AdjustmentType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0.0001)])
    reason = models.CharField(max_length=255)
    notes = models.TextField(null=True, blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        db_table = 'stock_adjustments'
        ordering = ['-created_at']
