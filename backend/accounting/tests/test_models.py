from decimal import Decimal

import pytest
from conftest import AccountFactory
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction

from accounting.models import JournalEntry, JournalLine
from accounting.services import create_journal_entry

from ._helpers import balanced_lines

pytestmark = pytest.mark.django_db


def test_journal_entry_is_immutable_on_update():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=balanced_lines(ar, sales),
    )
    entry.description = 'changed'

    # Act + Assert
    with pytest.raises(DjangoValidationError):
        entry.save()


def test_journal_entry_is_immutable_on_delete():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=balanced_lines(ar, sales),
    )

    # Act + Assert
    with pytest.raises(DjangoValidationError):
        entry.delete()


def test_journal_line_is_immutable_on_update():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=balanced_lines(ar, sales),
    )
    line = entry.lines.first()
    line.amount = Decimal('1.00')

    # Act + Assert
    with pytest.raises(DjangoValidationError):
        line.save()


def test_journal_line_is_immutable_on_delete():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    entry = create_journal_entry(
        date='2026-07-01',
        description='original',
        source=JournalEntry.Source.MANUAL,
        lines=balanced_lines(ar, sales),
    )
    line = entry.lines.first()

    # Act + Assert
    with pytest.raises(DjangoValidationError):
        line.delete()


def test_journal_line_amount_must_be_positive():
    """Regression guard: a 0.00 (or negative) journal line must never be
    persisted -- this is exactly the shape of the pre-fix invoice ledger
    bug, where a journal entry was posted with amount=0.00."""
    # Arrange
    ar = AccountFactory(code='1200')
    entry = JournalEntry.objects.create(
        date='2026-07-01', description='x', source=JournalEntry.Source.MANUAL
    )

    # Act + Assert
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            JournalLine.objects.create(
                journal_entry=entry,
                account=ar,
                entry_type=JournalLine.EntryType.DEBIT,
                amount=Decimal('0.00'),
            )
