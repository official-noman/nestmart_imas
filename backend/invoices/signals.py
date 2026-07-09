from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Invoice
from accounting.models import create_journal_entry, Account, JournalEntry, JournalLine
from django.db import transaction

@receiver(post_save, sender=Invoice)
def create_invoice_journal_entry(sender, instance, created, **kwargs):
    if created and instance.status in [Invoice.Status.DRAFT, Invoice.Status.SENT]:
        try:
            ar_account = Account.objects.get(code='1200')
            sales_account = Account.objects.get(code='4000')
        except Account.DoesNotExist:
            return  # Wait until default accounts exist

        lines = [
            {
                'account': ar_account,
                'contact': instance.customer,
                'entry_type': JournalLine.EntryType.DEBIT,
                'amount': instance.grand_total,
            },
            {
                'account': sales_account,
                'contact': None,
                'entry_type': JournalLine.EntryType.CREDIT,
                'amount': instance.grand_total,
            }
        ]

        create_journal_entry(
            date=instance.issue_date,
            description=f"Invoice {instance.invoice_number} creation",
            source=JournalEntry.Source.INVOICE,
            lines=lines
        )
