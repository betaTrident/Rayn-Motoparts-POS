from django.contrib import admin

from .models import PriceTier, ProductPriceHistory, ProductPriceTierRule, SupplierCostHistory


@admin.register(PriceTier)
class PriceTierAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'priority', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('is_active',)


@admin.register(ProductPriceTierRule)
class ProductPriceTierRuleAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'price_tier', 'min_qty', 'price', 'effective_date')
    list_filter = ('price_tier',)


@admin.register(ProductPriceHistory)
class ProductPriceHistoryAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'old_price', 'new_price', 'effective_date', 'changed_by')


@admin.register(SupplierCostHistory)
class SupplierCostHistoryAdmin(admin.ModelAdmin):
    list_display = ('supplier', 'product_variant', 'old_cost', 'new_cost', 'effective_date', 'changed_by')
