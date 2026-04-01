from django.contrib import admin

from .models import InventoryStock, StockAdjustment, StockMovement, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'city', 'is_pos_location', 'is_active')
    search_fields = ('code', 'name', 'city')
    list_filter = ('is_active', 'is_pos_location')


@admin.register(InventoryStock)
class InventoryStockAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'warehouse', 'qty_on_hand', 'qty_reserved', 'updated_at')
    search_fields = ('product_variant__variant_sku', 'warehouse__code')
    list_filter = ('warehouse',)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        'product_variant',
        'warehouse',
        'movement_type',
        'reference_type',
        'qty_change',
        'created_at',
    )
    search_fields = ('product_variant__variant_sku', 'reference_id')
    list_filter = ('movement_type', 'reference_type', 'warehouse')


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'warehouse', 'adjustment_type', 'quantity', 'performed_by', 'created_at')
    search_fields = ('product_variant__variant_sku', 'reason', 'performed_by__email')
    list_filter = ('adjustment_type', 'warehouse')
