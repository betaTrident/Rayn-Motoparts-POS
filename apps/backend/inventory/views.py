from decimal import Decimal

from django.db import transaction
from django.db.models import DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, ProductVariant
from .models import (
    InventoryStock,
    StockAdjustment,
    StockMovement,
    get_default_warehouse,
)

ALLOWED_INVENTORY_ROLES = {"superadmin", "admin", "staff"}


def _has_inventory_access(user) -> bool:
    return user.is_superuser or user.groups.filter(name__in=ALLOWED_INVENTORY_ROLES).exists()


def _to_float(value: Decimal | None) -> float:
    return float(value or Decimal("0"))


def _parse_int(value: str | None, default: int, minimum: int = 1, maximum: int = 500) -> int:
    try:
        parsed = int(value) if value is not None else default
    except (TypeError, ValueError):
        return default
    return max(minimum, min(parsed, maximum))


def _paginate(queryset, page: int, page_size: int) -> tuple[list, dict]:
    total_count = queryset.count()
    total_pages = max(1, (total_count + page_size - 1) // page_size)
    page = min(page, total_pages)
    offset = (page - 1) * page_size
    return list(queryset[offset : offset + page_size]), {
        "page": page,
        "pageSize": page_size,
        "totalCount": total_count,
        "totalPages": total_pages,
        "hasPrevious": page > 1,
        "hasNext": page < total_pages,
    }


def _user_display(user) -> str:
    if not user:
        return "Unknown"
    return f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip() or user.username


def _serialize_stock(row: InventoryStock) -> dict:
    variant = row.product_variant
    product = variant.product
    return {
        "id": row.id,
        "variant_id": variant.id,
        "variant_sku": variant.variant_sku,
        "product_name": product.name,
        "category": product.category.name if product.category_id else "Uncategorized",
        "qty_on_hand": _to_float(row.qty_on_hand),
        "qty_reserved": _to_float(row.qty_reserved),
        "qty_available": _to_float(row.qty_available),
        "reorder_point": _to_float(row.reorder_point),
        "reorder_qty": _to_float(row.reorder_qty),
        "max_stock_level": _to_float(row.max_stock_level) if row.max_stock_level is not None else None,
        "avg_cost": _to_float(row.avg_cost),
        "status": row.stock_status,
        "last_counted_at": timezone.localtime(row.last_counted_at).isoformat() if row.last_counted_at else None,
    }


def _serialize_movement(row: StockMovement) -> dict:
    variant = row.product_variant
    product = variant.product
    return {
        "id": row.id,
        "variant_sku": variant.variant_sku,
        "product_name": product.name,
        "movement_type": row.movement_type,
        "reference_type": row.reference_type,
        "reference_id": row.reference_id,
        "qty_before": _to_float(row.qty_before),
        "qty_change": _to_float(row.qty_change),
        "qty_after": _to_float(row.qty_after),
        "performed_by": _user_display(row.performed_by),
        "created_at": timezone.localtime(row.created_at).isoformat(),
    }


class InventoryStockListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_inventory_access(request.user):
            return Response({"detail": "You do not have access to inventory."}, status=status.HTTP_403_FORBIDDEN)

        queryset = (
            InventoryStock.objects.select_related("product_variant__product__category")
            .filter(product_variant__deleted_at__isnull=True)
            .order_by("product_variant__variant_sku")
        )

        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "").strip().upper()
        category = request.query_params.get("category", "").strip()

        if search:
            queryset = queryset.filter(
                Q(product_variant__variant_sku__icontains=search)
                | Q(product_variant__product__name__icontains=search)
                | Q(product_variant__product__sku__icontains=search)
                | Q(product_variant__product__part_number__icontains=search)
            )

        if category:
            queryset = queryset.filter(product_variant__product__category_id=category)

        if status_filter == "OUT_OF_STOCK":
            queryset = queryset.filter(qty_on_hand__lte=F("qty_reserved"))
        elif status_filter == "LOW_STOCK":
            queryset = queryset.filter(
                qty_on_hand__gt=F("qty_reserved"),
                qty_on_hand__lte=F("qty_reserved") + F("reorder_point"),
            )
        elif status_filter == "IN_STOCK":
            queryset = queryset.filter(qty_on_hand__gt=F("qty_reserved") + F("reorder_point"))

        page = _parse_int(request.query_params.get("page"), 1)
        page_size = _parse_int(request.query_params.get("page_size"), 25)
        rows, pagination = _paginate(queryset, page, page_size)

        categories = Category.objects.filter(
            product__variants__inventorystock__isnull=False,
            deleted_at__isnull=True,
        ).distinct().order_by("name")

        return Response(
            {
                "results": [_serialize_stock(row) for row in rows],
                "categories": [{"id": cat.id, "name": cat.name} for cat in categories],
                "pagination": pagination,
            },
            status=status.HTTP_200_OK,
        )


class InventoryStockSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_inventory_access(request.user):
            return Response({"detail": "You do not have access to inventory."}, status=status.HTTP_403_FORBIDDEN)

        queryset = InventoryStock.objects.filter(product_variant__deleted_at__isnull=True)
        stock_value = ExpressionWrapper(F("qty_on_hand") * F("avg_cost"), output_field=DecimalField())

        in_stock_count = 0
        low_stock_count = 0
        out_of_stock_count = 0
        for row in queryset.only("qty_on_hand", "qty_reserved", "reorder_point"):
            if row.stock_status == "OUT_OF_STOCK":
                out_of_stock_count += 1
            elif row.stock_status == "LOW_STOCK":
                low_stock_count += 1
            else:
                in_stock_count += 1

        total_stock_value = queryset.aggregate(total=Coalesce(Sum(stock_value), Decimal("0")))["total"]

        return Response(
            {
                "total_variants_tracked": queryset.count(),
                "in_stock_count": in_stock_count,
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
                "total_stock_value": _to_float(total_stock_value),
            },
            status=status.HTTP_200_OK,
        )


class StockMovementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_inventory_access(request.user):
            return Response({"detail": "You do not have access to inventory movements."}, status=status.HTTP_403_FORBIDDEN)

        queryset = (
            StockMovement.objects.select_related("product_variant__product", "performed_by")
            .order_by("-created_at")
        )

        variant_sku = request.query_params.get("variant_sku", "").strip()
        movement_type = request.query_params.get("movement_type", "").strip()
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if variant_sku:
            queryset = queryset.filter(product_variant__variant_sku__icontains=variant_sku)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        page = _parse_int(request.query_params.get("page"), 1)
        page_size = _parse_int(request.query_params.get("page_size"), 50)
        rows, pagination = _paginate(queryset, page, page_size)

        return Response(
            {
                "results": [_serialize_movement(row) for row in rows],
                "movementTypes": [choice[0] for choice in StockMovement.MovementType.choices],
                "pagination": pagination,
            },
            status=status.HTTP_200_OK,
        )


class StockAdjustView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _has_inventory_access(request.user):
            return Response({"detail": "You do not have access to adjust inventory."}, status=status.HTTP_403_FORBIDDEN)

        variant_id = request.data.get("variant_id")
        adjustment_type = request.data.get("adjustment_type")
        reason = str(request.data.get("reason") or "").strip()
        notes = str(request.data.get("notes") or "").strip()

        try:
            quantity = Decimal(str(request.data.get("quantity")))
        except Exception:
            return Response({"quantity": "Enter a valid quantity."}, status=status.HTTP_400_BAD_REQUEST)

        if adjustment_type not in StockAdjustment.AdjustmentType.values:
            return Response({"adjustment_type": "Select add or subtract."}, status=status.HTTP_400_BAD_REQUEST)
        if quantity <= 0:
            return Response({"quantity": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
        if not reason:
            return Response({"reason": "Reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            variant = ProductVariant.objects.select_related("product").get(pk=variant_id, deleted_at__isnull=True)
        except ProductVariant.DoesNotExist:
            return Response({"variant_id": "Product variant was not found."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            warehouse = get_default_warehouse()
            stock, _ = InventoryStock.objects.select_for_update().get_or_create(
                product_variant=variant,
                warehouse=warehouse,
                defaults={"avg_cost": variant.effective_cost or Decimal("0")},
            )
            qty_before = stock.qty_on_hand
            qty_change = quantity if adjustment_type == StockAdjustment.AdjustmentType.ADD else -quantity
            qty_after = qty_before + qty_change

            if qty_after < 0:
                return Response(
                    {"detail": "Adjustment would make stock negative. Reduce the quantity and try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            adjustment = StockAdjustment.objects.create(
                product_variant=variant,
                warehouse=warehouse,
                adjustment_type=adjustment_type,
                quantity=quantity,
                reason=reason,
                notes=notes,
                performed_by=request.user,
            )
            stock.qty_on_hand = qty_after
            stock.save(update_fields=["qty_on_hand", "updated_at"])

            movement = StockMovement.objects.create(
                product_variant=variant,
                warehouse=warehouse,
                movement_type=(
                    StockMovement.MovementType.ADJUSTMENT_ADD
                    if adjustment_type == StockAdjustment.AdjustmentType.ADD
                    else StockMovement.MovementType.ADJUSTMENT_SUB
                ),
                reference_type=StockMovement.ReferenceType.STOCK_ADJUSTMENT,
                reference_id=adjustment.id,
                qty_before=qty_before,
                qty_change=qty_change,
                qty_after=qty_after,
                unit_cost=stock.avg_cost,
                notes=f"{reason}\n{notes}".strip(),
                performed_by=request.user,
            )

        return Response(
            {"stock": _serialize_stock(stock), "movement": _serialize_movement(movement)},
            status=status.HTTP_201_CREATED,
        )


class StockConfigureView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk: int):
        if not _has_inventory_access(request.user):
            return Response({"detail": "You do not have access to configure inventory."}, status=status.HTTP_403_FORBIDDEN)

        try:
            stock = InventoryStock.objects.select_related("product_variant__product__category").get(pk=pk)
        except InventoryStock.DoesNotExist:
            return Response({"detail": "Stock row was not found."}, status=status.HTTP_404_NOT_FOUND)

        errors = {}
        updates = {}
        for field in ["reorder_point", "reorder_qty", "max_stock_level"]:
            if field not in request.data:
                continue
            value = request.data.get(field)
            if value in ("", None) and field == "max_stock_level":
                updates[field] = None
                continue
            try:
                parsed = Decimal(str(value))
            except Exception:
                errors[field] = "Enter a valid number."
                continue
            if parsed < 0:
                errors[field] = "Value cannot be negative."
                continue
            updates[field] = parsed

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        for field, value in updates.items():
            setattr(stock, field, value)
        stock.save(update_fields=[*updates.keys(), "updated_at"] if updates else ["updated_at"])

        return Response(_serialize_stock(stock), status=status.HTTP_200_OK)
