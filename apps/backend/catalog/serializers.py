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
    sku = serializers.CharField(read_only=True)
    part_number = serializers.CharField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    uom_code = serializers.CharField(source='uom.code', read_only=True)
    tax_rate_name = serializers.CharField(source='tax_rate.name', read_only=True)
    cost_price = serializers.SerializerMethodField()
    selling_price = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    is_taxable = serializers.BooleanField(read_only=True)
    is_serialized = serializers.BooleanField(read_only=True)
    variant_sku = serializers.SerializerMethodField()
    variant_name = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()
    is_available = serializers.BooleanField(source='is_active')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'sku',
            'part_number',
            'name',
            'category',
            'category_name',
            'uom_code',
            'tax_rate_name',
            'description',
            'cost_price',
            'selling_price',
            'is_active',
            'is_taxable',
            'is_serialized',
            'variant_sku',
            'variant_name',
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

    def get_cost_price(self, obj):
        variant = self._first_variant(obj)
        value = variant.effective_cost if variant else obj.cost_price
        return str(value)

    def get_selling_price(self, obj):
        variant = self._first_variant(obj)
        value = variant.effective_price if variant else obj.selling_price
        return str(value)

    def get_variant_sku(self, obj):
        variant = self._first_variant(obj)
        return variant.variant_sku if variant else None

    def get_variant_name(self, obj):
        variant = self._first_variant(obj)
        return variant.variant_name if variant else None

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
    sku = serializers.CharField(max_length=80, required=False, allow_blank=True)
    name = serializers.CharField(max_length=220)
    part_number = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cost_price = serializers.DecimalField(max_digits=14, decimal_places=4, min_value=Decimal('0.0000'), required=False)
    selling_price = serializers.DecimalField(max_digits=14, decimal_places=4, min_value=Decimal('0.0001'), required=False)
    price = serializers.DecimalField(max_digits=14, decimal_places=4, min_value=Decimal('0.0001'), required=False)
    variant_sku = serializers.CharField(max_length=100, required=False, allow_blank=True)
    variant_name = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    size = serializers.ChoiceField(choices=['solo', 'small', 'medium', 'large'])
    is_active = serializers.BooleanField(required=False)
    is_taxable = serializers.BooleanField(required=False, default=True)
    is_serialized = serializers.BooleanField(required=False, default=False)
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

        selling_price = validated_data.get('selling_price', validated_data.get('price'))
        if selling_price is None:
            raise serializers.ValidationError({'selling_price': 'Selling price is required.'})
        cost_price = validated_data.get('cost_price', selling_price)
        provided_sku = (validated_data.get('sku') or '').strip()
        sku = provided_sku or _generate_unique_sku(validated_data['name'])
        part_number = validated_data.get('part_number') or sku
        is_active = validated_data.get('is_active', validated_data['is_available'])
        variant_sku = (validated_data.get('variant_sku') or '').strip() or f"{sku}-STD"

        product = Product.objects.create(
            category=validated_data['category'],
            brand=None,
            uom=uom,
            tax_rate=tax_rate,
            sku=sku,
            name=validated_data['name'],
            description=validated_data.get('description') or '',
            part_number=part_number,
            cost_price=cost_price,
            selling_price=selling_price,
            is_taxable=validated_data.get('is_taxable', True),
            is_serialized=validated_data.get('is_serialized', False),
            is_active=is_active,
        )

        ProductVariant.objects.create(
            product=product,
            variant_sku=variant_sku,
            variant_name=validated_data.get('variant_name'),
            attributes={'size': validated_data['size']},
            cost_price=cost_price,
            selling_price=selling_price,
            is_active=is_active,
        )

        return product

    def update(self, instance: Product, validated_data):
        selling_price = validated_data.get(
            'selling_price',
            validated_data.get('price', instance.selling_price),
        )
        cost_price = validated_data.get('cost_price', instance.cost_price)
        is_active = validated_data.get('is_active', validated_data.get('is_available', instance.is_active))

        if 'sku' in validated_data and validated_data.get('sku'):
            instance.sku = validated_data['sku'].strip()
        if 'name' in validated_data:
            instance.name = validated_data['name']
        if 'category' in validated_data:
            instance.category = validated_data['category']
        if 'part_number' in validated_data:
            instance.part_number = validated_data.get('part_number') or instance.sku

        if 'description' in validated_data:
            instance.description = validated_data.get('description') or ''

        instance.cost_price = cost_price
        instance.selling_price = selling_price
        instance.is_active = is_active
        instance.is_taxable = validated_data.get('is_taxable', instance.is_taxable)
        instance.is_serialized = validated_data.get('is_serialized', instance.is_serialized)
        instance.save(
            update_fields=[
                'sku',
                'name',
                'category',
                'description',
                'part_number',
                'cost_price',
                'selling_price',
                'is_taxable',
                'is_serialized',
                'is_active',
                'updated_at',
            ]
        )

        variant = instance.variants.filter(deleted_at__isnull=True).order_by('id').first()
        if variant:
            attrs = variant.attributes if isinstance(variant.attributes, dict) else {}
            if 'size' in validated_data:
                attrs['size'] = validated_data['size']
            variant.attributes = attrs
            if 'variant_sku' in validated_data and validated_data.get('variant_sku'):
                variant.variant_sku = validated_data['variant_sku'].strip()
            if 'variant_name' in validated_data:
                variant.variant_name = validated_data.get('variant_name') or None
            variant.selling_price = selling_price
            variant.cost_price = cost_price
            variant.is_active = instance.is_active
            variant.save(
                update_fields=[
                    'variant_sku',
                    'variant_name',
                    'attributes',
                    'selling_price',
                    'cost_price',
                    'is_active',
                    'updated_at',
                ]
            )

        return instance
