---
name: django-service
description: Write or modify a service-layer function in backend/<app>/services.py for this project (nestmart_imas). Use whenever a change needs business-logic writes -- creating journal entries, posting invoices, allocating payments, anything that touches more than one model or app. This is the project's hard rule (documented in root CLAUDE.md after a real production bug) that such writes must be plain service functions called from serializers, never Django post_save/pre_save signals.
---

# Service layer conventions (nestmart_imas)

Reference implementation: `backend/apps/invoices/services.py` (`create_invoice`), `backend/apps/payments/services.py` (`create_payment_allocation`), `backend/apps/accounting/services.py` (`post_double_entry`).

## The rule, and why

Business-logic writes belong in plain functions in `<app>/services.py`, wrapped in `transaction.atomic()`, called explicitly from the serializer's `create`/`update`. They must **never** be triggered by `post_save`/`pre_save` signals.

This project used to do it via signals (`invoices/signals.py`, `payments/signals.py`, wired up in `apps.py::ready()`). It caused a real bug: the invoice's journal entry was posted from a `post_save` fired at `Invoice.objects.create()` -- before line items existed and before `calculate_totals()` had run -- so the ledger always recorded a `0.00` entry instead of the real total. Both signal files are gone. A `.claude/hooks` PreToolUse hook now blocks reintroducing `post_save.connect`/`@receiver(post_save...)` in `invoices/` or `payments/` -- don't try to work around it, fix the underlying design instead if you hit it.

## Shape of a service function

Keyword-only arguments, one `transaction.atomic()` block, order operations so nothing derived (totals, generated numbers) is used before it's computed:

```python
def create_invoice(*, customer, issue_date, due_date, lines, status=Invoice.Status.DRAFT):
    with transaction.atomic():
        invoice = Invoice.objects.create(
            customer=customer, status=status, issue_date=issue_date, due_date=due_date,
        )
        for line_data in lines:
            InvoiceLineItem.objects.create(invoice=invoice, **line_data)

        invoice.calculate_totals()  # must run before anything reads totals

        if invoice.grand_total > Decimal('0.00'):
            _create_invoice_journal_entry(invoice)  # posts only after totals are real

        return invoice
```

Key ordering lesson baked into that example: create the row → create its children → compute derived totals → *then* do anything that depends on those totals (like posting to the ledger). Getting this order backwards is exactly the bug that killed the signals approach.

## Calling a service from a serializer

The serializer orchestrates, the service does the work:

```python
class InvoiceSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        return create_invoice(lines=lines_data, **validated_data)
```

See [[drf-api]] for the full serializer/view pattern.

## Cross-app calls

Services may call into another app's services (e.g. `apps/invoices/services.py` calls `apps.accounting.services.post_double_entry`), respecting the one-directional dependency graph in root `CLAUDE.md` (`invoices` depends on `accounting`, not vice versa). Keep the account-code constants (e.g. `AR_ACCOUNT_CODE = '1200'`) as module-level constants in the calling app's `services.py`, not hardcoded inline.

## Guard against missing setup data

If a service posts to accounts that might not exist yet in a given environment (e.g. `chart_of_accounts` not seeded), guard so the core operation (creating the invoice) still succeeds even if the ledger-posting side fails to find accounts -- see `test_create_invoice_without_chart_of_accounts_does_not_crash` in [[django-tests]] for the expected behavior.

## After writing a service function

Test it directly (not just through the view) -- see `invoices/tests/test_services.py` and [[django-tests]]. Service-level tests are where the money-math and ordering invariants (like the journal-entry-reflects-real-total regression) get pinned down.
