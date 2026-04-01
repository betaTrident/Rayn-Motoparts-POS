from django.db import models
from django.contrib.postgres.indexes import GinIndex

from core.models import SoftDeleteModel


class Brand(SoftDeleteModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    logo_url = models.URLField(max_length=512, null=True, blank=True)
    country_origin = models.CharField(max_length=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'brands'
        ordering = ['name']

    def __str__(self):
        return self.name


class Category(SoftDeleteModel):
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='children',
    )
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(null=True, blank=True)
    sort_order = models.SmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class UnitOfMeasure(SoftDeleteModel):
    code = models.CharField(max_length=15, unique=True)
    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'units_of_measure'
        ordering = ['code']

    def __str__(self):
        return self.code


class TaxRate(SoftDeleteModel):
    name = models.CharField(max_length=80, unique=True)
    rate = models.DecimalField(max_digits=6, decimal_places=4)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'tax_rates'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.rate}%)"


class Product(SoftDeleteModel):
    category = models.ForeignKey('catalog.Category', on_delete=models.PROTECT)
    brand = models.ForeignKey('catalog.Brand', null=True, blank=True, on_delete=models.SET_NULL)
    uom = models.ForeignKey('catalog.UnitOfMeasure', on_delete=models.PROTECT)
    tax_rate = models.ForeignKey('catalog.TaxRate', on_delete=models.PROTECT)
    sku = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=220)
    description = models.TextField(null=True, blank=True)
    part_number = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    is_taxable = models.BooleanField(default=True)
    is_serialized = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f"{self.sku} - {self.name}"


class ProductVariant(SoftDeleteModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    variant_sku = models.CharField(max_length=100, unique=True)
    variant_name = models.CharField(max_length=200, null=True, blank=True)
    attributes = models.JSONField(null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    @property
    def effective_cost(self):
        return self.cost_price if self.cost_price is not None else self.product.cost_price

    @property
    def effective_price(self):
        return self.selling_price if self.selling_price is not None else self.product.selling_price

    @property
    def margin_pct(self):
        price = self.effective_price
        cost = self.effective_cost
        if price and price > 0:
            return round(((price - cost) / price) * 100, 4)
        return None

    @property
    def markup_pct(self):
        cost = self.effective_cost
        price = self.effective_price
        if cost and cost > 0:
            return round(((price - cost) / cost) * 100, 4)
        return None

    class Meta:
        db_table = 'product_variants'
        indexes = [
            GinIndex(fields=['attributes'], name='idx_pv_attributes_gin'),
        ]

    def __str__(self):
        return self.variant_sku


class ProductBarcode(SoftDeleteModel):
    product_variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='barcodes',
    )
    barcode = models.CharField(max_length=120, unique=True)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_barcodes'
        ordering = ['-is_primary', 'barcode']

    def __str__(self):
        return self.barcode
