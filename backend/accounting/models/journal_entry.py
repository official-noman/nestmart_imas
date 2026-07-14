from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone

from apps.common.models import CreatedAtModel

IMMUTABLE_UPDATE_MESSAGE = 'Posted journal entries are immutable and cannot be modified.'
IMMUTABLE_DELETE_MESSAGE = 'Posted journal entries are immutable and cannot be deleted.'


class JournalEntry(CreatedAtModel):
    class Source(models.TextChoices):
        MANUAL = 'Manual', 'Manual'
        INVOICE = 'Invoice', 'Invoice'
        PAYMENT = 'Payment', 'Payment'

    entry_number = models.CharField(max_length=100, unique=True, blank=True)
    date = models.DateField()
    description = models.TextField()
    source = models.CharField(
        max_length=50,
        choices=Source.choices,
        default=Source.MANUAL,
    )

    class Meta:
        ordering = ['-date', '-id']
        indexes = [
            models.Index(fields=['date']),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError(IMMUTABLE_UPDATE_MESSAGE)
        if not self.entry_number:
            self.entry_number = self._generate_entry_number()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(IMMUTABLE_DELETE_MESSAGE)

    @classmethod
    def _generate_entry_number(cls):
        year = timezone.now().year
        entry_prefix = f'JE-{year}-'

        with transaction.atomic():
            latest_entry = (
                cls.objects.select_for_update()
                .filter(entry_number__startswith=entry_prefix)
                .order_by('-entry_number')
                .first()
            )

            next_number = 1
            if latest_entry:
                try:
                    next_number = int(latest_entry.entry_number.rsplit('-', 1)[1]) + 1
                except (IndexError, ValueError):
                    next_number = 1

        return f'{entry_prefix}{next_number:04d}'

    def __str__(self):
        return self.entry_number
