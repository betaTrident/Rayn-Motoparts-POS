from django.contrib import admin

from .models import ProductVehicleFitment, VehicleMake, VehicleModel, VehicleYear


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


@admin.register(VehicleYear)
class VehicleYearAdmin(admin.ModelAdmin):
    list_display = ('model', 'year', 'is_active')
    search_fields = ('model__name', 'model__make__name')
    list_filter = ('is_active', 'year', 'model__make')


@admin.register(ProductVehicleFitment)
class ProductVehicleFitmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'vehicle_year', 'is_active')
    search_fields = ('product__sku', 'product__name', 'vehicle_year__model__name')
    list_filter = ('is_active', 'vehicle_year__model__make')
