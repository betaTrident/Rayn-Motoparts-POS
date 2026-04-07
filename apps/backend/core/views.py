from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import connection
from django.db import models
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal

from catalog.models import Product
from core.rollout_flags import pos_receipt_dual_write_enabled, reconciliation_enabled
from customers.models import Customer
from inventory.models import InventoryStock, StockMovement
from pos.models import CashSession, Receipt, SalesTransaction

ALLOWED_SYSTEM_ROLES = {"superadmin"}


def _build_reconciliation_snapshot() -> dict:
    completed_statuses = [
        SalesTransaction.Status.COMPLETED,
        SalesTransaction.Status.PARTIALLY_REFUNDED,
    ]

    txns = SalesTransaction.objects.filter(status__in=completed_statuses).prefetch_related(
        "items",
        "payments",
    )

    total_txns = txns.count()
    item_total_mismatch = 0
    payment_total_short = 0

    for txn in txns.iterator(chunk_size=200):
        item_total = sum((item.line_total for item in txn.items.all()), Decimal("0"))
        if item_total != txn.total_amount:
            item_total_mismatch += 1

        paid = sum((payment.amount for payment in txn.payments.all()), Decimal("0"))
        if paid < txn.total_amount:
            payment_total_short += 1

    negative_stock_rows = InventoryStock.objects.filter(qty_on_hand__lt=0).count()

    sale_movements = StockMovement.objects.filter(
        movement_type=StockMovement.MovementType.SALE,
        reference_type=StockMovement.ReferenceType.SALES_TRANSACTION,
    )
    sale_movement_count = sale_movements.count()
    sale_qty_net = sale_movements.aggregate(v=Coalesce(Sum("qty_change"), Decimal("0")))["v"]

    orphan_sale_movements = StockMovement.objects.filter(
        movement_type=StockMovement.MovementType.SALE,
        reference_type=StockMovement.ReferenceType.SALES_TRANSACTION,
    ).exclude(reference_id__in=SalesTransaction.objects.values("id")).count()

    dual_write_active = pos_receipt_dual_write_enabled()
    receipt_missing = 0
    receipt_total_mismatch = 0
    receipt_payment_mismatch = 0

    if dual_write_active:
        for txn in txns.iterator(chunk_size=200):
            receipt = Receipt.objects.filter(sales_transaction=txn).prefetch_related("payments").first()
            if receipt is None:
                receipt_missing += 1
                continue

            if receipt.total_amount != txn.total_amount:
                receipt_total_mismatch += 1

            receipt_paid = sum((payment.amount for payment in receipt.payments.all()), Decimal("0"))
            if receipt_paid != receipt.amount_paid:
                receipt_payment_mismatch += 1

    issues_total = (
        item_total_mismatch
        + payment_total_short
        + negative_stock_rows
        + orphan_sale_movements
        + receipt_missing
        + receipt_total_mismatch
        + receipt_payment_mismatch
    )

    status_value = "pass" if issues_total == 0 else "warning"
    summary_message = (
        "Reconciliation passed with zero detected issues."
        if issues_total == 0
        else f"Reconciliation found {issues_total} issue(s). Resolve before hard cutover."
    )

    return {
        "status": status_value,
        "summaryMessage": summary_message,
        "reconciliationEnabled": reconciliation_enabled(),
        "dualWriteEnabled": dual_write_active,
        "scannedTransactions": total_txns,
        "issueCounts": {
            "itemTotalMismatch": item_total_mismatch,
            "paymentTotalShort": payment_total_short,
            "negativeStockRows": negative_stock_rows,
            "orphanSaleMovements": orphan_sale_movements,
            "receiptMissing": receipt_missing,
            "receiptTotalMismatch": receipt_total_mismatch,
            "receiptPaymentMismatch": receipt_payment_mismatch,
            "total": issues_total,
        },
        "movement": {
            "saleMovementCount": sale_movement_count,
            "netSaleQtyChange": str(sale_qty_net),
        },
    }


def _require_system_access(user, denied_message: str):
    has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
    if has_system_role or user.is_superuser:
        return None
    return Response(
        {"detail": denied_message},
        status=status.HTTP_403_FORBIDDEN,
    )


class SystemHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _require_system_access(
            request.user,
            "You do not have access to system health metrics.",
        )
        if denied is not None:
            return denied

        checks = []

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            checks.append(
                {
                    "name": "database",
                    "status": "healthy",
                    "message": "Database connection is available.",
                }
            )
        except Exception as exc:
            checks.append(
                {
                    "name": "database",
                    "status": "degraded",
                    "message": f"Database connectivity issue: {exc}",
                }
            )

        User = get_user_model()

        metrics = {
            "usersTotal": User.objects.count(),
            "usersActive": User.objects.filter(is_active=True).count(),
            "productsActive": Product.objects.filter(deleted_at__isnull=True, is_active=True).count(),
            "customersActive": Customer.objects.filter(deleted_at__isnull=True, is_active=True).count(),
            "openCashSessions": CashSession.objects.filter(status=CashSession.Status.OPEN).count(),
            "pendingTransactions": SalesTransaction.objects.filter(
                status=SalesTransaction.Status.PENDING
            ).count(),
            "lowStockItems": InventoryStock.objects.filter(
                qty_on_hand__gt=0,
                qty_on_hand__lte=models.F("reorder_point"),
                product_variant__is_active=True,
            ).count(),
            "outOfStockItems": InventoryStock.objects.filter(
                qty_on_hand__lte=0,
                product_variant__is_active=True,
            ).count(),
        }

        overall_status = "healthy"
        if any(check["status"] != "healthy" for check in checks):
            overall_status = "degraded"

        payload = {
            "status": overall_status,
            "checks": checks,
            "metrics": metrics,
        }
        return Response(payload, status=status.HTTP_200_OK)


class SystemRolloutView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _require_system_access(
            request.user,
            "You do not have access to rollout controls.",
        )
        if denied is not None:
            return denied

        flags = getattr(settings, "ROLLOUT_FLAGS", {})

        rollout_steps = [
            {
                "key": "DB_V2_READ_ENABLED",
                "label": "Read Path",
                "description": "Allow API reads from the v2 data model.",
            },
            {
                "key": "DB_V2_WRITE_ENABLED",
                "label": "Write Path",
                "description": "Allow API writes to the v2 data model.",
            },
            {
                "key": "DB_V2_DUAL_WRITE_ENABLED",
                "label": "Dual Write",
                "description": "Write to both legacy and v2 models during transition.",
            },
            {
                "key": "DB_V2_POS_RECEIPT_DUAL_WRITE_ENABLED",
                "label": "POS Receipt Dual Write",
                "description": "Mirror POS receipt writes while validating parity.",
            },
            {
                "key": "DB_V2_POS_RECEIPT_READ_ENABLED",
                "label": "POS Receipt Read",
                "description": "Serve POS receipts from v2 receipt tables.",
            },
            {
                "key": "DB_V2_RECONCILIATION_ENABLED",
                "label": "Reconciliation",
                "description": "Enable reconciliation tooling and parity checks.",
            },
        ]

        flags_payload = [
            {
                "key": step["key"],
                "label": step["label"],
                "description": step["description"],
                "enabled": bool(flags.get(step["key"], False)),
            }
            for step in rollout_steps
        ]

        recommended_phase = "phase_1"
        if bool(flags.get("DB_V2_DUAL_WRITE_ENABLED", False)):
            recommended_phase = "phase_2"
        if bool(flags.get("DB_V2_RECONCILIATION_ENABLED", False)):
            recommended_phase = "phase_3"
        if bool(flags.get("DB_V2_POS_RECEIPT_READ_ENABLED", False)):
            recommended_phase = "phase_4"

        payload = {
            "summary": {
                "recommendedPhase": recommended_phase,
                "readOnly": True,
                "message": "Flags are environment-driven and exposed for observability.",
            },
            "flags": flags_payload,
        }

        return Response(payload, status=status.HTTP_200_OK)


class SystemReconciliationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _require_system_access(
            request.user,
            "You do not have access to reconciliation metrics.",
        )
        if denied is not None:
            return denied

        payload = _build_reconciliation_snapshot()
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request):
        denied = _require_system_access(
            request.user,
            "You do not have access to reconciliation actions.",
        )
        if denied is not None:
            return denied

        fail_on_issues = bool(request.data.get("failOnIssues", False))
        snapshot = _build_reconciliation_snapshot()
        would_fail = fail_on_issues and snapshot["issueCounts"]["total"] > 0

        payload = {
            "executedAt": timezone.now().isoformat(),
            "failOnIssues": fail_on_issues,
            "wouldFail": would_fail,
            "snapshot": snapshot,
        }
        return Response(payload, status=status.HTTP_200_OK)
