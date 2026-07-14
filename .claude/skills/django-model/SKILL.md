---
name: django-model
description: Create or modify a Django model in this project (nestmart_imas backend). Use when adding a new model, a new field, or a new domain module under backend/<app>/models(.py|/). Encodes this project's conventions -- TimeStampedModel base, HistoricalRecords audit trail, Decimal money fields, sequential-number generation, and where business-logic methods belong on the model vs. in services.py.
---

# Django model conventions (nestmart_imas)

Reference implementation: `backend/apps/invoices/models/invoice.py`.

## Base classes

Every model that needs `created_at`/`updated_at` inherits `apps.common.models.TimeStampedModel` (or `CreatedAtModel` if it only needs `created_at`) instead of redeclaring those fields:

```python
from apps.common.models import TimeStampedModel

class Invoice(TimeStampedModel):
    ...
```

## Audit trail

Any model whose changes need to be tracked (money, status, anything an accountant might dispute) gets `django-simple-history`:

```python
from simple_history.models import HistoricalRecords

class Invoice(TimeStampedModel):
    ...
    history = HistoricalRecords()
```

Not every model needs this -- skip it for pure lookup/reference tables unless asked.

## Money fields

Always `DecimalField`, never `FloatField`:

```python
subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
```

Quantize with the shared `TWOPLACES` constant (see `invoices/models/_constants.py`) when doing arithmetic, e.g. `total.quantize(TWOPLACES)`.

## Choices

Use `models.TextChoices` inner classes, not bare string constants or an `IntegerField` with a comment:

```python
class Status(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SENT = 'Sent', 'Sent'
```

## Cross-app foreign keys

Respect the one-directional dependency graph from the root `CLAUDE.md`: `invoices` may depend on `accounting` and `contacts`, not the reverse. Before adding a `ForeignKey` to another app's model, check that direction is allowed. Use `on_delete=models.PROTECT` for financial records that must never silently cascade-delete (e.g. a Contact with invoices).

## Sequential/generated identifiers

If a model needs a human-readable sequential number (invoice numbers, PO numbers, etc.), don't compute it from `Model.objects.count()` or `.last().id` -- that races under concurrent requests. Follow the `InvoiceNumberSequence` pattern: a dedicated counter row locked with `select_for_update()` inside `transaction.atomic()`, incremented and saved before use. See `Invoice._generate_invoice_number` in `invoices/models/invoice.py`.

## Where logic belongs: model vs. service

- **On the model**: self-contained computations over the instance's own data with no cross-app side effects -- `calculate_totals()` (sums line items into totals and saves), status-transition helpers like `mark_overdue_invoices()`, `__str__`.
- **In `services.py`, not the model**: anything that touches another app (posting a journal entry, allocating a payment) or that must happen in a specific order relative to other writes. See [[django-service]] -- and critically, **never wire it up via `post_save`/`pre_save` signals**. This project had a real bug where a signal fired before `calculate_totals()` had run, posting 0.00 journal entries.

## Multi-file model packages

When an app's models grow past one cohesive model, split into `backend/<app>/models/` (a package) instead of one giant `models.py` -- see `invoices/models/{invoice.py,line_item.py,sequence.py,_constants.py}` with `__init__.py` re-exporting the public names. Only do this once a single `models.py` actually gets unwieldy; don't pre-split a one-model app.

## After adding/changing a model

Run migrations and the checks the project actually uses:

```bash
cd backend && ./venv/bin/python manage.py makemigrations <app>
cd backend && ./venv/bin/python manage.py check
```

Then write model tests -- see [[django-tests]].
