from django.db import models


class Account(models.Model):
    class AccountType(models.TextChoices):
        ASSET = 'Asset', 'Asset'
        LIABILITY = 'Liability', 'Liability'
        EQUITY = 'Equity', 'Equity'
        INCOME = 'Income', 'Income'
        EXPENSE = 'Expense', 'Expense'

    code = models.CharField(
        max_length=50,
        unique=True,
        help_text='e.g., 1000, 1200',
    )
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=AccountType.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'
