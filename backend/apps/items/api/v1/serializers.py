from rest_framework import serializers

from ...models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = (
            'id',
            'sku',
            'name',
            'description',
            'unit_price',
            'tax_rate',
            'hsn_sac_code',
            'track_stock',
            'stock_quantity',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, attrs):
        track_stock = attrs.get(
            'track_stock',
            getattr(self.instance, 'track_stock', False),
        )
        stock_quantity = attrs.get(
            'stock_quantity',
            getattr(self.instance, 'stock_quantity', 0),
        )

        if track_stock and stock_quantity < 0:
            raise serializers.ValidationError(
                'Stock quantity cannot be negative when stock tracking is enabled.'
            )

        return attrs
