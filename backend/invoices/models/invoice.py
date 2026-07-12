from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone
from django.utils.dateparse import parse_date
from simple_history.models import HistoricalRecords

from contacts.models import Contact
from core.models import TimeStampedModel

from ._constants import TWOPLACES
from .sequence import InvoiceNumberSequence


class Invoice(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        SENT = 'Sent', 'Sent'
        PARTIALLY_PAID = 'Partially Paid', 'Partially Paid'
        PAID = 'Paid', 'Paid'
        OVERDUE = 'Overdue', 'Overdue'
        CANCELLED = 'Cancelled', 'Cancelled'

    invoice_number = models.CharField(max_length=100, unique=True, blank=True)
    customer = models.ForeignKey(
        Contact,
        related_name='invoices',
        on_delete=models.PROTECT,
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    issue_date = models.DateField()
    due_date = models.DateField()
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    discount_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    tax_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    grand_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    history = HistoricalRecords()

    class Meta:
        ordering = ['-issue_date', '-id']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        self._set_overdue_status()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_invoice_number(cls):
        year = timezone.now().year
        sequence_key = f'INV-{year}'

        # Locking a dedicated counter row (rather than the latest Invoice row)
        # avoids the race where two concurrent requests both see "no invoices
        # yet this year" and generate the same number 1.
        with transaction.atomic():
            InvoiceNumberSequence.objects.get_or_create(prefix=sequence_key)
            sequence = InvoiceNumberSequence.objects.select_for_update().get(
                prefix=sequence_key
            )
            sequence.last_number += 1
            sequence.save(update_fields=['last_number'])
            next_number = sequence.last_number

        return f'{sequence_key}-{next_number:04d}'

    def calculate_totals(self):
        subtotal = Decimal('0.00')
        discount_total = Decimal('0.00')
        tax_total = Decimal('0.00')
        grand_total = Decimal('0.00')

        for line in self.lines.all():
            line_subtotal = line.quantity * line.unit_price
            subtotal += line_subtotal
            discount_total += line.discount
            tax_total += line.tax_amount
            grand_total += line.total_amount

        self.subtotal = subtotal.quantize(TWOPLACES)
        self.discount_total = discount_total.quantize(TWOPLACES)
        self.tax_total = tax_total.quantize(TWOPLACES)
        self.grand_total = grand_total.quantize(TWOPLACES)
        self.save(
            update_fields=[
                'status',
                'subtotal',
                'discount_total',
                'tax_total',
                'grand_total',
                'updated_at',
            ]
        )

    @classmethod
    def mark_overdue_invoices(cls):
        return cls.objects.filter(
            due_date__lt=timezone.localdate(),
            status__in=[
                cls.Status.DRAFT,
                cls.Status.SENT,
                cls.Status.PARTIALLY_PAID,
            ],
        ).update(status=cls.Status.OVERDUE)

    def _set_overdue_status(self):
        due_date = (
            parse_date(self.due_date)
            if isinstance(self.due_date, str)
            else self.due_date
        )
        if (
            due_date
            and due_date < timezone.localdate()
            and self.status
            in [
                self.Status.DRAFT,
                self.Status.SENT,
                self.Status.PARTIALLY_PAID,
            ]
        ):
            self.status = self.Status.OVERDUE

    def __str__(self):
        return self.invoice_number
