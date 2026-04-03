[
{
  "model": "procurement.supplier",
  "pk": 5,
  "fields": {
    "created_at": "2026-04-01T13:02:29.171Z",
    "updated_at": "2026-04-01T19:01:54.698Z",
    "deleted_at": null,
    "name": "NGK Philippines Inc.",
    "code": "SUP-NGK",
    "email": "orders@ngkph.com",
    "phone": "+632811001",
    "address": null,
    "city": "Taguig City",
    "contact_person": null,
    "payment_terms_days": 30,
    "is_active": true
  }
},
{
  "model": "procurement.supplier",
  "pk": 6,
  "fields": {
    "created_at": "2026-04-01T13:02:29.174Z",
    "updated_at": "2026-04-01T19:01:54.722Z",
    "deleted_at": null,
    "name": "Robert Bosch Philippines",
    "code": "SUP-BOSCH",
    "email": "parts@boschph.com",
    "phone": "+632811003",
    "address": null,
    "city": "Taguig City",
    "contact_person": null,
    "payment_terms_days": 45,
    "is_active": true
  }
},
{
  "model": "procurement.supplier",
  "pk": 7,
  "fields": {
    "created_at": "2026-04-01T13:02:29.176Z",
    "updated_at": "2026-04-01T19:01:54.732Z",
    "deleted_at": null,
    "name": "Motul Philippines Distributor",
    "code": "SUP-MOTUL",
    "email": "orders@motulph.com",
    "phone": "+632811004",
    "address": null,
    "city": "Quezon City",
    "contact_person": null,
    "payment_terms_days": 15,
    "is_active": true
  }
},
{
  "model": "procurement.supplier",
  "pk": 8,
  "fields": {
    "created_at": "2026-04-01T13:02:29.178Z",
    "updated_at": "2026-04-01T19:01:54.744Z",
    "deleted_at": null,
    "name": "Cebu Auto Parts Wholesaler",
    "code": "SUP-LOCAL",
    "email": "d.ong@cebuautoparts.ph",
    "phone": "+63321811005",
    "address": null,
    "city": "Cebu City",
    "contact_person": null,
    "payment_terms_days": 7,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 8,
  "fields": {
    "created_at": "2026-04-01T13:02:29.187Z",
    "updated_at": "2026-04-01T19:01:54.764Z",
    "supplier": 5,
    "product_variant": 9,
    "supplier_sku": "NGK-CR8E",
    "lead_time_days": 7,
    "last_cost": "82.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 9,
  "fields": {
    "created_at": "2026-04-01T13:02:29.190Z",
    "updated_at": "2026-04-01T19:01:54.777Z",
    "supplier": 5,
    "product_variant": 10,
    "supplier_sku": "NGK-BPR6ES",
    "lead_time_days": 7,
    "last_cost": "86.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 10,
  "fields": {
    "created_at": "2026-04-01T13:02:29.192Z",
    "updated_at": "2026-04-01T19:01:54.792Z",
    "supplier": 8,
    "product_variant": 11,
    "supplier_sku": "SAK-C109",
    "lead_time_days": 3,
    "last_cost": "52.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 11,
  "fields": {
    "created_at": "2026-04-01T13:02:29.194Z",
    "updated_at": "2026-04-01T19:01:54.803Z",
    "supplier": 8,
    "product_variant": 12,
    "supplier_sku": "BRM-P06020",
    "lead_time_days": 5,
    "last_cost": "495.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 12,
  "fields": {
    "created_at": "2026-04-01T13:02:29.195Z",
    "updated_at": "2026-04-01T19:01:54.819Z",
    "supplier": 7,
    "product_variant": 13,
    "supplier_sku": "MOT5W301L",
    "lead_time_days": 14,
    "last_cost": "178.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 13,
  "fields": {
    "created_at": "2026-04-01T13:02:29.197Z",
    "updated_at": "2026-04-01T19:01:54.834Z",
    "supplier": 7,
    "product_variant": 14,
    "supplier_sku": "MOT5W304L",
    "lead_time_days": 14,
    "last_cost": "660.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.supplierproduct",
  "pk": 14,
  "fields": {
    "created_at": "2026-04-01T13:02:29.199Z",
    "updated_at": "2026-04-01T19:01:54.854Z",
    "supplier": 8,
    "product_variant": 16,
    "supplier_sku": "ACD-B24R",
    "lead_time_days": 5,
    "last_cost": "1780.000000",
    "is_preferred": true,
    "is_active": true
  }
},
{
  "model": "procurement.purchaseorder",
  "pk": 3,
  "fields": {
    "created_at": "2026-04-01T13:06:16.877Z",
    "updated_at": "2026-04-01T19:01:54.947Z",
    "po_number": "PO-2025-001",
    "supplier": 5,
    "warehouse": 4,
    "status": "received",
    "order_date": "2026-04-01",
    "expected_date": null,
    "received_at": null,
    "ordered_by": 7,
    "subtotal": "6000.0000",
    "tax_amount": "720.0000",
    "total_amount": "6720.0000",
    "notes": null
  }
},
{
  "model": "procurement.purchaseorder",
  "pk": 4,
  "fields": {
    "created_at": "2026-04-01T13:06:16.903Z",
    "updated_at": "2026-04-01T19:01:55.034Z",
    "po_number": "PO-2025-002",
    "supplier": 7,
    "warehouse": 4,
    "status": "partially_received",
    "order_date": "2026-04-01",
    "expected_date": null,
    "received_at": "2026-04-01T13:06:16.911Z",
    "ordered_by": 7,
    "subtotal": "16464.0000",
    "tax_amount": "1975.6800",
    "total_amount": "18439.6800",
    "notes": null
  }
},
{
  "model": "procurement.purchaseorderitem",
  "pk": 5,
  "fields": {
    "created_at": "2026-04-01T13:06:16.883Z",
    "updated_at": "2026-04-01T19:01:55.018Z",
    "purchase_order": 3,
    "product_variant": 9,
    "ordered_qty": "48.0000",
    "received_qty": "48.0000",
    "unit_cost": "82.000000",
    "line_total": "3936.0000"
  }
},
{
  "model": "procurement.purchaseorderitem",
  "pk": 6,
  "fields": {
    "created_at": "2026-04-01T13:06:16.894Z",
    "updated_at": "2026-04-01T19:01:55.027Z",
    "purchase_order": 3,
    "product_variant": 10,
    "ordered_qty": "24.0000",
    "received_qty": "24.0000",
    "unit_cost": "86.000000",
    "line_total": "2064.0000"
  }
},
{
  "model": "procurement.purchaseorderitem",
  "pk": 7,
  "fields": {
    "created_at": "2026-04-01T13:06:16.905Z",
    "updated_at": "2026-04-01T19:01:55.044Z",
    "purchase_order": 4,
    "product_variant": 13,
    "ordered_qty": "48.0000",
    "received_qty": "48.0000",
    "unit_cost": "178.000000",
    "line_total": "8544.0000"
  }
},
{
  "model": "procurement.purchaseorderitem",
  "pk": 8,
  "fields": {
    "created_at": "2026-04-01T13:06:16.914Z",
    "updated_at": "2026-04-01T19:01:55.057Z",
    "purchase_order": 4,
    "product_variant": 14,
    "ordered_qty": "24.0000",
    "received_qty": "12.0000",
    "unit_cost": "660.000000",
    "line_total": "15840.0000"
  }
},
{
  "model": "pricing.pricetier",
  "pk": 4,
  "fields": {
    "created_at": "2026-04-01T13:02:29.222Z",
    "updated_at": "2026-04-01T19:01:55.276Z",
    "name": "Retail",
    "code": "RETAIL",
    "priority": 10,
    "is_active": true
  }
},
{
  "model": "pricing.pricetier",
  "pk": 5,
  "fields": {
    "created_at": "2026-04-01T13:02:29.224Z",
    "updated_at": "2026-04-01T19:01:55.308Z",
    "name": "Wholesale",
    "code": "WHOLESALE",
    "priority": 20,
    "is_active": true
  }
},
{
  "model": "pricing.pricetier",
  "pk": 6,
  "fields": {
    "created_at": "2026-04-01T13:02:29.225Z",
    "updated_at": "2026-04-01T19:01:55.313Z",
    "name": "VIP",
    "code": "VIP",
    "priority": 30,
    "is_active": true
  }
},
{
  "model": "pricing.productpricetierrule",
  "pk": 7,
  "fields": {
    "created_at": "2026-04-01T13:02:29.232Z",
    "updated_at": "2026-04-01T19:01:55.325Z",
    "product_variant": 9,
    "price_tier": 4,
    "min_qty": "1.0000",
    "price": "165.0000",
    "effective_date": "2025-01-01"
  }
},
{
  "model": "pricing.productpricetierrule",
  "pk": 8,
  "fields": {
    "created_at": "2026-04-01T13:02:29.234Z",
    "updated_at": "2026-04-01T19:01:55.330Z",
    "product_variant": 9,
    "price_tier": 5,
    "min_qty": "10.0000",
    "price": "140.0000",
    "effective_date": "2025-01-01"
  }
},
{
  "model": "pricing.productpricetierrule",
  "pk": 9,
  "fields": {
    "created_at": "2026-04-01T13:02:29.236Z",
    "updated_at": "2026-04-01T19:01:55.334Z",
    "product_variant": 11,
    "price_tier": 4,
    "min_qty": "1.0000",
    "price": "110.0000",
    "effective_date": "2025-01-01"
  }
},
{
  "model": "pricing.productpricetierrule",
  "pk": 10,
  "fields": {
    "created_at": "2026-04-01T13:02:29.238Z",
    "updated_at": "2026-04-01T19:01:55.339Z",
    "product_variant": 11,
    "price_tier": 5,
    "min_qty": "20.0000",
    "price": "90.0000",
    "effective_date": "2025-01-01"
  }
},
{
  "model": "pricing.productpricetierrule",
  "pk": 11,
  "fields": {
    "created_at": "2026-04-01T13:02:29.239Z",
    "updated_at": "2026-04-01T19:01:55.341Z",
    "product_variant": 13,
    "price_tier": 4,
    "min_qty": "1.0000",
    "price": "355.0000",
    "effective_date": "2025-01-01"
  }
},
{
  "model": "pricing.productpricetierrule",
  "pk": 12,
  "fields": {
    "created_at": "2026-04-01T13:02:29.241Z",
    "updated_at": "2026-04-01T19:01:55.343Z",
    "product_variant": 14,
    "price_tier": 5,
    "min_qty": "12.0000",
    "price": "980.0000",
    "effective_date": "2025-01-01"
  }
},
{
  "model": "pricing.productpricehistory",
  "pk": 3,
  "fields": {
    "created_at": "2026-04-01T13:06:16.946Z",
    "updated_at": "2026-04-01T13:06:16.946Z",
    "product_variant": 9,
    "old_price": "158.0000",
    "new_price": "165.0000",
    "changed_by": 7,
    "effective_date": "2025-02-01"
  }
},
{
  "model": "pricing.productpricehistory",
  "pk": 4,
  "fields": {
    "created_at": "2026-04-01T13:06:16.947Z",
    "updated_at": "2026-04-01T13:06:16.947Z",
    "product_variant": 13,
    "old_price": "340.0000",
    "new_price": "355.0000",
    "changed_by": 7,
    "effective_date": "2025-02-15"
  }
},
{
  "model": "pricing.suppliercosthistory",
  "pk": 3,
  "fields": {
    "created_at": "2026-04-01T13:06:16.950Z",
    "updated_at": "2026-04-01T13:06:16.950Z",
    "supplier": 5,
    "product_variant": 9,
    "old_cost": "78.000000",
    "new_cost": "82.000000",
    "changed_by": 7,
    "effective_date": "2025-01-10"
  }
},
{
  "model": "pricing.suppliercosthistory",
  "pk": 4,
  "fields": {
    "created_at": "2026-04-01T13:06:16.952Z",
    "updated_at": "2026-04-01T13:06:16.952Z",
    "supplier": 7,
    "product_variant": 13,
    "old_cost": "168.000000",
    "new_cost": "178.000000",
    "changed_by": 7,
    "effective_date": "2025-02-10"
  }
},
{
  "model": "invoices.invoicesequence",
  "pk": 1,
  "fields": {
    "created_at": "2026-04-01T13:02:29.354Z",
    "updated_at": "2026-04-01T13:06:17.022Z",
    "invoice_type": "sales_invoice",
    "prefix": "INV",
    "current_value": 3
  }
},
{
  "model": "invoices.invoice",
  "pk": 1,
  "fields": {
    "created_at": "2026-04-01T13:02:29.361Z",
    "updated_at": "2026-04-01T13:02:29.361Z",
    "invoice_number": "INV-00000001",
    "invoice_type": "sales_invoice",
    "sales_transaction": 2,
    "customer": 5,
    "warehouse": 4,
    "issued_by": 9,
    "status": "issued",
    "issued_at": "2026-04-01T13:02:29.361Z",
    "subtotal": "440.0000",
    "tax_amount": "52.8000",
    "total_amount": "492.8000"
  }
},
{
  "model": "invoices.invoice",
  "pk": 3,
  "fields": {
    "created_at": "2026-04-01T13:06:17.001Z",
    "updated_at": "2026-04-01T13:06:17.001Z",
    "invoice_number": "INV-00000002",
    "invoice_type": "sales_invoice",
    "sales_transaction": 5,
    "customer": null,
    "warehouse": 4,
    "issued_by": 9,
    "status": "issued",
    "issued_at": "2026-04-01T13:06:17.001Z",
    "subtotal": "1600.0000",
    "tax_amount": "192.0000",
    "total_amount": "1792.0000"
  }
},
{
  "model": "invoices.invoice",
  "pk": 4,
  "fields": {
    "created_at": "2026-04-01T13:06:17.023Z",
    "updated_at": "2026-04-01T13:06:17.023Z",
    "invoice_number": "INV-00000003",
    "invoice_type": "sales_invoice",
    "sales_transaction": 6,
    "customer": 6,
    "warehouse": 5,
    "issued_by": 11,
    "status": "issued",
    "issued_at": "2026-04-01T13:06:17.023Z",
    "subtotal": "350.0000",
    "tax_amount": "42.0000",
    "total_amount": "392.0000"
  }
},
{
  "model": "invoices.invoiceitem",
  "pk": 1,
  "fields": {
    "created_at": "2026-04-01T13:02:29.376Z",
    "updated_at": "2026-04-01T13:02:29.376Z",
    "invoice": 1,
    "product_variant": 9,
    "qty": "2.0000",
    "unit_price": "165.0000",
    "tax_rate": "12.0000",
    "line_total": "369.6000"
  }
},
{
  "model": "invoices.invoiceitem",
  "pk": 2,
  "fields": {
    "created_at": "2026-04-01T13:02:29.376Z",
    "updated_at": "2026-04-01T13:02:29.376Z",
    "invoice": 1,
    "product_variant": 11,
    "qty": "1.0000",
    "unit_price": "110.0000",
    "tax_rate": "12.0000",
    "line_total": "123.2000"
  }
},
{
  "model": "invoices.invoiceitem",
  "pk": 5,
  "fields": {
    "created_at": "2026-04-01T13:06:17.005Z",
    "updated_at": "2026-04-01T13:06:17.005Z",
    "invoice": 3,
    "product_variant": 12,
    "qty": "1.0000",
    "unit_price": "980.0000",
    "tax_rate": "12.0000",
    "line_total": "1097.6000"
  }
},
{
  "model": "invoices.invoiceitem",
  "pk": 6,
  "fields": {
    "created_at": "2026-04-01T13:06:17.005Z",
    "updated_at": "2026-04-01T13:06:17.005Z",
    "invoice": 3,
    "product_variant": 15,
    "qty": "1.0000",
    "unit_price": "620.0000",
    "tax_rate": "12.0000",
    "line_total": "694.4000"
  }
},
{
  "model": "invoices.invoiceitem",
  "pk": 7,
  "fields": {
    "created_at": "2026-04-01T13:06:17.024Z",
    "updated_at": "2026-04-01T13:06:17.025Z",
    "invoice": 4,
    "product_variant": 10,
    "qty": "2.0000",
    "unit_price": "175.0000",
    "tax_rate": "12.0000",
    "line_total": "392.0000"
  }
},
{
  "model": "invoices.invoicepayment",
  "pk": 1,
  "fields": {
    "created_at": "2026-04-01T13:02:29.385Z",
    "updated_at": "2026-04-01T13:02:29.385Z",
    "invoice": 1,
    "payment_method": 3,
    "amount": "500.0000",
    "reference_number": null
  }
},
{
  "model": "invoices.invoicepayment",
  "pk": 3,
  "fields": {
    "created_at": "2026-04-01T13:06:17.007Z",
    "updated_at": "2026-04-01T13:06:17.007Z",
    "invoice": 3,
    "payment_method": 4,
    "amount": "2000.0000",
    "reference_number": null
  }
},
{
  "model": "invoices.invoicepayment",
  "pk": 4,
  "fields": {
    "created_at": "2026-04-01T13:06:17.025Z",
    "updated_at": "2026-04-01T13:06:17.025Z",
    "invoice": 4,
    "payment_method": 6,
    "amount": "800.0000",
    "reference_number": null
  }
}
]
