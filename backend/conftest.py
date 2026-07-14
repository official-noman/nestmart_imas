from decimal import Decimal

import factory
import pytest
from factory.django import DjangoModelFactory
from rest_framework.test import APIClient

from apps.accounting.models import Account
from apps.contacts.models import Contact
from apps.invoices.models import Invoice
from apps.invoices.services import create_invoice
from apps.items.models import Item
from apps.payments.models import Payment
from apps.payments.services import create_payment_allocation
from apps.core_settings.models import TaxRate
from apps.users.models import CustomUser


class UserFactory(DjangoModelFactory):
    class Meta:
        model = CustomUser
        skip_postgeneration_save = True

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


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    customer = factory.SubFactory(ContactFactory)
    amount = Decimal('100.00')
    payment_method = Payment.PaymentMethod.CASH
    payment_date = '2026-07-05'


class TaxRateFactory(DjangoModelFactory):
    class Meta:
        model = TaxRate

    name = factory.Sequence(lambda n: f'Tax Rate {n}')
    rate = Decimal('18.00')
    is_active = True


def build_invoice(*, customer, item, amount, status=Invoice.Status.DRAFT,
                   issue_date='2026-07-01', due_date='2026-07-15'):
    """Create a single-line invoice for `amount`, then push it to `status`.

    Consolidates what used to be three near-identical local helpers
    (payments/tests, contacts/tests, reports/tests each built a "sent
    invoice" by hand). Going through create_invoice() first means totals,
    the invoice number, and any journal entry are all produced the normal
    way -- only the status transition is short-circuited here.
    """
    invoice = create_invoice(
        customer=customer,
        issue_date=issue_date,
        due_date=due_date,
        lines=[{
            'item': item,
            'quantity': Decimal('1'),
            'unit_price': amount,
            'discount': Decimal('0.00'),
            'tax_rate': Decimal('0.00'),
        }],
    )
    if status != invoice.status:
        invoice.status = status
        invoice.save(update_fields=['status'])
    return invoice


def build_paid_invoice(*, customer, item, amount):
    """A SENT invoice immediately fully paid off via the normal allocation
    service, so it ends up PAID with a real payment/allocation behind it."""
    invoice = build_invoice(customer=customer, item=item, amount=amount, status=Invoice.Status.SENT)
    payment = PaymentFactory(customer=customer, amount=amount)
    create_payment_allocation(payment=payment, invoice=invoice, amount_allocated=amount)
    invoice.refresh_from_db()
    return invoice


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_authenticated_client(db):
    """Returns a factory: call it with a role (default Viewer) to get back
    (APIClient, user), authenticated via force_authenticate -- the standard
    DRF way to test view/permission behavior without exercising the JWT
    login flow itself (that's covered separately in users/tests)."""

    def _make(role=CustomUser.Role.VIEWER, **kwargs):
        user = UserFactory(role=role, **kwargs)
        client = APIClient()
        client.force_authenticate(user=user)
        return client, user

    return _make


@pytest.fixture
def chart_of_accounts(db):
    """The exact account codes invoices/services.py and payments/services.py
    look up (1200=AR, 4000=Sales, 1000=Cash) to post ledger entries."""
    return {
        'ar': AccountFactory(code='1200', name='Accounts Receivable', account_type=Account.AccountType.ASSET),
        'sales': AccountFactory(code='4000', name='Sales Revenue', account_type=Account.AccountType.INCOME),
        'cash': AccountFactory(code='1000', name='Cash', account_type=Account.AccountType.ASSET),
    }
