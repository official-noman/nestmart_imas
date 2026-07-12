from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory

from invoices.models import Invoice
from invoices.services import create_invoice
from users.models import CustomUser

pytestmark = pytest.mark.django_db


def _sent_invoice(customer, item, amount):
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[{
            'item': item,
            'quantity': Decimal('1'),
            'unit_price': amount,
            'discount': Decimal('0.00'),
            'tax_rate': Decimal('0.00'),
        }],
    )
    invoice.status = Invoice.Status.SENT
    invoice.save(update_fields=['status'])
    return invoice


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


def test_contacts_list_query_count_does_not_scale_with_contact_count(
    make_authenticated_client, chart_of_accounts, django_assert_num_queries,
):
    """Regression guard for the outstanding_balance N+1: listing contacts
    must run a fixed number of queries regardless of how many contacts (and
    invoices/payments) exist."""
    # Arrange
    item = ItemFactory()
    client, _ = make_authenticated_client(role=CustomUser.Role.ACCOUNTANT)

    one_contact = ContactFactory()
    _sent_invoice(one_contact, item, Decimal('100.00'))

    with django_assert_num_queries(1):  # single annotated SELECT, no pagination COUNT
        client.get('/api/v1/contacts/')

    for _ in range(4):
        c = ContactFactory()
        _sent_invoice(c, item, Decimal('50.00'))

    # Act + Assert: same query count with 5x the contacts and invoices
    with django_assert_num_queries(1):
        response = client.get('/api/v1/contacts/')

    assert response.status_code == 200
    assert len(response.data) == 5


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
