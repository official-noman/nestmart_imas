from decimal import Decimal

from django.db import models
from django.db.models import Sum
from django.db.models.functions import Coalesce
from simple_history.models import HistoricalRecords

from core.models import TimeStampedModel


class Contact(TimeStampedModel):
    class ContactType(models.TextChoices):
        CUSTOMER = 'Customer', 'Customer'
        VENDOR = 'Vendor', 'Vendor'

    contact_type = models.CharField(max_length=20, choices=ContactType.choices)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    tax_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='GST/VAT/Tax ID',
    )
    billing_address = models.TextField()
    shipping_address = models.TextField(blank=True, null=True)
    credit_terms = models.IntegerField(
        default=0,
        help_text='Net payment terms in days, e.g., 30',
    )
    is_active = models.BooleanField(default=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['name']

    @property
    def outstanding_balance(self):
        """Sum of grand_total for this contact's unpaid/overdue invoices,
        minus payments already allocated against them.

        Done as two separate aggregates rather than one query joining
        invoices to allocations: summing grand_total across a join would
        multiply it once per allocation row on that invoice.

        Local imports avoid a circular import: invoices/payments both import
        Contact at module load time.
        """
        from invoices.models import Invoice
        from payments.models import PaymentAllocation

        outstanding_statuses = [
            Invoice.Status.SENT,
            Invoice.Status.PARTIALLY_PAID,
            Invoice.Status.OVERDUE,
        ]

        invoiced_total = self.invoices.filter(status__in=outstanding_statuses).aggregate(
            total=Coalesce(Sum('grand_total'), Decimal('0.00'))
        )['total']

        paid_total = PaymentAllocation.objects.filter(
            invoice__customer=self,
            invoice__status__in=outstanding_statuses,
        ).aggregate(total=Coalesce(Sum('amount_allocated'), Decimal('0.00')))['total']

        return invoiced_total - paid_total

    def delete(self, using=None, keep_parents=False):
        has_transactions = (
            self.invoices.exists()
            or self.payments.exists()
            or self.credit_notes.exists()
        )
        if has_transactions:
            self.is_active = False
            self.save(update_fields=['is_active', 'updated_at'])
            return 1, {self._meta.label: 1}
        return super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return f'{self.name} ({self.contact_type})'
