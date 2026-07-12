from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction

from payments.models import PaymentAllocation

from ._helpers import make_payment

pytestmark = pytest.mark.django_db


def test_allocation_amount_must_be_positive(sent_invoice):
    # Arrange
    payment = make_payment(sent_invoice, sent_invoice.grand_total)

    # Act + Assert
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            PaymentAllocation.objects.create(
                payment=payment, invoice=sent_invoice, amount_allocated=Decimal('0.00')
            )
