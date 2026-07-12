import pytest
from conftest import TaxRateFactory

from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_tax_rates(api_client):
    # Act
    response = api_client.get('/api/v1/settings/taxes/')

    # Assert
    assert response.status_code == 401


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
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.post('/api/v1/settings/taxes/', {'name': 'VAT 15%', 'rate': '15.00'})

    # Assert
    assert response.status_code == 403


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
