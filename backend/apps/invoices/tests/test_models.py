import pytest
from conftest import ContactFactory
from freezegun import freeze_time

from apps.invoices.models import Invoice

pytestmark = pytest.mark.django_db


def _draft_invoice(customer, issue_date, due_date):
    return Invoice.objects.create(customer=customer, issue_date=issue_date, due_date=due_date)


def test_invoice_number_prefix_resets_each_year():
    """_generate_invoice_number() keys its per-year counter off
    timezone.now().year -- only observable by controlling "now", since the
    real year won't roll over during a test run."""
    customer = ContactFactory()

    with freeze_time('2026-12-31'):
        december_invoice = _draft_invoice(customer, '2026-12-31', '2027-01-15')

    with freeze_time('2027-01-01'):
        january_invoice = _draft_invoice(customer, '2027-01-01', '2027-01-31')

    assert december_invoice.invoice_number.startswith('INV-2026-')
    assert january_invoice.invoice_number.startswith('INV-2027-')


def test_save_marks_invoice_overdue_when_due_date_has_passed():
    customer = ContactFactory()

    with freeze_time('2026-05-01'):
        invoice = _draft_invoice(customer, '2026-05-01', '2026-05-15')
        invoice.status = Invoice.Status.SENT
        invoice.save(update_fields=['status'])
        assert invoice.status == Invoice.Status.SENT  # sanity: not overdue yet

    with freeze_time('2026-06-01'):  # due date has now passed
        invoice.save(update_fields=['status'])

    assert invoice.status == Invoice.Status.OVERDUE


def test_save_does_not_mark_paid_invoice_overdue():
    """A PAID invoice past its due date should stay PAID -- only
    Draft/Sent/Partially Paid transition to Overdue."""
    customer = ContactFactory()

    with freeze_time('2026-05-01'):
        invoice = _draft_invoice(customer, '2026-05-01', '2026-05-15')
        invoice.status = Invoice.Status.PAID
        invoice.save(update_fields=['status'])

    with freeze_time('2026-06-01'):
        invoice.save(update_fields=['status'])

    assert invoice.status == Invoice.Status.PAID


def test_mark_overdue_invoices_bulk_updates_only_past_due_sent_invoices():
    """mark_overdue_invoices() is the catch-up job for invoices that went
    overdue without ever being saved again -- unlike save()'s own
    _set_overdue_status(), which only fires when that invoice is touched."""
    customer = ContactFactory()

    with freeze_time('2026-05-01'):
        overdue_candidate = _draft_invoice(customer, '2026-05-01', '2026-05-15')
        overdue_candidate.status = Invoice.Status.SENT
        overdue_candidate.save(update_fields=['status'])

        not_yet_due = _draft_invoice(customer, '2026-05-01', '2026-12-31')
        not_yet_due.status = Invoice.Status.SENT
        not_yet_due.save(update_fields=['status'])

    with freeze_time('2026-06-01'):  # overdue_candidate's due date has now passed; neither invoice was re-saved
        updated_count = Invoice.mark_overdue_invoices()

    overdue_candidate.refresh_from_db()
    not_yet_due.refresh_from_db()

    assert updated_count == 1
    assert overdue_candidate.status == Invoice.Status.OVERDUE
    assert not_yet_due.status == Invoice.Status.SENT
