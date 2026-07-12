from decimal import Decimal

from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models, transaction
from django.db.models import Q
from django.utils import timezone

from contacts.models import Contact
from core.models import CreatedAtModel


IMMUTABLE_UPDATE_MESSAGE = 'Posted journal entries are immutable and cannot be modified.'
IMMUTABLE_DELETE_MESSAGE = 'Posted journal entries are immutable and cannot be deleted.'


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
        prefix = getattr(settings, 'JOURNAL_ENTRY_NUMBER_PREFIX', 'JE')
        number_format = getattr(
            settings,
            'JOURNAL_ENTRY_NUMBER_FORMAT',
            '{prefix}-{year}-{sequence:04d}',
        )
        year = timezone.now().year
        entry_prefix = f'{prefix}-{year}-'

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

        return number_format.format(
            prefix=prefix,
            year=year,
            sequence=next_number,
        )

    def __str__(self):
        return self.entry_number


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


def create_journal_entry(*, date, description, source, lines):
    with transaction.atomic():
        journal_entry = JournalEntry.objects.create(
            date=date,
            description=description,
            source=source,
        )
        for line in lines:
            JournalLine.objects.create(
                journal_entry=journal_entry,
                account=line['account'],
                contact=line.get('contact'),
                entry_type=line['entry_type'],
                amount=Decimal(line['amount']),
            )
        return journal_entry


def post_double_entry(
    *,
    date,
    description,
    source,
    debit_account_code,
    credit_account_code,
    amount,
    debit_contact=None,
    credit_contact=None,
):
    """Post a simple two-line debit/credit journal entry between two accounts
    looked up by code. Returns None without posting anything if either
    account code isn't configured yet in the chart of accounts."""
    try:
        debit_account = Account.objects.get(code=debit_account_code)
        credit_account = Account.objects.get(code=credit_account_code)
    except Account.DoesNotExist:
        return None

    lines = [
        {
            'account': debit_account,
            'contact': debit_contact,
            'entry_type': JournalLine.EntryType.DEBIT,
            'amount': amount,
        },
        {
            'account': credit_account,
            'contact': credit_contact,
            'entry_type': JournalLine.EntryType.CREDIT,
            'amount': amount,
        },
    ]

    return create_journal_entry(date=date, description=description, source=source, lines=lines)
