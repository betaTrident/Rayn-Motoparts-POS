from rest_framework import serializers

from .models import Customer, CustomerAddress


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "label",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "is_default",
            "created_at",
            "updated_at",
        ]


class CustomerListSerializer(serializers.ModelSerializer):
    customerCode = serializers.CharField(source="customer_code", read_only=True)
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    fullName = serializers.SerializerMethodField()
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    addressCount = serializers.IntegerField(source="address_count", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "customerCode",
            "firstName",
            "lastName",
            "fullName",
            "phone",
            "email",
            "isActive",
            "addressCount",
            "createdAt",
            "updatedAt",
        ]

    def get_fullName(self, obj):
        return f"{obj.first_name} {obj.last_name or ''}".strip()


class CustomerDetailSerializer(CustomerListSerializer):
    addresses = CustomerAddressSerializer(many=True, read_only=True)

    class Meta(CustomerListSerializer.Meta):
        fields = CustomerListSerializer.Meta.fields + ["addresses"]
