from django.contrib import admin

from .models import (
    CashSession,
    PaymentMethod,
    PosTerminal,
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


@admin.register(PosTerminal)
class PosTerminalAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'warehouse', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('is_active', 'warehouse')


@admin.register(CashSession)
class CashSessionAdmin(admin.ModelAdmin):
    list_display = ('pos_terminal', 'cashier', 'status', 'opened_at', 'closed_at')
    search_fields = ('pos_terminal__code', 'cashier__email')
    list_filter = ('status', 'pos_terminal')


@admin.register(SalesTransaction)
class SalesTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_number', 'status', 'warehouse', 'cashier', 'total_amount', 'transaction_date')
    search_fields = ('transaction_number', 'cashier__email')
    list_filter = ('status', 'warehouse', 'pos_terminal')
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
    list_display = ('sales_transaction', 'warehouse', 'cashier', 'created_at')
    search_fields = ('sales_transaction__transaction_number', 'cashier__email')
    list_filter = ('warehouse',)
    inlines = [SalesReturnItemInline]
