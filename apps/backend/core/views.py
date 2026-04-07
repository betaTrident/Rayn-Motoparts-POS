from django.contrib.auth import get_user_model
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


class SystemHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to system health metrics."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
