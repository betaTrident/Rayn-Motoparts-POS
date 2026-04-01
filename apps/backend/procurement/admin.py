from django.contrib import admin

from .models import PurchaseOrder, PurchaseOrderItem, Supplier, SupplierProduct


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'contact_person', 'phone', 'is_active')
    search_fields = ('code', 'name', 'contact_person', 'phone', 'email')
    list_filter = ('is_active',)


@admin.register(SupplierProduct)
class SupplierProductAdmin(admin.ModelAdmin):
    list_display = ('supplier', 'product_variant', 'supplier_sku', 'last_cost', 'is_preferred', 'is_active')
    search_fields = ('supplier__name', 'product_variant__variant_sku', 'supplier_sku')
    list_filter = ('is_active', 'is_preferred')


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'supplier', 'warehouse', 'status', 'order_date', 'total_amount')
    search_fields = ('po_number', 'supplier__name')
    list_filter = ('status', 'warehouse', 'supplier')
    inlines = [PurchaseOrderItemInline]
