from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import connection
from django.db import models
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from customers.models import Customer
from inventory.models import InventoryStock
from pos.models import CashSession, SalesTransaction

ALLOWED_SYSTEM_ROLES = {"superadmin"}


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
