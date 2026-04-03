from datetime import datetime, timedelta
from decimal import Decimal

from django.db import models
from django.db.models import Count, Sum
from django.db.models import Q
from django.db.models.functions import Coalesce, TruncDate, TruncHour
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.rollout_flags import pos_receipt_read_enabled
from inventory.models import InventoryStock

from .models import ReceiptPayment, SalesTransaction, SalesTransactionItem, TransactionPayment

ALLOWED_SYSTEM_ROLES = {"superadmin", "admin", "staff"}


def _to_float(value: Decimal | None) -> float:
    return float(value or Decimal("0"))


def _change_pct(current: float, previous: float) -> float:
    if previous <= 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100


def _normalize_payment_method(name: str | None) -> str:
    if not name:
        return "Cash"
    lowered = name.lower()
    if "gcash" in lowered:
        return "GCash"
    if "card" in lowered or "debit" in lowered or "credit" in lowered:
        return "Card"
    return "Cash"


def _format_txn_time(dt: datetime) -> str:
    local_dt = timezone.localtime(dt)
    return local_dt.strftime("%I:%M %p").lstrip("0")


def _parse_days(value: str | None) -> int:
    if value is None:
        return 1
    try:
        days = int(value)
    except (TypeError, ValueError):
        return 1
    return max(1, min(days, 30))


def _parse_page(value: str | None) -> int:
    try:
        page = int(value) if value is not None else 1
    except (TypeError, ValueError):
        return 1
    return max(1, page)


def _parse_page_size(value: str | None) -> int:
    try:
        page_size = int(value) if value is not None else 20
    except (TypeError, ValueError):
        return 20
    return max(1, min(page_size, 100))


def _serialize_inventory_row(row: InventoryStock) -> dict:
    available = row.qty_on_hand - row.qty_reserved
    return {
        "variantSku": row.product_variant.variant_sku,
        "productName": row.product_variant.product.name,
        "qtyAvailable": _to_float(available),
        "reorderPoint": _to_float(row.reorder_point),
    }


class PosDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        is_admin_user = user.is_superuser or user.groups.filter(name="admin").exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to dashboard analytics."},
                status=status.HTTP_403_FORBIDDEN,
            )

        days = _parse_days(request.query_params.get("days"))
        today = timezone.localdate()
        range_start = today - timedelta(days=days - 1)
        prev_end = range_start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=days - 1)

        completed = SalesTransaction.Status.COMPLETED
        refunded = SalesTransaction.Status.REFUNDED
        partially_refunded = SalesTransaction.Status.PARTIALLY_REFUNDED
        kpi_statuses = [completed, partially_refunded]

        current_base = SalesTransaction.objects.filter(
            transaction_date__date__gte=range_start,
            transaction_date__date__lte=today,
            status__in=kpi_statuses,
        )
        previous_base = SalesTransaction.objects.filter(
            transaction_date__date__gte=prev_start,
            transaction_date__date__lte=prev_end,
            status__in=kpi_statuses,
        )
        today_revenue = _to_float(current_base.aggregate(v=Coalesce(Sum("total_amount"), Decimal("0")))["v"])
        yesterday_revenue = _to_float(
            previous_base.aggregate(v=Coalesce(Sum("total_amount"), Decimal("0")))["v"]
        )

        today_orders = current_base.count()
        yesterday_orders = previous_base.count()

        today_items = _to_float(
            SalesTransactionItem.objects.filter(
                sales_transaction__in=current_base,
            ).aggregate(v=Coalesce(Sum("qty"), Decimal("0")))["v"]
        )
        yesterday_items = _to_float(
            SalesTransactionItem.objects.filter(
                sales_transaction__in=previous_base,
            ).aggregate(v=Coalesce(Sum("qty"), Decimal("0")))["v"]
        )

        avg_order_value = (today_revenue / today_orders) if today_orders else 0
        yesterday_avg_order = (yesterday_revenue / yesterday_orders) if yesterday_orders else 0

        trend_base = SalesTransaction.objects.filter(
            transaction_date__date__gte=range_start,
            transaction_date__date__lte=today,
            status__in=kpi_statuses,
        )
        trend_rows = (
            trend_base
            .annotate(day=TruncDate("transaction_date"))
            .values("day")
            .annotate(
                revenue=Coalesce(Sum("total_amount"), Decimal("0")),
                orders=Count("id"),
            )
        )

        weekly_map = {row["day"]: row for row in trend_rows}
        weekly_sales = []
        for offset in range(days):
            day = range_start + timedelta(days=offset)
            row = weekly_map.get(day)
            weekly_sales.append(
                {
                    "date": day.strftime("%a"),
                    "revenue": _to_float(row["revenue"]) if row else 0,
                    "orders": row["orders"] if row else 0,
                }
            )

        top_products_base = SalesTransactionItem.objects.filter(
            sales_transaction__transaction_date__date__gte=range_start,
            sales_transaction__transaction_date__date__lte=today,
            sales_transaction__status__in=kpi_statuses,
        )
        top_products_rows = (
            top_products_base
            .values(
                "product_variant__product__name",
                "product_variant__product__category__name",
            )
            .annotate(
                sold=Coalesce(Sum("qty"), Decimal("0")),
                revenue=Coalesce(Sum("line_total"), Decimal("0")),
            )
            .order_by("-sold", "-revenue")[:6]
        )
        top_products = [
            {
                "name": row["product_variant__product__name"],
                "category": row["product_variant__product__category__name"] or "Others",
                "sold": _to_float(row["sold"]),
                "revenue": _to_float(row["revenue"]),
            }
            for row in top_products_rows
        ]

        category_base = SalesTransactionItem.objects.filter(
            sales_transaction__transaction_date__date__gte=range_start,
            sales_transaction__transaction_date__date__lte=today,
            sales_transaction__status__in=kpi_statuses,
        )
        category_rows = (
            category_base
            .values("product_variant__product__category__name")
            .annotate(revenue=Coalesce(Sum("line_total"), Decimal("0")))
            .order_by("-revenue")
        )
        color_tokens = [
            "var(--color-engine-parts)",
            "var(--color-accessories)",
            "var(--color-lubricants)",
            "var(--color-tires)",
            "var(--color-others)",
        ]
        category_sales = []
        for idx, row in enumerate(category_rows):
            category_sales.append(
                {
                    "category": row["product_variant__product__category__name"] or "Others",
                    "revenue": _to_float(row["revenue"]),
                    "fill": color_tokens[idx % len(color_tokens)],
                }
            )

        hourly_base = SalesTransaction.objects.filter(
            transaction_date__date__gte=range_start,
            transaction_date__date__lte=today,
            status__in=kpi_statuses,
        )
        hourly_rows = (
            hourly_base
            .annotate(hour=TruncHour("transaction_date"))
            .values("hour")
            .annotate(orders=Count("id"))
            .order_by("hour")
        )
        hourly_map = {timezone.localtime(row["hour"]).hour: row["orders"] for row in hourly_rows if row["hour"]}
        hourly_sales = []
        for hour in range(7, 21):
            hourly_sales.append(
                {
                    "hour": datetime(2000, 1, 1, hour, 0).strftime("%I%p").lstrip("0"),
                    "orders": hourly_map.get(hour, 0),
                }
            )

        recent_base = SalesTransaction.objects.filter(
            transaction_date__date__gte=range_start,
            transaction_date__date__lte=today,
            status__in=[completed, refunded, partially_refunded],
        )
        receipt_read = pos_receipt_read_enabled()
        recent_rows = (
            recent_base
            .select_related("receipt")
            .prefetch_related(
                "items",
                "payments__payment_method",
                "receipt__items",
                "receipt__payments",
            )
            .order_by("-transaction_date")[:7]
        )
        recent_transactions = []
        for txn in recent_rows:
            receipt = None
            if receipt_read:
                try:
                    receipt = txn.receipt
                except SalesTransaction.receipt.RelatedObjectDoesNotExist:
                    receipt = None

            if receipt is not None:
                first_receipt_payment = receipt.payments.first()
                payment_name = (
                    first_receipt_payment.payment_method_name
                    if first_receipt_payment
                    else None
                )
                items_qty = _to_float(receipt.items.aggregate(v=Coalesce(Sum("qty"), Decimal("0")))["v"])
                total_amount = _to_float(receipt.total_amount)
            else:
                first_payment = txn.payments.first()
                payment_name = first_payment.payment_method.name if first_payment else None
                items_qty = _to_float(txn.items.aggregate(v=Coalesce(Sum("qty"), Decimal("0")))["v"])
                total_amount = _to_float(txn.total_amount)

            txn_status = "Refunded" if txn.status in [refunded, partially_refunded] else "Completed"
            recent_transactions.append(
                {
                    "id": txn.transaction_number,
                    "time": _format_txn_time(txn.transaction_date),
                    "items": items_qty,
                    "total": total_amount,
                    "paymentMethod": _normalize_payment_method(payment_name),
                    "status": txn_status,
                }
            )

        inventory_base = InventoryStock.objects.select_related(
            "product_variant__product",
        ).filter(product_variant__is_active=True)

        low_stock_rows = (
            inventory_base.filter(
                qty_on_hand__gt=0,
                qty_on_hand__lte=models.F("reorder_point"),
            )
            .order_by("qty_on_hand", "product_variant__variant_sku")[:6]
        )
        out_of_stock_rows = (
            inventory_base.filter(qty_on_hand__lte=0)
            .order_by("product_variant__variant_sku")[:6]
        )

        payload = {
            "meta": {
                "days": days,
                "startDate": range_start.isoformat(),
                "endDate": today.isoformat(),
            },
            "summary": {
                "todayRevenue": today_revenue,
                "todayOrders": today_orders,
                "avgOrderValue": avg_order_value,
                "itemsSold": today_items,
                "revenueChange": _change_pct(today_revenue, yesterday_revenue),
                "ordersChange": _change_pct(today_orders, yesterday_orders),
                "avgOrderChange": _change_pct(avg_order_value, yesterday_avg_order),
                "itemsSoldChange": _change_pct(today_items, yesterday_items),
            },
            "weeklySales": weekly_sales,
            "topProducts": top_products,
            "recentTransactions": recent_transactions,
            "categorySales": category_sales,
            "hourlySales": hourly_sales,
            "inventoryAlerts": {
                "lowStock": [_serialize_inventory_row(row) for row in low_stock_rows],
                "outOfStock": [_serialize_inventory_row(row) for row in out_of_stock_rows],
            },
            "movementInsights": {
                "fastMoving": [],
                "slowMoving": [],
            },
        }

        movement_rows = (
            top_products_base.values(
                "product_variant__variant_sku",
                "product_variant__product__name",
                "product_variant__product__category__name",
            )
            .annotate(
                sold=Coalesce(Sum("qty"), Decimal("0")),
                revenue=Coalesce(Sum("line_total"), Decimal("0")),
            )
            .order_by("-sold", "-revenue")
        )

        movement_items = [
            {
                "variantSku": row["product_variant__variant_sku"],
                "productName": row["product_variant__product__name"],
                "category": row["product_variant__product__category__name"] or "Others",
                "sold": _to_float(row["sold"]),
                "revenue": _to_float(row["revenue"]),
            }
            for row in movement_rows
            if _to_float(row["sold"]) > 0
        ]

        payload["movementInsights"] = {
            "fastMoving": movement_items[:5],
            "slowMoving": list(reversed(movement_items[-5:])),
        }

        cashier_rows = (
            current_base.values(
                "cashier_id",
                "cashier__first_name",
                "cashier__last_name",
                "cashier__username",
            )
            .annotate(
                orders=Count("id"),
                revenue=Coalesce(Sum("total_amount"), Decimal("0")),
            )
            .order_by("-revenue", "-orders")[:5]
        )
        payload["topCashiers"] = [
            {
                "cashierId": row["cashier_id"],
                "name": (
                    f"{(row['cashier__first_name'] or '').strip()} {(row['cashier__last_name'] or '').strip()}".strip()
                    or row["cashier__username"]
                    or "Unknown"
                ),
                "orders": row["orders"],
                "revenue": _to_float(row["revenue"]),
                "avgOrderValue": _to_float(row["revenue"]) / row["orders"] if row["orders"] else 0,
            }
            for row in cashier_rows
        ]

        if receipt_read:
            payment_rows = (
                ReceiptPayment.objects.filter(
                    receipt__sales_transaction__in=current_base,
                )
                .values("payment_method_name")
                .annotate(amount=Coalesce(Sum("amount"), Decimal("0")))
                .order_by("-amount")
            )
            total_payment_amount = sum((_to_float(row["amount"]) for row in payment_rows), 0.0)
            payload["paymentMix"] = [
                {
                    "method": _normalize_payment_method(row["payment_method_name"]),
                    "amount": _to_float(row["amount"]),
                    "percentage": (
                        (_to_float(row["amount"]) / total_payment_amount) * 100
                        if total_payment_amount > 0
                        else 0
                    ),
                }
                for row in payment_rows
            ]
        else:
            payment_rows = (
                TransactionPayment.objects.filter(
                    sales_transaction__in=current_base,
                )
                .values("payment_method__name")
                .annotate(amount=Coalesce(Sum("amount"), Decimal("0")))
                .order_by("-amount")
            )
            total_payment_amount = sum((_to_float(row["amount"]) for row in payment_rows), 0.0)
            payload["paymentMix"] = [
                {
                    "method": _normalize_payment_method(row["payment_method__name"]),
                    "amount": _to_float(row["amount"]),
                    "percentage": (
                        (_to_float(row["amount"]) / total_payment_amount) * 100
                        if total_payment_amount > 0
                        else 0
                    ),
                }
                for row in payment_rows
            ]

        return Response(payload, status=status.HTTP_200_OK)


class PosTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        is_admin_user = user.is_superuser or user.groups.filter(name="admin").exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to transactions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        query = request.query_params.get("q", "").strip()
        status_filter = request.query_params.get("status")
        payment_filter = request.query_params.get("payment_method")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        days = _parse_days(request.query_params.get("days"))
        page = _parse_page(request.query_params.get("page"))
        page_size = _parse_page_size(request.query_params.get("page_size"))

        queryset = (
            SalesTransaction.objects.select_related("cashier", "receipt")
            .prefetch_related("payments__payment_method", "receipt__payments", "receipt__items")
            .annotate(items_qty=Coalesce(Sum("items__qty"), Decimal("0")))
            .order_by("-transaction_date")
        )

        if start_date and end_date:
            queryset = queryset.filter(
                transaction_date__date__gte=start_date,
                transaction_date__date__lte=end_date,
            )
        else:
            today = timezone.localdate()
            window_start = today - timedelta(days=days - 1)
            queryset = queryset.filter(transaction_date__date__gte=window_start)

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if payment_filter:
            if pos_receipt_read_enabled():
                queryset = queryset.filter(
                    Q(receipt__payments__payment_method__code__iexact=payment_filter)
                    | Q(receipt__payments__payment_method_name__iexact=payment_filter)
                )
            else:
                queryset = queryset.filter(
                    Q(payments__payment_method__code__iexact=payment_filter)
                    | Q(payments__payment_method__name__iexact=payment_filter)
                )

        if query:
            query_filter = (
                Q(transaction_number__icontains=query)
                | Q(customer_name__icontains=query)
                | Q(cashier__first_name__icontains=query)
                | Q(cashier__last_name__icontains=query)
            )
            if pos_receipt_read_enabled():
                query_filter = query_filter | Q(receipt__buyer_name__icontains=query)
            queryset = queryset.filter(query_filter)

        queryset = queryset.distinct()

        total_count = queryset.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)
        offset = (page - 1) * page_size

        rows = queryset[offset : offset + page_size]
        receipt_read = pos_receipt_read_enabled()
        results = []
        for txn in rows:
            receipt = None
            if receipt_read:
                try:
                    receipt = txn.receipt
                except SalesTransaction.receipt.RelatedObjectDoesNotExist:
                    receipt = None

            payment_methods = []
            if receipt is not None:
                for payment in receipt.payments.all():
                    method = _normalize_payment_method(payment.payment_method_name)
                    if method not in payment_methods:
                        payment_methods.append(method)
            else:
                for payment in txn.payments.all():
                    method = _normalize_payment_method(payment.payment_method.name)
                    if method not in payment_methods:
                        payment_methods.append(method)

            cashier_name = (
                f"{(txn.cashier.first_name or '').strip()} {(txn.cashier.last_name or '').strip()}".strip()
                or txn.cashier.username
            )

            results.append(
                {
                    "id": txn.id,
                    "transactionNumber": txn.transaction_number,
                    "transactionDate": timezone.localtime(txn.transaction_date).isoformat(),
                    "status": txn.status,
                    "cashierName": cashier_name,
                    "totalAmount": _to_float(receipt.total_amount) if receipt is not None else _to_float(txn.total_amount),
                    "itemsQty": (
                        _to_float(sum((item.qty for item in receipt.items.all()), Decimal("0")))
                        if receipt is not None
                        else _to_float(txn.items_qty)
                    ),
                    "paymentMethods": payment_methods,
                }
            )

        if receipt_read:
            payment_options_rows = (
                ReceiptPayment.objects.filter(receipt__sales_transaction__in=queryset)
                .values("payment_method__code", "payment_method_name")
                .distinct()
            )
            payment_options = [
                {
                    "code": row["payment_method__code"],
                    "name": row["payment_method_name"],
                }
                for row in payment_options_rows
            ]
        else:
            payment_options_rows = (
                TransactionPayment.objects.filter(sales_transaction__in=queryset)
                .values("payment_method__code", "payment_method__name")
                .distinct()
            )
            payment_options = [
                {
                    "code": row["payment_method__code"],
                    "name": row["payment_method__name"],
                }
                for row in payment_options_rows
            ]

        return Response(
            {
                "results": results,
                "statusOptions": [choice[0] for choice in SalesTransaction.Status.choices],
                "paymentMethodOptions": payment_options,
                "pagination": {
                    "page": page,
                    "pageSize": page_size,
                    "totalCount": total_count,
                    "totalPages": total_pages,
                    "hasPrevious": page > 1,
                    "hasNext": page < total_pages,
                },
            },
            status=status.HTTP_200_OK,
        )


class PosTransactionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id: int):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        is_admin_user = user.is_superuser or user.groups.filter(name="admin").exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to transaction details."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            SalesTransaction.objects.select_related("cashier", "cash_session", "receipt")
            .prefetch_related(
                "payments__payment_method",
                "items__product_variant__product",
                "receipt__items",
                "receipt__payments",
            )
            .filter(pk=transaction_id)
        )

        txn = queryset.first()
        if not txn:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cashier_name = (
            f"{(txn.cashier.first_name or '').strip()} {(txn.cashier.last_name or '').strip()}".strip()
            or txn.cashier.username
        )

        items = [
            {
                "variantSku": item.product_variant.variant_sku,
                "productName": item.product_variant.product.name,
                "qty": _to_float(item.qty),
                "unitPrice": _to_float(item.unit_price),
                "lineTotal": _to_float(item.line_total),
            }
            for item in txn.items.all()
        ]

        payments = [
            {
                "method": _normalize_payment_method(payment.payment_method.name),
                "amount": _to_float(payment.amount),
                "referenceNumber": payment.reference_number,
            }
            for payment in txn.payments.all()
        ]

        receipt = None
        if pos_receipt_read_enabled():
            try:
                receipt = txn.receipt
            except SalesTransaction.receipt.RelatedObjectDoesNotExist:
                receipt = None

        if receipt is not None:
            items = [
                {
                    "variantSku": item.sku,
                    "productName": item.description,
                    "qty": _to_float(item.qty),
                    "unitPrice": _to_float(item.unit_price),
                    "lineTotal": _to_float(item.line_total),
                }
                for item in receipt.items.all()
            ]
            payments = [
                {
                    "method": _normalize_payment_method(payment.payment_method_name),
                    "amount": _to_float(payment.amount),
                    "referenceNumber": payment.reference_number,
                }
                for payment in receipt.payments.all()
            ]

        payload = {
            "id": txn.id,
            "transactionNumber": txn.transaction_number,
            "transactionDate": timezone.localtime(txn.transaction_date).isoformat(),
            "status": txn.status,
            "cashierName": cashier_name,
            "terminalCode": None,
            "sessionCode": txn.cash_session.session_code,
            "customerName": receipt.buyer_name if receipt is not None else txn.customer_name,
            "subtotal": _to_float(receipt.subtotal) if receipt is not None else _to_float(txn.subtotal),
            "taxAmount": _to_float(receipt.tax_amount) if receipt is not None else _to_float(txn.tax_amount),
            "totalAmount": _to_float(receipt.total_amount) if receipt is not None else _to_float(txn.total_amount),
            "amountTendered": _to_float(receipt.amount_paid) if receipt is not None else _to_float(txn.amount_tendered),
            "changeGiven": _to_float(receipt.change_given) if receipt is not None else _to_float(txn.change_given),
            "items": items,
            "payments": payments,
        }

        return Response(payload, status=status.HTTP_200_OK)