from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory
from django.db import IntegrityError, transaction

from accounting.models import JournalEntry, JournalLine
from invoices.models import Invoice
from invoices.services import create_invoice
from payments.models import Payment, PaymentAllocation
from payments.services import create_payment_allocation

pytestmark = pytest.mark.django_db


@pytest.fixture
def sent_invoice(chart_of_accounts):
    customer = ContactFactory()
    item = ItemFactory()
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[{
            'item': item,
            'quantity': Decimal('1'),
            'unit_price': Decimal('200.00'),
            'discount': Decimal('0.00'),
            'tax_rate': Decimal('0.00'),
        }],
    )
    invoice.status = Invoice.Status.SENT
    invoice.save(update_fields=['status'])
    return invoice


def _make_payment(invoice, amount):
    return Payment.objects.create(
        customer=invoice.customer,
        amount=amount,
        payment_method=Payment.PaymentMethod.CASH,
        payment_date='2026-07-05',
    )


def test_full_allocation_marks_invoice_paid(sent_invoice):
    payment = _make_payment(sent_invoice, sent_invoice.grand_total)

    allocation = create_payment_allocation(
        payment=payment, invoice=sent_invoice, amount_allocated=sent_invoice.grand_total
    )

    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PAID
    assert allocation.amount_allocated == sent_invoice.grand_total


def test_partial_allocation_marks_invoice_partially_paid(sent_invoice):
    half = (sent_invoice.grand_total / 2).quantize(Decimal('0.01'))
    payment = _make_payment(sent_invoice, half)

    create_payment_allocation(payment=payment, invoice=sent_invoice, amount_allocated=half)

    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PARTIALLY_PAID


def test_two_partial_allocations_eventually_mark_paid(sent_invoice):
    half = (sent_invoice.grand_total / 2).quantize(Decimal('0.01'))
    remainder = sent_invoice.grand_total - half

    payment1 = _make_payment(sent_invoice, half)
    create_payment_allocation(payment=payment1, invoice=sent_invoice, amount_allocated=half)
    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PARTIALLY_PAID

    payment2 = _make_payment(sent_invoice, remainder)
    create_payment_allocation(payment=payment2, invoice=sent_invoice, amount_allocated=remainder)
    sent_invoice.refresh_from_db()
    assert sent_invoice.status == Invoice.Status.PAID


def test_allocation_posts_correct_journal_entry(sent_invoice):
    payment = _make_payment(sent_invoice, sent_invoice.grand_total)

    create_payment_allocation(
        payment=payment, invoice=sent_invoice, amount_allocated=sent_invoice.grand_total
    )

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

    payment = _make_payment(invoice, invoice.grand_total)
    create_payment_allocation(payment=payment, invoice=invoice, amount_allocated=invoice.grand_total)

    invoice.refresh_from_db()
    assert invoice.status == Invoice.Status.PAID
    assert not JournalEntry.objects.filter(source=JournalEntry.Source.PAYMENT).exists()


def test_allocation_amount_must_be_positive(sent_invoice):
    payment = _make_payment(sent_invoice, sent_invoice.grand_total)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            PaymentAllocation.objects.create(
                payment=payment, invoice=sent_invoice, amount_allocated=Decimal('0.00')
            )
