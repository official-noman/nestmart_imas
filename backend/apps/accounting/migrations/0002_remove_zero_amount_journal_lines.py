from django.db import migrations


def remove_zero_amount_journal_lines(apps, schema_editor):
    """Delete journal entries left over from a pre-fix bug where an
    invoice's journal entry was posted with grand_total=0.00, before its
    line items/totals existed (fixed by routing invoice creation through
    invoices/services.py::create_invoice()). These 0.00 entries would
    violate the amount > 0 constraint being added next and carry no real
    ledger information."""
    JournalLine = apps.get_model('accounting', 'JournalLine')
    JournalEntry = apps.get_model('accounting', 'JournalEntry')

    entry_ids = list(
        JournalLine.objects.filter(amount__lte=0)
        .values_list('journal_entry_id', flat=True)
        .distinct()
    )
    JournalEntry.objects.filter(id__in=entry_ids).delete()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounting', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(remove_zero_amount_journal_lines, noop_reverse),
    ]
