from django.contrib import admin

from .models import (
    Brand,
    Category,
    Product,
    ProductBarcode,
    ProductVariant,
    TaxRate,
    UnitOfMeasure,
)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'country_origin', 'is_active')
    search_fields = ('name', 'slug')
    list_filter = ('is_active',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'sort_order', 'is_active')
    search_fields = ('name', 'slug')
    list_filter = ('is_active',)


@admin.register(UnitOfMeasure)
class UnitOfMeasureAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('is_active',)


@admin.register(TaxRate)
class TaxRateAdmin(admin.ModelAdmin):
    list_display = ('name', 'rate', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'brand', 'uom', 'selling_price', 'is_active')
    search_fields = ('sku', 'name', 'part_number')
    list_filter = ('is_active', 'category', 'brand', 'uom')


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('variant_sku', 'product', 'variant_name', 'selling_price', 'is_active')
    search_fields = ('variant_sku', 'variant_name', 'product__sku', 'product__name')
    list_filter = ('is_active',)


@admin.register(ProductBarcode)
class ProductBarcodeAdmin(admin.ModelAdmin):
    list_display = ('barcode', 'product_variant', 'is_primary', 'is_active')
    search_fields = ('barcode', 'product_variant__variant_sku')
    list_filter = ('is_primary', 'is_active')
