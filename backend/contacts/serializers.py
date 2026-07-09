from rest_framework import serializers

from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Contact
        fields = (
            'id',
            'contact_type',
            'name',
            'email',
            'phone',
            'tax_id',
            'billing_address',
            'shipping_address',
            'credit_terms',
            'is_active',
            'outstanding_balance',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'outstanding_balance', 'created_at', 'updated_at')
