from decimal import Decimal

from django.db import transaction

from accounting.models import JournalEntry, post_double_entry

from .models import Invoice, InvoiceLineItem

AR_ACCOUNT_CODE = '1200'
SALES_ACCOUNT_CODE = '4000'


def create_invoice(*, customer, issue_date, due_date, lines, status=Invoice.Status.DRAFT):
    """Create an invoice with its line items and, once totals are known, the
    matching ledger entry. The journal entry is only posted after
    calculate_totals() has run so it always reflects the real grand total,
    never the zero-value the invoice starts out with."""
    with transaction.atomic():
        invoice = Invoice.objects.create(
            customer=customer,
            status=status,
            issue_date=issue_date,
            due_date=due_date,
        )

        for line_data in lines:
            InvoiceLineItem.objects.create(invoice=invoice, **line_data)

        invoice.calculate_totals()

        if invoice.grand_total > Decimal('0.00'):
            _create_invoice_journal_entry(invoice)

        return invoice


def _create_invoice_journal_entry(invoice):
    post_double_entry(
        date=invoice.issue_date,
        description=f'Invoice {invoice.invoice_number} creation',
        source=JournalEntry.Source.INVOICE,
        debit_account_code=AR_ACCOUNT_CODE,
        credit_account_code=SALES_ACCOUNT_CODE,
        amount=invoice.grand_total,
        debit_contact=invoice.customer,
    )
