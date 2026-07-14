from rest_framework import serializers

from ...models import Contact


class ContactSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.SerializerMethodField()

    def get_outstanding_balance(self, obj):
        # Prefer the single-query annotation from Contact.with_outstanding_balance()
        # (used by the viewset); fall back to the per-instance property for any
        # other context, e.g. a Contact fetched without that queryset.
        annotated = getattr(obj, 'outstanding_balance_annotated', None)
        return annotated if annotated is not None else obj.outstanding_balance

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
