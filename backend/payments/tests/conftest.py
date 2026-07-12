from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory

from invoices.models import Invoice
from invoices.services import create_invoice


@pytest.fixture
def sent_invoice(chart_of_accounts):
    customer = ContactFactory()
    item = ItemFactory()
    invoice = create_invoice(
        customer=customer,
        issue_date='2026-07-01',
        due_date='2026-07-15',
        lines=[{
            'item': item,
            'quantity': Decimal('1'),
            'unit_price': Decimal('200.00'),
            'discount': Decimal('0.00'),
            'tax_rate': Decimal('0.00'),
        }],
    )
    invoice.status = Invoice.Status.SENT
    invoice.save(update_fields=['status'])
    return invoice
