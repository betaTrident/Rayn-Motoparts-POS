from auditlog.registry import auditlog

from authentication.models import User
from catalog.models import Product, ProductVariant
from customers.models import Customer
from inventory.models import InventoryStock, StockAdjustment, StockMovement, Warehouse
from invoices.models import Invoice, InvoiceItem, InvoicePayment
from pos.models import SalesReturn, SalesTransaction, SalesTransactionItem
from procurement.models import PurchaseOrder, PurchaseOrderItem, Supplier


def _safe_register(model):
    if model not in auditlog._registry:
        auditlog.register(model)


for model in [
    User,
    Warehouse,
    Product,
    ProductVariant,
    Customer,
    InventoryStock,
    StockAdjustment,
    StockMovement,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    SalesTransaction,
    SalesTransactionItem,
    SalesReturn,
    Invoice,
    InvoiceItem,
    InvoicePayment,
]:
    _safe_register(model)
