from decimal import Decimal

from django.db import models, transaction
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from simple_history.models import HistoricalRecords

from contacts.models import Contact
from core.models import TimeStampedModel
from items.models import Item


TWOPLACES = Decimal('0.01')


class InvoiceNumberSequence(models.Model):
    """Per-prefix counter row locked with select_for_update() to hand out
    sequential invoice numbers safely under concurrent requests."""

    prefix = models.CharField(max_length=100, unique=True)
    last_number = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.prefix} -> {self.last_number}'


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
