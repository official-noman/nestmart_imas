import pytest
from conftest import ItemFactory

from apps.items.api.v1.serializers import ItemSerializer

pytestmark = pytest.mark.django_db


def test_rejects_negative_stock_when_tracking_enabled():
    # Arrange
    data = {
        'sku': 'SKU0001',
        'name': 'Widget',
        'unit_price': '10.00',
        'track_stock': True,
        'stock_quantity': -5,
    }

    # Act
    serializer = ItemSerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert not is_valid
    assert 'non_field_errors' in serializer.errors


def test_allows_negative_stock_when_tracking_disabled():
    # Arrange
    data = {
        'sku': 'SKU0002',
        'name': 'Service Item',
        'unit_price': '10.00',
        'track_stock': False,
        'stock_quantity': -5,
    }

    # Act
    serializer = ItemSerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert is_valid, serializer.errors


def test_update_keeps_existing_track_stock_when_omitted():
    # Arrange
    item = ItemFactory(track_stock=True, stock_quantity=5)

    # Act
    serializer = ItemSerializer(instance=item, data={'stock_quantity': -1}, partial=True)
    is_valid = serializer.is_valid()

    # Assert
    assert not is_valid
