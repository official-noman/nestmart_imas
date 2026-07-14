from decimal import Decimal

from django.db import models
from simple_history.models import HistoricalRecords

from common.models import TimeStampedModel


class Item(TimeStampedModel):
    sku = models.CharField(
        max_length=100,
        unique=True,
        help_text='Stock Keeping Unit',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='Base price before tax',
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Tax percentage, e.g., 18.00 for 18%',
    )
    hsn_sac_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='HSN or SAC code for taxation',
    )
    track_stock = models.BooleanField(
        default=False,
        help_text='Whether to track inventory for this item',
    )
    stock_quantity = models.IntegerField(default=0)
    history = HistoricalRecords()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.sku})'
