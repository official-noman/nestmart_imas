import pytest
from conftest import ItemFactory

from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_items(api_client):
    # Act
    response = api_client.get('/api/v1/items/')

    # Assert
    assert response.status_code == 401


def test_any_authenticated_role_can_list_items(make_authenticated_client):
    # Arrange
    ItemFactory()
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/items/')

    # Assert
    assert response.status_code == 200
    assert len(response.data) == 1


def test_authenticated_user_can_create_item(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.post('/api/v1/items/', {
        'sku': 'SKU9000',
        'name': 'Consulting Hour',
        'unit_price': '75.00',
    })

    # Assert
    assert response.status_code == 201
    assert response.data['sku'] == 'SKU9000'
