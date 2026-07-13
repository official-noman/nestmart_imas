import pytest
from conftest import AccountFactory
from test_helpers import assert_forbidden_for_role, assert_requires_authentication

from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_accounts(api_client):
    assert_requires_authentication(api_client, '/api/v1/accounts/')


def test_viewer_cannot_list_accounts(make_authenticated_client):
    assert_forbidden_for_role(make_authenticated_client, CustomUser.Role.VIEWER, '/api/v1/accounts/')


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
