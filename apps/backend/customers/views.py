from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Customer
from .serializers import CustomerDetailSerializer, CustomerListSerializer

ALLOWED_SYSTEM_ROLES = {"superadmin", "admin", "staff"}


def _parse_bool(value: str | None):
    if value is None:
        return None
    lowered = value.strip().lower()
    if lowered in {"true", "1", "yes", "active"}:
        return True
    if lowered in {"false", "0", "no", "inactive"}:
        return False
    return None


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


class CustomerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to customers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        query = request.query_params.get("q", "").strip()
        active_filter = _parse_bool(request.query_params.get("active"))
        page = _parse_page(request.query_params.get("page"))
        page_size = _parse_page_size(request.query_params.get("page_size"))

        queryset = (
            Customer.objects.filter(deleted_at__isnull=True)
            .annotate(address_count=Count("addresses"))
            .order_by("first_name", "last_name", "customer_code")
        )

        if active_filter is not None:
            queryset = queryset.filter(is_active=active_filter)

        if query:
            queryset = queryset.filter(
                Q(customer_code__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(phone__icontains=query)
                | Q(email__icontains=query)
            )

        total_count = queryset.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)
        offset = (page - 1) * page_size

        rows = queryset[offset : offset + page_size]
        results = CustomerListSerializer(rows, many=True).data

        return Response(
            {
                "results": results,
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


class CustomerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_id: int):
        user = request.user
        has_system_role = user.groups.filter(name__in=ALLOWED_SYSTEM_ROLES).exists()
        if not has_system_role and not user.is_superuser:
            return Response(
                {"detail": "You do not have access to customer details."},
                status=status.HTTP_403_FORBIDDEN,
            )

        customer = (
            Customer.objects.filter(deleted_at__isnull=True, pk=customer_id)
            .annotate(address_count=Count("addresses"))
            .prefetch_related("addresses")
            .first()
        )

        if not customer:
            return Response(
                {"detail": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        payload = CustomerDetailSerializer(customer).data
        return Response(payload, status=status.HTTP_200_OK)
