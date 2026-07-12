from django.db import transaction

from accounting.models import JournalEntry
from accounting.services import post_double_entry

from .models import PaymentAllocation

CASH_ACCOUNT_CODE = '1000'
AR_ACCOUNT_CODE = '1200'


def create_payment_allocation(*, payment, invoice, amount_allocated):
    """Allocate a payment to an invoice, update the invoice's status, and post
    the matching ledger entry, all as one atomic unit."""
    with transaction.atomic():
        allocation = PaymentAllocation.objects.create(
            payment=payment,
            invoice=invoice,
            amount_allocated=amount_allocated,
        )

        PaymentAllocation.update_invoice_status(invoice)
        _create_allocation_journal_entry(allocation)

        return allocation


def _create_allocation_journal_entry(allocation):
    post_double_entry(
        date=allocation.payment.payment_date,
        description=f'Payment allocation to Invoice {allocation.invoice.invoice_number}',
        source=JournalEntry.Source.PAYMENT,
        debit_account_code=CASH_ACCOUNT_CODE,
        credit_account_code=AR_ACCOUNT_CODE,
        amount=allocation.amount_allocated,
        credit_contact=allocation.invoice.customer,
    )
