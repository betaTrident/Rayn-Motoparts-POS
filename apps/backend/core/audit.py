from auditlog.registry import auditlog

from authentication.models import User
from catalog.models import Product, ProductVariant
from customers.models import Customer
from inventory.models import InventoryStock, StockAdjustment, StockMovement
from pos.models import SalesReturn, SalesTransaction, SalesTransactionItem


def _safe_register(model):
    if model not in auditlog._registry:
        auditlog.register(model)


for model in [
    User,
    Product,
    ProductVariant,
    Customer,
    InventoryStock,
    StockAdjustment,
    StockMovement,
]:
    _safe_register(model)
