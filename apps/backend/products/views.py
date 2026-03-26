from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductCreateUpdateSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for product categories.

    GET    /api/products/categories/          → list
    POST   /api/products/categories/          → create
    GET    /api/products/categories/{id}/     → retrieve
    PUT    /api/products/categories/{id}/     → update
    PATCH  /api/products/categories/{id}/     → partial update
    DELETE /api/products/categories/{id}/     → delete
    """

    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        qs = Category.objects.annotate(product_count=Count('products'))
        # Optional filter: ?active=true
        active = self.request.query_params.get('active')
        if active is not None:
            qs = qs.filter(is_active=active.lower() == 'true')
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD for products (menu items).

    GET    /api/products/items/               → list
    POST   /api/products/items/               → create
    GET    /api/products/items/{id}/          → retrieve
    PUT    /api/products/items/{id}/          → update
    PATCH  /api/products/items/{id}/          → partial update
    DELETE /api/products/items/{id}/          → delete
    GET    /api/products/items/sizes/         → available sizes
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category__name']
    ordering_fields = ['name', 'price', 'category__name', 'created_at']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductSerializer

    def get_queryset(self):
        qs = Product.objects.select_related('category')
        # Filter by category id
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        # Filter by availability
        available = self.request.query_params.get('available')
        if available is not None:
            qs = qs.filter(is_available=available.lower() == 'true')
        # Filter by size
        size = self.request.query_params.get('size')
        if size:
            qs = qs.filter(size=size)
        return qs

    @action(detail=False, methods=['get'])
    def sizes(self, request):
        """Return all available size choices."""
        return Response(
            [{'value': k, 'label': v} for k, v in Product.SIZE_CHOICES],
            status=status.HTTP_200_OK,
        )
