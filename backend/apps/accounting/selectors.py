from .models import Account, JournalEntry


def get_accounts():
    return Account.objects.all()


def get_journal_entries():
    return JournalEntry.objects.prefetch_related('lines__account', 'lines__contact').all()
