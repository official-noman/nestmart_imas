import pytest
from conftest import ContactFactory

from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_contacts(api_client):
    # Act
    response = api_client.get('/api/v1/contacts/')

    # Assert
    assert response.status_code == 401


def test_any_authenticated_role_can_list_contacts(make_authenticated_client):
    # Arrange
    ContactFactory()
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/contacts/')

    # Assert
    assert response.status_code == 200
    assert len(response.data) == 1


def test_authenticated_user_can_create_contact(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.post('/api/v1/contacts/', {
        'contact_type': 'Customer',
        'name': 'Acme Corp',
        'billing_address': '123 Main St',
    })

    # Assert
    assert response.status_code == 201
    assert response.data['name'] == 'Acme Corp'
