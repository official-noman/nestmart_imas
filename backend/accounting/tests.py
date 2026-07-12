from decimal import Decimal

import pytest
from conftest import AccountFactory, ContactFactory
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction

from accounting.models import JournalEntry, JournalLine, create_journal_entry
from accounting.serializers import JournalEntrySerializer

pytestmark = pytest.mark.django_db


def _balanced_lines(ar_account, sales_account, contact=None, amount=Decimal('100.00')):
    return [
        {
            'account': ar_account,
            'contact': contact,
            'entry_type': JournalLine.EntryType.DEBIT,
            'amount': amount,
        },
        {
            'account': sales_account,
            'contact': None,
            'entry_type': JournalLine.EntryType.CREDIT,
            'amount': amount,
        },
    ]


def test_create_journal_entry_creates_balanced_lines():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    contact = ContactFactory()

    entry = create_journal_entry(
        date='2026-07-01',
        description='Test entry',
        source=JournalEntry.Source.MANUAL,
        lines=_balanced_lines(ar, sales, contact),
    )

    lines = list(entry.lines.all())
    assert len(lines) == 2
    debit_total = sum(line.amount for line in lines if line.entry_type == JournalLine.EntryType.DEBIT)
    credit_total = sum(line.amount for line in lines if line.entry_type == JournalLine.EntryType.CREDIT)
    assert debit_total == credit_total == Decimal('100.00')


def test_journal_entry_is_immutable_on_update():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=_balanced_lines(ar, sales),
    )

    entry.description = 'changed'
    with pytest.raises(DjangoValidationError):
        entry.save()


def test_journal_entry_is_immutable_on_delete():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=_balanced_lines(ar, sales),
    )

    with pytest.raises(DjangoValidationError):
        entry.delete()


def test_journal_line_is_immutable_on_update():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=_balanced_lines(ar, sales),
    )

    line = entry.lines.first()
    line.amount = Decimal('1.00')
    with pytest.raises(DjangoValidationError):
        line.save()


def test_journal_line_is_immutable_on_delete():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=_balanced_lines(ar, sales),
    )

    line = entry.lines.first()
    with pytest.raises(DjangoValidationError):
        line.delete()


def test_journal_line_amount_must_be_positive():
    """Regression guard: a 0.00 (or negative) journal line must never be
    persisted -- this is exactly the shape of the pre-fix invoice ledger
    bug, where a journal entry was posted with amount=0.00."""
    ar = AccountFactory(code='1200')
    entry = JournalEntry.objects.create(
        date='2026-07-01', description='x', source=JournalEntry.Source.MANUAL
    )

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            JournalLine.objects.create(
                journal_entry=entry,
                account=ar,
                entry_type=JournalLine.EntryType.DEBIT,
                amount=Decimal('0.00'),
            )


def test_manual_journal_entry_serializer_rejects_unbalanced_entry():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')

    serializer = JournalEntrySerializer(data={
        'date': '2026-07-01',
        'description': 'Unbalanced',
        'source': JournalEntry.Source.MANUAL,
        'lines': [
            {'account': ar.id, 'entry_type': JournalLine.EntryType.DEBIT, 'amount': '100.00'},
            {'account': sales.id, 'entry_type': JournalLine.EntryType.CREDIT, 'amount': '50.00'},
        ],
    })

    assert not serializer.is_valid()
    assert not JournalEntry.objects.exists()


def test_manual_journal_entry_serializer_accepts_balanced_entry():
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')

    serializer = JournalEntrySerializer(data={
        'date': '2026-07-01',
        'description': 'Balanced',
        'source': JournalEntry.Source.MANUAL,
        'lines': [
            {'account': ar.id, 'entry_type': JournalLine.EntryType.DEBIT, 'amount': '100.00'},
            {'account': sales.id, 'entry_type': JournalLine.EntryType.CREDIT, 'amount': '100.00'},
        ],
    })

    assert serializer.is_valid(), serializer.errors
    entry = serializer.save()
    assert entry.lines.count() == 2
