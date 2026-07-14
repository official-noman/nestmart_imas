from decimal import Decimal

import pytest
from conftest import AccountFactory, ContactFactory, ItemFactory, build_invoice, build_paid_invoice
from test_helpers import assert_forbidden_for_role, assert_requires_authentication

from apps.accounting.models import Account, JournalEntry
from apps.accounting.services import create_journal_entry
from apps.invoices.models import Invoice
from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_view_dashboard_kpis(api_client):
    assert_requires_authentication(api_client, '/api/v1/reports/dashboard/')


def test_dashboard_kpis_reflect_receivables_and_revenue(make_authenticated_client, chart_of_accounts):
    # Arrange
    invoice = build_paid_invoice(customer=ContactFactory(), item=ItemFactory(), amount=Decimal('100.00'))
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
    build_invoice(
        customer=ContactFactory(),
        item=ItemFactory(),
        amount=Decimal('60.00'),
        status=Invoice.Status.SENT,
        issue_date='2026-01-01',
        due_date='2026-01-15',
    )
    Invoice.mark_overdue_invoices()
    client, _ = make_authenticated_client(role=CustomUser.Role.VIEWER)

    # Act
    response = client.get('/api/v1/reports/dashboard/')

    # Assert
    assert response.status_code == 200
    assert Decimal(response.data['overdue_amount']) == Decimal('60.00')


def test_viewer_cannot_view_profit_and_loss(make_authenticated_client):
    assert_forbidden_for_role(make_authenticated_client, CustomUser.Role.VIEWER, '/api/v1/reports/pnl/')


def test_profit_and_loss_computes_net_profit(make_authenticated_client, chart_of_accounts):
    # Arrange
    build_paid_invoice(customer=ContactFactory(), item=ItemFactory(), amount=Decimal('500.00'))
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
