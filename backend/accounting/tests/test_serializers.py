import pytest
from conftest import AccountFactory

from accounting.models import JournalEntry, JournalLine
from accounting.serializers import JournalEntrySerializer

pytestmark = pytest.mark.django_db


def test_manual_journal_entry_serializer_rejects_unbalanced_entry():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    data = {
        'date': '2026-07-01',
        'description': 'Unbalanced',
        'source': JournalEntry.Source.MANUAL,
        'lines': [
            {'account': ar.id, 'entry_type': JournalLine.EntryType.DEBIT, 'amount': '100.00'},
            {'account': sales.id, 'entry_type': JournalLine.EntryType.CREDIT, 'amount': '50.00'},
        ],
    }

    # Act
    serializer = JournalEntrySerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert not is_valid
    assert not JournalEntry.objects.exists()


def test_manual_journal_entry_serializer_accepts_balanced_entry():
    # Arrange
    ar = AccountFactory(code='1200')
    sales = AccountFactory(code='4000')
    data = {
        'date': '2026-07-01',
        'description': 'Balanced',
        'source': JournalEntry.Source.MANUAL,
        'lines': [
            {'account': ar.id, 'entry_type': JournalLine.EntryType.DEBIT, 'amount': '100.00'},
            {'account': sales.id, 'entry_type': JournalLine.EntryType.CREDIT, 'amount': '100.00'},
        ],
    }
    serializer = JournalEntrySerializer(data=data)
    assert serializer.is_valid(), serializer.errors

    # Act
    entry = serializer.save()

    # Assert
    assert entry.lines.count() == 2
