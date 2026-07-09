from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PaymentAllocation
from accounting.models import create_journal_entry, Account, JournalEntry, JournalLine
from django.utils import timezone

@receiver(post_save, sender=PaymentAllocation)
def create_payment_allocation_journal_entry(sender, instance, created, **kwargs):
    if created:
        try:
            cash_account = Account.objects.get(code='1000')
            ar_account = Account.objects.get(code='1200')
        except Account.DoesNotExist:
            return

        lines = [
            {
                'account': cash_account,
                'contact': None,
                'entry_type': JournalLine.EntryType.DEBIT,
                'amount': instance.amount_allocated,
            },
            {
                'account': ar_account,
                'contact': instance.invoice.customer,
                'entry_type': JournalLine.EntryType.CREDIT,
                'amount': instance.amount_allocated,
            }
        ]

        create_journal_entry(
            date=instance.payment.payment_date,
            description=f"Payment allocation to Invoice {instance.invoice.invoice_number}",
            source=JournalEntry.Source.PAYMENT,
            lines=lines
        )
