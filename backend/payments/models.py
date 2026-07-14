from decimal import Decimal

from django.db import models
from django.db.models import Q, Sum
from simple_history.models import HistoricalRecords

from contacts.models import Contact
from common.models import CreatedAtModel
from invoices.models import Invoice


class Payment(CreatedAtModel):
    class PaymentMethod(models.TextChoices):
        CASH = 'Cash', 'Cash'
        BANK_TRANSFER = 'Bank Transfer', 'Bank Transfer'
        CREDIT_CARD = 'Credit Card', 'Credit Card'
        OTHER = 'Other', 'Other'

    customer = models.ForeignKey(
        Contact,
        related_name='payments',
        on_delete=models.PROTECT,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='Total payment received',
    )
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethod.choices,
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Cheque No, Txn ID, etc.',
    )
    payment_date = models.DateField()
    history = HistoricalRecords()

    class Meta:
        ordering = ['-payment_date', '-id']
        indexes = [
            models.Index(fields=['payment_date']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name='payment_amount_positive',
            ),
        ]

    def __str__(self):
        return f'{self.customer.name} - {self.amount}'


class PaymentAllocation(models.Model):
    payment = models.ForeignKey(
        Payment,
        related_name='allocations',
        on_delete=models.CASCADE,
    )
    invoice = models.ForeignKey(
        Invoice,
        related_name='allocations',
        on_delete=models.CASCADE,
    )
    amount_allocated = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['id']
        constraints = [
            models.CheckConstraint(
                condition=Q(amount_allocated__gt=0),
                name='paymentallocation_amount_positive',
            ),
        ]

    @classmethod
    def update_invoice_status(cls, invoice):
        total_paid = (
            invoice.allocations.aggregate(total=Sum('amount_allocated'))['total']
            or Decimal('0.00')
        )

        if total_paid >= invoice.grand_total:
            invoice.status = Invoice.Status.PAID
        elif Decimal('0.00') < total_paid < invoice.grand_total:
            invoice.status = Invoice.Status.PARTIALLY_PAID
        else:
            invoice.status = Invoice.Status.SENT

        invoice.save(update_fields=['status', 'updated_at'])

    def __str__(self):
        return f'{self.payment} -> {self.invoice.invoice_number}'


class CreditNote(CreatedAtModel):
    class NoteType(models.TextChoices):
        CREDIT_NOTE = 'Credit Note', 'Credit Note'
        REFUND = 'Refund', 'Refund'

    customer = models.ForeignKey(
        Contact,
        related_name='credit_notes',
        on_delete=models.PROTECT,
    )
    invoice = models.ForeignKey(
        Invoice,
        related_name='credit_notes',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note_type = models.CharField(max_length=50, choices=NoteType.choices)
    reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'{self.note_type} - {self.customer.name} - {self.amount}'
