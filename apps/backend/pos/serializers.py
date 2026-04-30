from decimal import Decimal

from rest_framework import serializers

from customers.models import Customer

from .models import PaymentMethod


class PosCheckoutItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    qty = serializers.DecimalField(
        max_digits=12,
        decimal_places=4,
        min_value=Decimal("0.0001"),
    )


class PosCheckoutPaymentSerializer(serializers.Serializer):
    payment_method_id = serializers.IntegerField(min_value=1)
    amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=4,
        min_value=Decimal("0.0001"),
    )
    reference_number = serializers.CharField(
        max_length=120,
        required=False,
        allow_blank=True,
        allow_null=True,
    )


class PosCheckoutRequestSerializer(serializers.Serializer):
    cash_session_id = serializers.IntegerField(min_value=1)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.filter(is_active=True, deleted_at__isnull=True),
        required=False,
        allow_null=True,
    )
    customer_name = serializers.CharField(
        max_length=180,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    items = PosCheckoutItemSerializer(many=True, allow_empty=False)
    payments = PosCheckoutPaymentSerializer(many=True, allow_empty=False)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        payments = attrs.get("payments", [])
        if len(payments) != 1:
            raise serializers.ValidationError(
                {"payments": "Phase 1 checkout supports exactly one payment."}
            )

        payment_method_ids = [payment["payment_method_id"] for payment in payments]
        active_method_ids = set(
            PaymentMethod.objects.filter(id__in=payment_method_ids, is_active=True).values_list(
                "id", flat=True
            )
        )
        if len(active_method_ids) != len(payment_method_ids):
            raise serializers.ValidationError(
                {"payments": "One or more payment methods are inactive or invalid."}
            )

        cleaned_customer_name = (attrs.get("customer_name") or "").strip()
        customer = attrs.get("customer_id")
        if customer is None and not cleaned_customer_name:
            attrs["customer_name"] = "Walk-in Customer"
        else:
            attrs["customer_name"] = cleaned_customer_name or None

        return attrs


class CurrentCashSessionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    sessionCode = serializers.CharField()
    status = serializers.CharField()
    openingBalance = serializers.FloatField()
    expectedCashBalance = serializers.FloatField()
    openedAt = serializers.CharField()


class PaymentMethodSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()


class OpenCashSessionRequestSerializer(serializers.Serializer):
    opening_balance = serializers.DecimalField(
        max_digits=14,
        decimal_places=4,
        min_value=Decimal("0"),
        required=False,
        default=Decimal("0"),
    )
