from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.utils.dateparse import parse_date
from django.utils import timezone

from contacts.models import Contact
from items.models import Item


TWOPLACES = Decimal('0.01')


class Invoice(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date', '-id']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        self._set_overdue_status()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_invoice_number(cls):
        prefix = getattr(settings, 'INVOICE_NUMBER_PREFIX', 'INV')
        number_format = getattr(
            settings,
            'INVOICE_NUMBER_FORMAT',
            '{prefix}-{year}-{sequence:04d}',
        )
        year = timezone.now().year
        invoice_prefix = f'{prefix}-{year}-'

        with transaction.atomic():
            latest_invoice = (
                cls.objects.select_for_update()
                .filter(invoice_number__startswith=invoice_prefix)
                .order_by('-invoice_number')
                .first()
            )

            next_number = 1
            if latest_invoice:
                try:
                    next_number = int(latest_invoice.invoice_number.rsplit('-', 1)[1]) + 1
                except (IndexError, ValueError):
                    next_number = 1

        return number_format.format(
            prefix=prefix,
            year=year,
            sequence=next_number,
        )

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
    quantity = models.IntegerField(default=1)
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
