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
from inventory.models import Warehouse
from inventory.models import InventoryStock

from .models import SalesTransaction, SalesTransactionItem, TransactionPayment

ALLOWED_SYSTEM_ROLES = {"admin", "cashier"}


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


def _serialize_inventory_row(row: InventoryStock) -> dict:
    available = row.qty_on_hand - row.qty_reserved
    return {
        "variantSku": row.product_variant.variant_sku,
        "productName": row.product_variant.product.name,
        "warehouseCode": row.warehouse.code,
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

        requested_warehouse_id = request.query_params.get("warehouse_id")
        warehouse_id = requested_warehouse_id
        if not is_admin_user:
            assigned_warehouse_id = getattr(user, "warehouse_id", None)
            if assigned_warehouse_id:
                if requested_warehouse_id and str(assigned_warehouse_id) != str(requested_warehouse_id):
                    return Response(
                        {"detail": "You can only view analytics for your assigned warehouse."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                warehouse_id = str(assigned_warehouse_id)
            elif requested_warehouse_id:
                return Response(
                    {"detail": "Warehouse filtering is not available for this account."},
                    status=status.HTTP_403_FORBIDDEN,
                )

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
        if warehouse_id:
            current_base = current_base.filter(warehouse_id=warehouse_id)
            previous_base = previous_base.filter(warehouse_id=warehouse_id)

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
        if warehouse_id:
            trend_base = trend_base.filter(warehouse_id=warehouse_id)

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
        if warehouse_id:
            top_products_base = top_products_base.filter(
                sales_transaction__warehouse_id=warehouse_id
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
        if warehouse_id:
            category_base = category_base.filter(
                sales_transaction__warehouse_id=warehouse_id
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
        if warehouse_id:
            hourly_base = hourly_base.filter(warehouse_id=warehouse_id)

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
        if warehouse_id:
            recent_base = recent_base.filter(warehouse_id=warehouse_id)

        recent_rows = (
            recent_base
            .prefetch_related("items", "payments__payment_method")
            .order_by("-transaction_date")[:7]
        )
        recent_transactions = []
        for txn in recent_rows:
            first_payment = txn.payments.first()
            payment_name = first_payment.payment_method.name if first_payment else None
            txn_status = "Refunded" if txn.status in [refunded, partially_refunded] else "Completed"
            recent_transactions.append(
                {
                    "id": txn.transaction_number,
                    "time": _format_txn_time(txn.transaction_date),
                    "items": _to_float(txn.items.aggregate(v=Coalesce(Sum("qty"), Decimal("0")))["v"]),
                    "total": _to_float(txn.total_amount),
                    "paymentMethod": _normalize_payment_method(payment_name),
                    "status": txn_status,
                }
            )

        inventory_base = InventoryStock.objects.select_related(
            "product_variant__product",
            "warehouse",
        ).filter(product_variant__is_active=True)
        if warehouse_id:
            inventory_base = inventory_base.filter(warehouse_id=warehouse_id)

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
                "warehouseId": int(warehouse_id) if warehouse_id else None,
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


class PosWarehouseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        is_admin_user = user.is_superuser or user.groups.filter(name="admin").exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to warehouse list."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = Warehouse.objects.filter(is_active=True, is_pos_location=True).order_by("code")

        assigned_warehouse_id = getattr(user, "warehouse_id", None)
        if not is_admin_user and assigned_warehouse_id:
            qs = qs.filter(id=assigned_warehouse_id)

        data = [
            {
                "id": warehouse.id,
                "code": warehouse.code,
                "name": warehouse.name,
            }
            for warehouse in qs
        ]
        return Response(data, status=status.HTTP_200_OK)


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

        requested_warehouse_id = request.query_params.get("warehouse_id")
        warehouse_id = requested_warehouse_id
        if not is_admin_user:
            assigned_warehouse_id = getattr(user, "warehouse_id", None)
            if assigned_warehouse_id:
                if requested_warehouse_id and str(assigned_warehouse_id) != str(requested_warehouse_id):
                    return Response(
                        {"detail": "You can only view transactions for your assigned warehouse."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                warehouse_id = str(assigned_warehouse_id)
            elif requested_warehouse_id:
                return Response(
                    {"detail": "Warehouse filtering is not available for this account."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        queryset = (
            SalesTransaction.objects.select_related("cashier", "warehouse", "pos_terminal")
            .prefetch_related("payments__payment_method")
            .annotate(items_qty=Coalesce(Sum("items__qty"), Decimal("0")))
            .order_by("-transaction_date")
        )

        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

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
            queryset = queryset.filter(
                Q(payments__payment_method__code__iexact=payment_filter)
                | Q(payments__payment_method__name__iexact=payment_filter)
            )

        if query:
            queryset = queryset.filter(
                Q(transaction_number__icontains=query)
                | Q(customer_name__icontains=query)
                | Q(cashier__first_name__icontains=query)
                | Q(cashier__last_name__icontains=query)
            )

        queryset = queryset.distinct()

        rows = queryset[:150]
        results = []
        for txn in rows:
            payment_methods = []
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
                    "warehouseCode": txn.warehouse.code,
                    "totalAmount": _to_float(txn.total_amount),
                    "itemsQty": _to_float(txn.items_qty),
                    "paymentMethods": payment_methods,
                }
            )

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
            },
            status=status.HTTP_200_OK,
        )