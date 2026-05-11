from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Product, TaxRate
from .permissions import (
    can_delete_products,
    can_read_products,
    can_write_products,
)
from .serializers import CategorySerializer, ProductReadSerializer, ProductWriteSerializer, TaxRateSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(deleted_at__isnull=True).order_by('sort_order', 'name')
    serializer_class = CategorySerializer

    def _permission_denied_response(self, detail: str):
        return Response({'detail': detail}, status=status.HTTP_403_FORBIDDEN)

    def list(self, request, *args, **kwargs):
        if not can_read_products(request.user):
            return self._permission_denied_response('You do not have access to view categories.')
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not can_read_products(request.user):
            return self._permission_denied_response('You do not have access to view categories.')
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not can_write_products(request.user):
            return self._permission_denied_response('You do not have access to create categories.')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not can_write_products(request.user):
            return self._permission_denied_response('You do not have access to update categories.')
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not can_write_products(request.user):
            return self._permission_denied_response('You do not have access to update categories.')
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not can_delete_products(request.user):
            return self._permission_denied_response('You do not have access to delete categories.')
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        return queryset


class ProductViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = (
        Product.objects.filter(deleted_at__isnull=True)
        .select_related('category')
        .prefetch_related('variants')
        .order_by('-created_at')
    )

    def _permission_denied_response(self, detail: str):
        return Response({'detail': detail}, status=status.HTTP_403_FORBIDDEN)

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        available = self.request.query_params.get('available')
        size = self.request.query_params.get('size')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category_id=category)

        if available is not None:
            queryset = queryset.filter(is_active=available.lower() == 'true')

        if size:
            queryset = queryset.filter(variants__attributes__size=size, variants__deleted_at__isnull=True)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(part_number__icontains=search)
            )

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        return ProductReadSerializer

    def create(self, request, *args, **kwargs):
        if not can_write_products(request.user):
            return self._permission_denied_response('You do not have access to create products.')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        output = ProductReadSerializer(instance, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        if not can_read_products(request.user):
            return self._permission_denied_response('You do not have access to view products.')
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not can_read_products(request.user):
            return self._permission_denied_response('You do not have access to view products.')
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not can_write_products(request.user):
            return self._permission_denied_response('You do not have access to update products.')
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        output = ProductReadSerializer(instance, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        if not can_delete_products(request.user):
            return self._permission_denied_response('You do not have access to delete products.')
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='sizes')
    def sizes(self, request):
        if not can_read_products(request.user):
            return self._permission_denied_response('You do not have access to view product sizes.')

        values = (
            queryset_value
            for queryset_value in Product.objects.filter(deleted_at__isnull=True)
            .values_list('variants__attributes__size', flat=True)
        )
        normalized_sizes = sorted(
            {
                value.strip()
                for value in values
                if isinstance(value, str) and value.strip()
            },
            key=lambda item: item.lower(),
        )
        return Response([{'value': value, 'label': value} for value in normalized_sizes])

    @action(detail=False, methods=['get'], url_path='tax-rates')
    def tax_rates(self, request):
        if not can_read_products(request.user):
            return self._permission_denied_response('You do not have access to view tax rates.')

        queryset = TaxRate.objects.filter(deleted_at__isnull=True, is_active=True).order_by('name')
        return Response(TaxRateSerializer(queryset, many=True).data, status=status.HTTP_200_OK)
