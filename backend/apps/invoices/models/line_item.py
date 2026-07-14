from decimal import Decimal

from django.db import models
from django.db.models import Q

from apps.items.models import Item

from ._constants import TWOPLACES
from .invoice import Invoice


class InvoiceLineItem(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        related_name='lines',
        on_delete=models.CASCADE,
    )
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00'),
        help_text='Supports fractional quantities, e.g. hours worked',
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Discount amount for this line',
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )

    class Meta:
        ordering = ['id']
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0),
                name='invoicelineitem_quantity_positive',
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gte=0),
                name='invoicelineitem_unit_price_non_negative',
            ),
            models.CheckConstraint(
                condition=Q(discount__gte=0),
                name='invoicelineitem_discount_non_negative',
            ),
        ]

    def save(self, *args, **kwargs):
        line_subtotal = self.quantity * self.unit_price
        taxable_amount = line_subtotal - self.discount
        self.tax_amount = (taxable_amount * (self.tax_rate / Decimal('100'))).quantize(
            TWOPLACES
        )
        self.total_amount = (taxable_amount + self.tax_amount).quantize(TWOPLACES)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.invoice.invoice_number} - {self.item.name}'
