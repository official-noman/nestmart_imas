---
name: django-tests
description: Write or extend backend tests for this project (nestmart_imas). Use when adding tests for a model, service function, or API view under backend/<app>/tests/. Covers this project's pytest + factory_boy conventions -- shared factories/fixtures in root conftest.py, per-app tests/ packages split into test_models.py/test_services.py/test_views.py, and the auth/permission test helpers every view test should reuse.
---

# Backend test conventions (nestmart_imas)

Reference implementation: `backend/apps/invoices/tests/`, root `conftest.py`, root `test_helpers.py`.

## Test runner

Always `pytest` from the repo root (not `manage.py test`) -- config is in root `pytest.ini`/`pyproject.toml`:

```bash
pytest                              # full suite
pytest backend/apps/invoices             # one app
pytest backend/apps/invoices -k create_invoice   # one test
```

## Structure: per-app `tests/` package

Each app has `backend/<app>/tests/` (a package, not a single `tests.py`), split by what's under test:

```
backend/apps/invoices/tests/
  __init__.py
  _helpers.py       # app-local test helpers (e.g. building a line-item dict)
  test_models.py     # Invoice.calculate_totals(), status transitions, __str__
  test_services.py   # create_invoice(): totals, journal entries, edge cases
  test_views.py       # InvoiceViewSet: auth, permissions, CRUD via APIClient
```

New apps/features follow the same split. Don't put everything in one `test_*.py`.

## Fixtures and factories: root `conftest.py`

Model factories (`UserFactory`, `ContactFactory`, `ItemFactory`, `PaymentFactory`, `AccountFactory`, `TaxRateFactory`) and shared fixtures live in the **root** `conftest.py`, not duplicated per app -- pytest auto-discovers it. Use `factory_boy`, never fixture JSON files:

```python
from conftest import ContactFactory, ItemFactory

def test_create_invoice_sums_multiple_lines(chart_of_accounts):
    customer = ContactFactory()
    item = ItemFactory()
    invoice = create_invoice(customer=customer, issue_date='2026-07-01',
                              due_date='2026-07-15', lines=[...])
```

Key fixtures already available -- check before writing a new one:
- `api_client` -- plain `APIClient()`
- `make_authenticated_client(role=..., **kwargs)` -- returns `(client, user)`, authenticated via `force_authenticate` (not the JWT login flow -- that's tested separately in `users/tests`)
- `chart_of_accounts` -- seeds the exact account codes (`1200` AR, `4000` Sales, `1000` Cash) that `invoices`/`payments` services look up when posting journal entries. Any test that exercises invoice/payment creation and expects a journal entry needs this fixture; a test that deliberately checks the *no chart of accounts* fallback path uses plain `db` instead (see `test_create_invoice_without_chart_of_accounts_does_not_crash`).
- Cross-app builder helpers `build_invoice(...)` / `build_paid_invoice(...)` -- use these instead of re-deriving "a sent/paid invoice" by hand; they exist specifically because three different apps' tests used to hand-roll the same thing.

Mark DB-touching test modules with `pytestmark = pytest.mark.django_db` at the top rather than decorating every test function.

## View tests: reuse the auth/permission helpers

Root `test_helpers.py` has two helpers every `test_views.py` should use instead of re-writing the same assertions:

```python
from test_helpers import assert_requires_authentication, assert_forbidden_for_role

def test_list_requires_authentication(api_client):
    assert_requires_authentication(api_client, '/api/v1/invoices/')

def test_list_forbidden_for_viewer(make_authenticated_client):
    assert_forbidden_for_role(make_authenticated_client, CustomUser.Role.VIEWER, '/api/v1/invoices/')
```

Every new endpoint's `test_views.py` should have at minimum: anonymous → 401, wrong role → 403, correct role → 200/201 happy path.

## Service tests: pin down money math and ordering

Service tests are where Decimal arithmetic and write-ordering invariants get verified explicitly -- see `test_create_invoice_posts_journal_entry_with_correct_amount`, which is a direct regression test for the 0.00-journal-entry bug described in [[django-service]]. When adding a new service function that computes money or posts to the ledger, write an equivalent regression-style test, not just a happy-path one, and comment *why* if it's guarding a specific past bug.

## New factory checklist

If a new model needs a factory, add it to root `conftest.py` (not a per-app `factories.py`) following the existing style: `DjangoModelFactory`, `factory.Sequence` for unique fields, `factory.Faker` for realistic-but-arbitrary data, `factory.SubFactory` for required FKs.
