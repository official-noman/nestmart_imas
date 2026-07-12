from django.db import transaction
from rest_framework import serializers

from .models import Invoice, InvoiceLineItem
from .services import create_invoice


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = (
            'id',
            'item',
            'quantity',
            'unit_price',
            'discount',
            'tax_rate',
            'tax_amount',
            'total_amount',
        )
        read_only_fields = ('id', 'tax_amount', 'total_amount')


class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = (
            'id',
            'invoice_number',
            'customer',
            'status',
            'issue_date',
            'due_date',
            'subtotal',
            'discount_total',
            'tax_total',
            'grand_total',
            'lines',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'status',
            'subtotal',
            'discount_total',
            'tax_total',
            'grand_total',
            'created_at',
            'updated_at',
        )

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        return create_invoice(lines=lines_data, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines_data is not None:
            instance.lines.all().delete()
            for line_data in lines_data:
                InvoiceLineItem.objects.create(invoice=instance, **line_data)

        instance.calculate_totals()
        return instance
