import pytest
from conftest import ContactFactory, ItemFactory
from test_helpers import assert_forbidden_for_role, assert_requires_authentication

from apps.users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_invoices(api_client):
    assert_requires_authentication(api_client, '/api/v1/invoices/')


def test_viewer_cannot_list_invoices(make_authenticated_client):
    assert_forbidden_for_role(make_authenticated_client, CustomUser.Role.VIEWER, '/api/v1/invoices/')


def test_accountant_can_create_invoice_via_api(make_authenticated_client, chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()
    client, _ = make_authenticated_client(role=CustomUser.Role.ACCOUNTANT)

    # Act
    response = client.post('/api/v1/invoices/', {
        'customer': customer.id,
        'issue_date': '2026-07-01',
        'due_date': '2026-07-15',
        'lines': [
            {'item': item.id, 'quantity': '1', 'unit_price': '50.00', 'discount': '0.00', 'tax_rate': '0.00'},
        ],
    }, format='json')

    # Assert
    assert response.status_code == 201
    assert response.data['grand_total'] == '50.00'
