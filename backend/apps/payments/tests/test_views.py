import pytest
from test_helpers import assert_forbidden_for_role, assert_requires_authentication

from apps.users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_payments(api_client):
    assert_requires_authentication(api_client, '/api/v1/payments/')


def test_viewer_cannot_list_payments(make_authenticated_client):
    assert_forbidden_for_role(make_authenticated_client, CustomUser.Role.VIEWER, '/api/v1/payments/')


def test_accountant_can_record_payment_via_api(make_authenticated_client, sent_invoice):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.ACCOUNTANT)

    # Act
    response = client.post('/api/v1/payments/', {
        'customer': sent_invoice.customer.id,
        'amount': str(sent_invoice.grand_total),
        'payment_method': 'Cash',
        'payment_date': '2026-07-05',
        'allocations': [
            {'invoice': sent_invoice.id, 'amount_allocated': str(sent_invoice.grand_total)},
        ],
    }, format='json')

    # Assert
    assert response.status_code == 201
