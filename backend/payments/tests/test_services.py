from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory

from apps.accounting.models import JournalEntry, JournalLine
from apps.invoices.models import Invoice
from apps.invoices.services import create_invoice
from payments.services import create_payment_allocation

from ._helpers import make_payment

pytestmark = pytest.mark.django_db


def test_full_allocation_marks_invoice_paid(sent_invoice):
    # Arrange
    payment = make_payment(sent_invoice, sent_invoice.grand_total)

    # Act
    allocation = create_payment_allocation(
        payment=payment, invoice=sent_invoice, amount_allocated=sent_invoice.grand_total
    )

    # Assert
    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PAID
    assert allocation.amount_allocated == sent_invoice.grand_total


def test_partial_allocation_marks_invoice_partially_paid(sent_invoice):
    # Arrange
    half = (sent_invoice.grand_total / 2).quantize(Decimal('0.01'))
    payment = make_payment(sent_invoice, half)

    # Act
    create_payment_allocation(payment=payment, invoice=sent_invoice, amount_allocated=half)

    # Assert
    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PARTIALLY_PAID


def test_two_partial_allocations_eventually_mark_paid(sent_invoice):
    """A multi-step scenario: partially pay, check the intermediate state,
    then pay the rest and check the final state -- kept as one test since
    the two allocations are one continuous story, not independent cases."""
    # Arrange
    half = (sent_invoice.grand_total / 2).quantize(Decimal('0.01'))
    remainder = sent_invoice.grand_total - half

    # Act (step 1) + Assert (step 1)
    payment1 = make_payment(sent_invoice, half)
    create_payment_allocation(payment=payment1, invoice=sent_invoice, amount_allocated=half)
    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PARTIALLY_PAID

    # Act (step 2) + Assert (step 2)
    payment2 = make_payment(sent_invoice, remainder)
    create_payment_allocation(payment=payment2, invoice=sent_invoice, amount_allocated=remainder)
    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PAID


def test_allocation_posts_correct_journal_entry(sent_invoice):
    # Arrange
    payment = make_payment(sent_invoice, sent_invoice.grand_total)

    # Act
    create_payment_allocation(
        payment=payment, invoice=sent_invoice, amount_allocated=sent_invoice.grand_total
    )

    # Assert
    entry = JournalEntry.objects.get(source=JournalEntry.Source.PAYMENT)
    assert sent_invoice.invoice_number in entry.description

    lines = list(entry.lines.all())
    debit = next(line for line in lines if line.entry_type == JournalLine.EntryType.DEBIT)
    credit = next(line for line in lines if line.entry_type == JournalLine.EntryType.CREDIT)

    assert debit.account.code == '1000'
    assert credit.account.code == '1200'
    assert debit.amount == credit.amount == sent_invoice.grand_total
    assert credit.contact == sent_invoice.customer


def test_allocation_without_chart_of_accounts_still_updates_status(db):
    # Arrange
    customer = ContactFactory()
    item = ItemFactory()
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[{
            'item': item,
            'quantity': Decimal('1'),
            'unit_price': Decimal('75.00'),
            'discount': Decimal('0.00'),
            'tax_rate': Decimal('0.00'),
        }],
    )
    invoice.status = Invoice.Status.SENT
    invoice.save(update_fields=['status'])
    payment = make_payment(invoice, invoice.grand_total)

    # Act
    create_payment_allocation(payment=payment, invoice=invoice, amount_allocated=invoice.grand_total)

    # Assert
    invoice.refresh_from_db()
    assert invoice.status == Invoice.Status.PAID
    assert not JournalEntry.objects.filter(source=JournalEntry.Source.PAYMENT).exists()
