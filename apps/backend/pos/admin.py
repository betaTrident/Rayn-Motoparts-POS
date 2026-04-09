from django.contrib import admin

from .models import (
    BusinessProfile,
    CashSession,
    Discount,
    PaymentMethod,
    Receipt,
    ReceiptItem,
    ReceiptPayment,
    ReceiptSequence,
    SalesReturn,
    SalesReturnItem,
    SalesTransaction,
    SalesTransactionItem,
    TransactionPayment,
)


class SalesTransactionItemInline(admin.TabularInline):
    model = SalesTransactionItem
    extra = 0


class TransactionPaymentInline(admin.TabularInline):
    model = TransactionPayment
    extra = 0


@admin.register(CashSession)
class CashSessionAdmin(admin.ModelAdmin):
    list_display = ('session_code', 'cashier', 'status', 'opened_at', 'closed_at')
    search_fields = ('session_code', 'cashier__email')
    list_filter = ('status',)


@admin.register(SalesTransaction)
class SalesTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_number', 'status', 'cashier', 'total_amount', 'transaction_date')
    search_fields = ('transaction_number', 'cashier__email')
    list_filter = ('status',)
    inlines = [SalesTransactionItemInline, TransactionPaymentInline]


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('is_active',)


class SalesReturnItemInline(admin.TabularInline):
    model = SalesReturnItem
    extra = 0


@admin.register(SalesReturn)
class SalesReturnAdmin(admin.ModelAdmin):
    list_display = ('sales_transaction', 'cashier', 'created_at')
    search_fields = ('sales_transaction__transaction_number', 'cashier__email')
    list_filter = ()
    inlines = [SalesReturnItemInline]


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'value', 'applies_to', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('type', 'applies_to', 'is_active')


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'city', 'phone', 'updated_at')
    search_fields = ('business_name', 'city', 'tin')


@admin.register(ReceiptSequence)
class ReceiptSequenceAdmin(admin.ModelAdmin):
    list_display = ('series_code', 'series_label', 'current_number', 'is_active')
    search_fields = ('series_code', 'series_label')
    list_filter = ('is_active',)


class ReceiptItemInline(admin.TabularInline):
    model = ReceiptItem
    extra = 0


class ReceiptPaymentInline(admin.TabularInline):
    model = ReceiptPayment
    extra = 0


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'receipt_type', 'status', 'issued_at', 'total_amount')
    search_fields = ('receipt_number', 'buyer_name', 'seller_name')
    list_filter = ('receipt_type', 'status', 'issued_at')
    inlines = [ReceiptItemInline, ReceiptPaymentInline]
