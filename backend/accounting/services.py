from decimal import Decimal

from django.db import transaction

from .models import Account, JournalEntry, JournalLine


def create_journal_entry(*, date, description, source, lines):
    with transaction.atomic():
        journal_entry = JournalEntry.objects.create(
            date=date,
            description=description,
            source=source,
        )
        for line in lines:
            JournalLine.objects.create(
                journal_entry=journal_entry,
                account=line['account'],
                contact=line.get('contact'),
                entry_type=line['entry_type'],
                amount=Decimal(line['amount']),
            )
        return journal_entry


def post_double_entry(
    *,
    date,
    description,
    source,
    debit_account_code,
    credit_account_code,
    amount,
    debit_contact=None,
    credit_contact=None,
):
    """Post a simple two-line debit/credit journal entry between two accounts
    looked up by code. Returns None without posting anything if either
    account code isn't configured yet in the chart of accounts."""
    try:
        debit_account = Account.objects.get(code=debit_account_code)
        credit_account = Account.objects.get(code=credit_account_code)
    except Account.DoesNotExist:
        return None

    lines = [
        {
            'account': debit_account,
            'contact': debit_contact,
            'entry_type': JournalLine.EntryType.DEBIT,
            'amount': amount,
        },
        {
            'account': credit_account,
            'contact': credit_contact,
            'entry_type': JournalLine.EntryType.CREDIT,
            'amount': amount,
        },
    ]

    return create_journal_entry(date=date, description=description, source=source, lines=lines)
