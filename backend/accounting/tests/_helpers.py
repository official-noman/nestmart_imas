from decimal import Decimal

from accounting.models import JournalLine


def balanced_lines(ar_account, sales_account, contact=None, amount=Decimal('100.00')):
    """A minimal valid two-line debit/credit pair, reused by model, service,
    and serializer tests that all need *some* balanced entry to work with."""
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
