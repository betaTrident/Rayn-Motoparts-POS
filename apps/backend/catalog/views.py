from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Product
from .serializers import CategorySerializer, ProductReadSerializer, ProductWriteSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(deleted_at__isnull=True).order_by('sort_order', 'name')
    serializer_class = CategorySerializer

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
    queryset = Product.objects.filter(deleted_at__isnull=True).select_related('category').order_by('-created_at')

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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        output = ProductReadSerializer(instance, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        output = ProductReadSerializer(instance, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='sizes')
    def sizes(self, request):
        return Response(
            [
                {'value': 'solo', 'label': 'Solo'},
                {'value': 'small', 'label': 'Small'},
                {'value': 'medium', 'label': 'Medium'},
                {'value': 'large', 'label': 'Large'},
            ]
        )
