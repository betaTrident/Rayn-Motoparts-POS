from django.contrib import admin

from .models import Customer, CustomerAddress


class CustomerAddressInline(admin.TabularInline):
    model = CustomerAddress
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('customer_code', 'first_name', 'last_name', 'phone', 'email', 'is_active')
    search_fields = ('customer_code', 'first_name', 'last_name', 'phone', 'email')
    list_filter = ('is_active',)
    inlines = [CustomerAddressInline]
