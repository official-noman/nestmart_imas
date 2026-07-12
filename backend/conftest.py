from decimal import Decimal

import factory
import pytest
from factory.django import DjangoModelFactory

from accounting.models import Account
from contacts.models import Contact
from items.models import Item
from users.models import CustomUser


class UserFactory(DjangoModelFactory):
    class Meta:
        model = CustomUser

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    role = CustomUser.Role.VIEWER
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or 'testpass123')
        if create:
            self.save()


class AccountFactory(DjangoModelFactory):
    class Meta:
        model = Account

    code = factory.Sequence(lambda n: str(1000 + n))
    name = factory.Faker('word')
    account_type = Account.AccountType.ASSET
    is_active = True


class ContactFactory(DjangoModelFactory):
    class Meta:
        model = Contact

    contact_type = Contact.ContactType.CUSTOMER
    name = factory.Faker('company')
    email = factory.Sequence(lambda n: f'contact{n}@example.com')
    billing_address = factory.Faker('address')
    is_active = True


class ItemFactory(DjangoModelFactory):
    class Meta:
        model = Item

    sku = factory.Sequence(lambda n: f'SKU{n:04d}')
    name = factory.Faker('word')
    unit_price = Decimal('100.00')
    tax_rate = Decimal('0.00')


@pytest.fixture
def chart_of_accounts(db):
    """The exact account codes invoices/services.py and payments/services.py
    look up (1200=AR, 4000=Sales, 1000=Cash) to post ledger entries."""
    return {
        'ar': AccountFactory(code='1200', name='Accounts Receivable', account_type=Account.AccountType.ASSET),
        'sales': AccountFactory(code='4000', name='Sales Revenue', account_type=Account.AccountType.INCOME),
        'cash': AccountFactory(code='1000', name='Cash', account_type=Account.AccountType.ASSET),
    }
