from django.db import models

class TaxRate(models.Model):
    name = models.CharField(max_length=100, help_text="e.g., GST 18%, VAT 15%")
    rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage rate")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.rate}%)"

class CompanyProfile(models.Model):
    name = models.CharField(max_length=255)
    currency_symbol = models.CharField(max_length=10, default='$')
    logo = models.URLField(max_length=500, blank=True, null=True)
    invoice_prefix = models.CharField(max_length=20, default='INV')
    tax_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name
