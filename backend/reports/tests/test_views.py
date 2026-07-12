from decimal import Decimal

import pytest
from conftest import AccountFactory, ContactFactory, ItemFactory, PaymentFactory

from accounting.models import Account, JournalEntry
from accounting.services import create_journal_entry
from invoices.models import Invoice
from invoices.services import create_invoice
from payments.services import create_payment_allocation
from users.models import CustomUser

pytestmark = pytest.mark.django_db


def _paid_invoice(chart_of_accounts, amount):
    customer = ContactFactory()
    item = ItemFactory()
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

    payment = PaymentFactory(customer=customer, amount=amount)
    create_payment_allocation(payment=payment, invoice=invoice, amount_allocated=amount)
    invoice.refresh_from_db()
    return invoice


def test_anonymous_cannot_view_dashboard_kpis(api_client):
    # Act
    response = api_client.get('/api/v1/reports/dashboard/')

    # Assert
    assert response.status_code == 401


def test_dashboard_kpis_reflect_receivables_and_revenue(make_authenticated_client, chart_of_accounts):
    # Arrange
    invoice = _paid_invoice(chart_of_accounts, Decimal('100.00'))
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/reports/dashboard/')

    # Assert
    assert response.status_code == 200
    # Fully paid off, so net AR balance is back to zero.
    assert Decimal(response.data['total_receivables']) == Decimal('0.00')
    assert Decimal(response.data['total_revenue']) == invoice.grand_total


def test_dashboard_kpis_include_overdue_amount(make_authenticated_client, chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-01-01',
        due_date='2026-01-15',
        lines=[{
            'item': item,
            'quantity': Decimal('1'),
            'unit_price': Decimal('60.00'),
            'discount': Decimal('0.00'),
            'tax_rate': Decimal('0.00'),
        }],
    )
    invoice.status = Invoice.Status.SENT
    invoice.save(update_fields=['status'])
    Invoice.mark_overdue_invoices()
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/reports/dashboard/')

    # Assert
    assert response.status_code == 200
    assert Decimal(response.data['overdue_amount']) == Decimal('60.00')


def test_viewer_cannot_view_profit_and_loss(make_authenticated_client):
    # Arrange
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/reports/pnl/')

    # Assert
    assert response.status_code == 403


def test_profit_and_loss_computes_net_profit(make_authenticated_client, chart_of_accounts):
    # Arrange
    _paid_invoice(chart_of_accounts, Decimal('500.00'))
    rent = AccountFactory(code='6000', account_type=Account.AccountType.EXPENSE)
    cash = chart_of_accounts['cash']
    create_journal_entry(
        date='2026-07-01',
        description='Rent expense',
        source=JournalEntry.Source.MANUAL,
        lines=[
            {'account': rent, 'entry_type': 'DEBIT', 'amount': Decimal('200.00')},
            {'account': cash, 'entry_type': 'CREDIT', 'amount': Decimal('200.00')},
        ],
    )
    client, _ = make_authenticated_client(role=CustomUser.Role.ACCOUNTANT)

    # Act
    response = client.get('/api/v1/reports/pnl/')

    # Assert
    assert response.status_code == 200
    assert Decimal(response.data['total_income']) == Decimal('500.00')
    assert Decimal(response.data['total_expense']) == Decimal('200.00')
    assert Decimal(response.data['net_profit']) == Decimal('300.00')
