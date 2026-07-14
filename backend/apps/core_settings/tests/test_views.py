import pytest
from conftest import TaxRateFactory
from test_helpers import assert_forbidden_for_role, assert_requires_authentication

from apps.users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_tax_rates(api_client):
    assert_requires_authentication(api_client, '/api/v1/settings/taxes/')


def test_viewer_can_read_tax_rates(make_authenticated_client):
    # Arrange
    TaxRateFactory(name='GST 18%', rate='18.00')
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/settings/taxes/')

    # Assert
    assert response.status_code == 200
    assert len(response.data) == 1


def test_viewer_cannot_create_tax_rate(make_authenticated_client):
    assert_forbidden_for_role(
        make_authenticated_client, CustomUser.Role.VIEWER, '/api/v1/settings/taxes/',
        method='post', data={'name': 'VAT 15%', 'rate': '15.00'},
    )


def test_admin_can_create_tax_rate(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.ADMIN)

    # Act
    response = client.post('/api/v1/settings/taxes/', {'name': 'VAT 15%', 'rate': '15.00'})

    # Assert
    assert response.status_code == 201
    assert response.data['name'] == 'VAT 15%'


def test_admin_can_create_company_profile(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.ADMIN)

    # Act
    response = client.post('/api/v1/settings/company/', {'name': 'Nestmart IT'})

    # Assert
    assert response.status_code == 201
    assert response.data['name'] == 'Nestmart IT'
