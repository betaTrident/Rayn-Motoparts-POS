from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import TimeStampedModel


class PriceTier(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=40, unique=True)
    priority = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'price_tiers'
        ordering = ['priority', 'name']


class ProductPriceTierRule(TimeStampedModel):
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.CASCADE)
    price_tier = models.ForeignKey(PriceTier, on_delete=models.CASCADE)
    min_qty = models.DecimalField(max_digits=12, decimal_places=4, default=1)
    price = models.DecimalField(max_digits=14, decimal_places=4, validators=[MinValueValidator(0)])
    effective_date = models.DateField()

    class Meta:
        db_table = 'product_price_tier_rules'
        indexes = [
            models.Index(
                fields=['product_variant', 'price_tier', 'min_qty', 'effective_date'],
                name='idx_price_tier_resolution',
            ),
        ]


class ProductPriceHistory(TimeStampedModel):
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.CASCADE)
    old_price = models.DecimalField(max_digits=14, decimal_places=4)
    new_price = models.DecimalField(max_digits=14, decimal_places=4)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    effective_date = models.DateField()

    class Meta:
        db_table = 'product_price_history'
        indexes = [
            models.Index(fields=['product_variant', '-effective_date'], name='idx_price_history_lookup'),
        ]


class SupplierCostHistory(TimeStampedModel):
    supplier = models.ForeignKey('procurement.Supplier', on_delete=models.CASCADE)
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.CASCADE)
    old_cost = models.DecimalField(max_digits=14, decimal_places=6)
    new_cost = models.DecimalField(max_digits=14, decimal_places=6)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    effective_date = models.DateField()

    class Meta:
        db_table = 'supplier_cost_history'
        indexes = [
            models.Index(fields=['supplier', '-effective_date'], name='idx_supplier_cost_trend'),
        ]
