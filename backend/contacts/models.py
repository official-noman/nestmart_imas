from decimal import Decimal

from django.db import models
from simple_history.models import HistoricalRecords


class Contact(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['name']

    @property
    def outstanding_balance(self):
        return Decimal('0.00')

    def delete(self, using=None, keep_parents=False):
        has_transactions = False
        if has_transactions:
            self.is_active = False
            self.save(update_fields=['is_active', 'updated_at'])
            return 1, {self._meta.label: 1}
        return super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return f'{self.name} ({self.contact_type})'
