from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description',
            'is_active', 'product_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name', read_only=True,
    )
    size_display = serializers.CharField(
        source='get_size_display', read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name',
            'description', 'price', 'size', 'size_display',
            'is_available', 'image',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Separate serializer for create/update to handle validation."""

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'description',
            'price', 'size', 'is_available', 'image',
        ]
        read_only_fields = ['id']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than zero.')
        return value
