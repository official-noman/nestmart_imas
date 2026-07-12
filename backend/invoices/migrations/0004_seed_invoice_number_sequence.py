import re

from django.db import migrations


def seed_sequence(apps, schema_editor):
    """Backfill InvoiceNumberSequence from any invoices created before this
    table existed, so newly generated numbers don't collide with them."""
    Invoice = apps.get_model('invoices', 'Invoice')
    InvoiceNumberSequence = apps.get_model('invoices', 'InvoiceNumberSequence')

    highest_per_prefix = {}
    for invoice_number in Invoice.objects.values_list('invoice_number', flat=True):
        match = re.match(r'^(.*)-(\d+)$', invoice_number or '')
        if not match:
            continue
        prefix, sequence = match.group(1), int(match.group(2))
        highest_per_prefix[prefix] = max(highest_per_prefix.get(prefix, 0), sequence)

    for prefix, last_number in highest_per_prefix.items():
        InvoiceNumberSequence.objects.update_or_create(
            prefix=prefix,
            defaults={'last_number': last_number},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0003_invoicenumbersequence'),
    ]

    operations = [
        migrations.RunPython(seed_sequence, noop_reverse),
    ]
