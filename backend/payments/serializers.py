from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import CreditNote, Payment, PaymentAllocation


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = (
            'id',
            'invoice',
            'amount_allocated',
        )
        read_only_fields = ('id',)


class PaymentSerializer(serializers.ModelSerializer):
    allocations = PaymentAllocationSerializer(many=True)

    class Meta:
        model = Payment
        fields = (
            'id',
            'customer',
            'amount',
            'payment_method',
            'reference',
            'payment_date',
            'allocations',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        allocations = attrs.get('allocations', [])
        amount = attrs.get('amount', getattr(self.instance, 'amount', Decimal('0.00')))
        total_allocated = sum(
            allocation['amount_allocated'] for allocation in allocations
        )

        if total_allocated > amount:
            raise serializers.ValidationError(
                'The sum of allocations cannot exceed the payment amount.'
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        allocations_data = validated_data.pop('allocations', [])
        payment = Payment.objects.create(**validated_data)

        for allocation_data in allocations_data:
            PaymentAllocation.objects.create(payment=payment, **allocation_data)

        return payment


class CreditNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditNote
        fields = (
            'id',
            'customer',
            'invoice',
            'amount',
            'note_type',
            'reason',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')
