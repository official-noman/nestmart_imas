from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory

from accounting.models import JournalEntry, JournalLine
from invoices.models import Invoice
from invoices.services import create_invoice

from ._helpers import line

pytestmark = pytest.mark.django_db


def test_create_invoice_calculates_totals_with_tax_and_discount(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()

    # Act
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[line(item, '2', '100.00', discount='20.00', tax_rate='10.00')],
    )

    # Assert
    # subtotal = 2 * 100 = 200; taxable = 200 - 20 = 180; tax = 18; grand = 198
    assert invoice.subtotal == Decimal('200.00')
    assert invoice.discount_total == Decimal('20.00')
    assert invoice.tax_total == Decimal('18.00')
    assert invoice.grand_total == Decimal('198.00')


def test_create_invoice_sums_multiple_lines(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item_a = ItemFactory()
    item_b = ItemFactory()

    # Act
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[
            line(item_a, '1', '50.00'),
            line(item_b, '3', '10.00', tax_rate='10.00'),
        ],
    )

    # Assert
    # line1: 50.00 total. line2: subtotal 30, tax 3, total 33.
    assert invoice.subtotal == Decimal('80.00')
    assert invoice.tax_total == Decimal('3.00')
    assert invoice.grand_total == Decimal('83.00')


def test_create_invoice_posts_journal_entry_with_correct_amount(chart_of_accounts):
    """Regression test for the ledger bug: the journal entry must reflect
    the real, post-calculate_totals() grand_total, never the 0.00 the
    invoice starts out with before its line items exist."""
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()

    # Act
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[line(item, '3', '50.00')],
    )

    # Assert
    assert invoice.grand_total == Decimal('150.00')

    entry = JournalEntry.objects.get(source=JournalEntry.Source.INVOICE)
    assert invoice.invoice_number in entry.description

    lines = list(entry.lines.all())
    assert len(lines) == 2
    debit = next(line for line in lines if line.entry_type == JournalLine.EntryType.DEBIT)
    credit = next(line for line in lines if line.entry_type == JournalLine.EntryType.CREDIT)

    assert debit.amount == credit.amount == Decimal('150.00')
    assert debit.account.code == '1200'
    assert credit.account.code == '4000'
    assert debit.contact == customer


def test_create_invoice_skips_journal_entry_when_total_is_zero(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()

    # Act
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[line(item, '1', '100.00', discount='100.00')],
    )

    # Assert
    assert invoice.grand_total == Decimal('0.00')
    assert not JournalEntry.objects.filter(source=JournalEntry.Source.INVOICE).exists()


def test_create_invoice_without_chart_of_accounts_does_not_crash(db):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()

    # Act
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[line(item, '1', '20.00')],
    )

    # Assert
    assert invoice.grand_total == Decimal('20.00')
    assert not JournalEntry.objects.filter(source=JournalEntry.Source.INVOICE).exists()


def test_invoice_numbers_are_sequential_and_unique(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()

    # Act
    invoices = [
        create_invoice(
            customer=customer,
            issue_date='2026-07-01',
            due_date='2026-07-15',
            lines=[line(item, '1', '10.00')],
        )
        for _ in range(3)
    ]

    # Assert
    numbers = [inv.invoice_number for inv in invoices]
    assert len(set(numbers)) == 3


def test_new_invoice_defaults_to_draft_status(chart_of_accounts):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()

    # Act
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[line(item, '1', '10.00')],
    )

    # Assert
    assert invoice.status == Invoice.Status.DRAFT
