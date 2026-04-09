from django.contrib import admin

from .models import ProductVehicleFitment, VehicleMake, VehicleModel


@admin.register(VehicleMake)
class VehicleMakeAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    search_fields = ('name', 'slug')
    list_filter = ('is_active',)


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'make', 'slug', 'is_active')
    search_fields = ('name', 'slug', 'make__name')
    list_filter = ('is_active', 'make')


@admin.register(ProductVehicleFitment)
class ProductVehicleFitmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'vehicle_model', 'year_range', 'is_active')
    search_fields = ('product__sku', 'product__name', 'vehicle_model__name')
    list_filter = ('is_active', 'vehicle_model__make')
