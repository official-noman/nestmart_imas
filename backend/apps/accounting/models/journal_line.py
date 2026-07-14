from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from contacts.models import Contact

from .account import Account
from .journal_entry import IMMUTABLE_DELETE_MESSAGE, IMMUTABLE_UPDATE_MESSAGE, JournalEntry


class JournalLine(models.Model):
    class EntryType(models.TextChoices):
        DEBIT = 'DEBIT', 'DEBIT'
        CREDIT = 'CREDIT', 'CREDIT'

    journal_entry = models.ForeignKey(
        JournalEntry,
        related_name='lines',
        on_delete=models.CASCADE,
    )
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Used for AR/AP sub-ledgers',
    )
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['id']
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name='journalline_amount_positive',
            ),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError(IMMUTABLE_UPDATE_MESSAGE)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(IMMUTABLE_DELETE_MESSAGE)

    def __str__(self):
        return f'{self.journal_entry.entry_number} - {self.entry_type} {self.amount}'
