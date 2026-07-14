from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory, PaymentFactory, build_invoice

from apps.invoices.models import Invoice
from contacts.models import Contact
from payments.services import create_payment_allocation

pytestmark = pytest.mark.django_db


def test_outstanding_balance_is_zero_with_no_invoices():
    # Arrange
    contact = ContactFactory()

    # Act
    balance = contact.outstanding_balance

    # Assert
    assert balance == Decimal('0.00')


def test_outstanding_balance_reflects_unpaid_invoice(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()
    build_invoice(customer=customer, item=item, amount=Decimal('150.00'), status=Invoice.Status.SENT)

    # Act
    balance = customer.outstanding_balance

    # Assert
    assert balance == Decimal('150.00')


def test_outstanding_balance_excludes_allocated_payments(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()
    invoice = build_invoice(customer=customer, item=item, amount=Decimal('150.00'), status=Invoice.Status.SENT)
    payment = PaymentFactory(customer=customer, amount=Decimal('50.00'))
    create_payment_allocation(payment=payment, invoice=invoice, amount_allocated=Decimal('50.00'))

    # Act
    balance = customer.outstanding_balance

    # Assert
    assert balance == Decimal('100.00')


def test_delete_hard_deletes_contact_with_no_transactions():
    # Arrange
    contact = ContactFactory()
    contact_id = contact.id

    # Act
    contact.delete()

    # Assert
    assert not Contact.objects.filter(id=contact_id).exists()


def test_delete_soft_deletes_contact_with_invoices(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()
    build_invoice(customer=customer, item=item, amount=Decimal('50.00'), status=Invoice.Status.SENT)

    # Act
    customer.delete()

    # Assert
    customer.refresh_from_db()
    assert customer.is_active is False
