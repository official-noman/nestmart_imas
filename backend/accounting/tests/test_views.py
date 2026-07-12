import pytest
from conftest import AccountFactory

from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_accounts(api_client):
    # Act
    response = api_client.get('/api/v1/accounts/')

    # Assert
    assert response.status_code == 401


def test_viewer_cannot_list_accounts(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/accounts/')

    # Assert
    assert response.status_code == 403


def test_accountant_can_list_accounts(make_authenticated_client):
    # Arrange
    AccountFactory(code='1200')
    client, _ = make_authenticated_client(role=CustomUser.Role.ACCOUNTANT)

    # Act
    response = client.get('/api/v1/accounts/')

    # Assert
    assert response.status_code == 200
    assert len(response.data) == 1


def test_admin_can_create_account(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.ADMIN)

    # Act
    response = client.post('/api/v1/accounts/', {
        'code': '5000',
        'name': 'Rent Expense',
        'account_type': 'Expense',
    })

    # Assert
    assert response.status_code == 201
    assert response.data['code'] == '5000'
