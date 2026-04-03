from django.contrib import admin

from .models import InventoryStock, StockAdjustment, StockMovement


@admin.register(InventoryStock)
class InventoryStockAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'qty_on_hand', 'qty_reserved', 'updated_at')
    search_fields = ('product_variant__variant_sku',)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        'product_variant',
        'movement_type',
        'reference_type',
        'qty_change',
        'created_at',
    )
    search_fields = ('product_variant__variant_sku', 'reference_id')
    list_filter = ('movement_type', 'reference_type')


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'adjustment_type', 'quantity', 'performed_by', 'created_at')
    search_fields = ('product_variant__variant_sku', 'reason', 'performed_by__email')
    list_filter = ('adjustment_type',)
