from django.contrib import admin

from .models import BusinessProfile, Invoice, InvoiceItem, InvoicePayment, InvoiceSequence


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


class InvoicePaymentInline(admin.TabularInline):
    model = InvoicePayment
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'invoice_type', 'status', 'warehouse', 'total_amount', 'issued_at')
    search_fields = ('invoice_number',)
    list_filter = ('invoice_type', 'status', 'warehouse')
    inlines = [InvoiceItemInline, InvoicePaymentInline]


@admin.register(InvoiceSequence)
class InvoiceSequenceAdmin(admin.ModelAdmin):
    list_display = ('invoice_type', 'prefix', 'current_value')


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'tax_number', 'is_default')
