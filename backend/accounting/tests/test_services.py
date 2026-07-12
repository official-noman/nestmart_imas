from decimal import Decimal

import pytest
from conftest import AccountFactory, ContactFactory

from accounting.models import JournalEntry, JournalLine
from accounting.services import create_journal_entry

from ._helpers import balanced_lines

pytestmark = pytest.mark.django_db


def test_create_journal_entry_creates_balanced_lines():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    contact = ContactFactory()

    # Act
    entry = create_journal_entry(
        date='2026-07-01',
        description='Test entry',
        source=JournalEntry.Source.MANUAL,
        lines=balanced_lines(ar, sales, contact),
    )

    # Assert
    lines = list(entry.lines.all())
    assert len(lines) == 2
    debit_total = sum(line.amount for line in lines if line.entry_type == JournalLine.EntryType.DEBIT)
    credit_total = sum(line.amount for line in lines if line.entry_type == JournalLine.EntryType.CREDIT)
    assert debit_total == credit_total == Decimal('100.00')
