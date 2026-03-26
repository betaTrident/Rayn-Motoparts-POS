from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'size', 'price', 'is_available', 'created_at')
    list_filter = ('category', 'size', 'is_available')
    search_fields = ('name', 'category__name')
    list_editable = ('price', 'is_available')
