"""Target database design constants for phased migration checks."""

TARGET_TABLES = {
    "audit_log",
    "brands",
    "business_profile",
    "cash_sessions",
    "categories",
    "customer_addresses",
    "customers",
    "discounts",
    "inventory_stock",
    "payment_methods",
    "permissions",
    "product_barcodes",
    "product_variants",
    "product_vehicle_fitments",
    "products",
    "receipt_items",
    "receipt_payments",
    "receipt_sequences",
    "receipts",
    "role_permissions",
    "roles",
    "sales_return_items",
    "sales_returns",
    "sales_transaction_items",
    "sales_transactions",
    "stock_adjustments",
    "stock_movements",
    "tax_rates",
    "transaction_payments",
    "units_of_measure",
    "users",
    "vehicle_makes",
    "vehicle_models",
}

# Tables present in current backend but intentionally removed in the single-store target.
RETIREMENT_CANDIDATES = {
    "warehouses",
    "pos_terminals",
    "vehicle_years",
}

PROJECT_APP_LABELS = {
    "authentication",
    "catalog",
    "customers",
    "inventory",
    "pos",
    "vehicles",
    "core",
}
