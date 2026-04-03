from decimal import Decimal

from django.utils.text import slugify
from rest_framework import serializers

from .models import Category, Product, ProductVariant, TaxRate, UnitOfMeasure


def _generate_unique_slug(model, seed: str, instance_pk=None) -> str:
    base = slugify(seed)[:100] or 'item'
    candidate = base
    idx = 2
    while model.objects.exclude(pk=instance_pk).filter(slug=candidate).exists():
        candidate = f"{base[:90]}-{idx}"
        idx += 1
    return candidate


def _generate_unique_sku(seed: str, instance_pk=None) -> str:
    base = slugify(seed).replace('-', '').upper()[:20] or 'ITEM'
    candidate = base
    idx = 2
    while Product.objects.exclude(pk=instance_pk).filter(sku=candidate).exists():
        candidate = f"{base[:16]}{idx:04d}"
        idx += 1
    return candidate


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'product_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'product_count', 'created_at', 'updated_at']

    def get_product_count(self, obj):
        return obj.product_set.filter(deleted_at__isnull=True).count()

    def create(self, validated_data):
        validated_data['slug'] = _generate_unique_slug(Category, validated_data['name'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'name' in validated_data:
            validated_data['slug'] = _generate_unique_slug(Category, validated_data['name'], instance.pk)
        return super().update(instance, validated_data)


class ProductReadSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    price = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()
    is_available = serializers.BooleanField(source='is_active')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'category_name',
            'description',
            'price',
            'size',
            'size_display',
            'is_available',
            'image',
            'created_at',
            'updated_at',
        ]

    def _first_variant(self, obj):
        return obj.variants.filter(deleted_at__isnull=True).order_by('id').first()

    def get_price(self, obj):
        variant = self._first_variant(obj)
        value = variant.effective_price if variant else obj.selling_price
        return str(value)

    def get_size(self, obj):
        variant = self._first_variant(obj)
        if variant and isinstance(variant.attributes, dict):
            return variant.attributes.get('size', 'medium')
        return 'medium'

    def get_size_display(self, obj):
        return self.get_size(obj).capitalize()

    def get_image(self, obj):
        return None


class ProductWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=220)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    price = serializers.DecimalField(max_digits=14, decimal_places=4, min_value=Decimal('0.0001'))
    size = serializers.ChoiceField(choices=['solo', 'small', 'medium', 'large'])
    is_available = serializers.BooleanField(default=True)
    image = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def _get_uom(self):
        return UnitOfMeasure.objects.filter(code='pcs').first() or UnitOfMeasure.objects.first()

    def _get_tax_rate(self):
        return TaxRate.objects.filter(name='VAT 12%').first() or TaxRate.objects.first()

    def create(self, validated_data):
        uom = self._get_uom()
        tax_rate = self._get_tax_rate()
        if not uom or not tax_rate:
            raise serializers.ValidationError('Unit of measure and tax rate must be seeded first.')

        price = validated_data['price']
        sku = _generate_unique_sku(validated_data['name'])

        product = Product.objects.create(
            category=validated_data['category'],
            brand=None,
            uom=uom,
            tax_rate=tax_rate,
            sku=sku,
            name=validated_data['name'],
            description=validated_data.get('description') or '',
            part_number=sku,
            cost_price=price,
            selling_price=price,
            is_taxable=True,
            is_serialized=False,
            is_active=validated_data['is_available'],
        )

        ProductVariant.objects.create(
            product=product,
            variant_sku=f"{sku}-STD",
            variant_name=None,
            attributes={'size': validated_data['size']},
            cost_price=price,
            selling_price=price,
            is_active=validated_data['is_available'],
        )

        return product

    def update(self, instance: Product, validated_data):
        price = validated_data.get('price', instance.selling_price)

        if 'name' in validated_data:
            instance.name = validated_data['name']
        if 'category' in validated_data:
            instance.category = validated_data['category']

        if 'description' in validated_data:
            instance.description = validated_data.get('description') or ''

        instance.selling_price = price
        instance.is_active = validated_data.get('is_available', instance.is_active)
        instance.save(
            update_fields=['name', 'category', 'description', 'selling_price', 'is_active', 'updated_at']
        )

        variant = instance.variants.filter(deleted_at__isnull=True).order_by('id').first()
        if variant:
            attrs = variant.attributes if isinstance(variant.attributes, dict) else {}
            if 'size' in validated_data:
                attrs['size'] = validated_data['size']
            variant.attributes = attrs
            variant.selling_price = price
            variant.cost_price = price
            variant.is_active = instance.is_active
            variant.save(
                update_fields=['attributes', 'selling_price', 'cost_price', 'is_active', 'updated_at']
            )

        return instance
