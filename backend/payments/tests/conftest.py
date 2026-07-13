from decimal import Decimal

import pytest
from conftest import ContactFactory, ItemFactory, build_invoice

from invoices.models import Invoice


@pytest.fixture
def sent_invoice(chart_of_accounts):
    return build_invoice(
        customer=ContactFactory(),
        item=ItemFactory(),
        amount=Decimal('200.00'),
        status=Invoice.Status.SENT,
    )
