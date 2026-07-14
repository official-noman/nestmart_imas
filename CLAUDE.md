# Nestmart IMAS

Invoice Management & Accounting System. Monorepo: Django REST API (`backend/`) + Next.js App Router frontend (`frontend/`).

## Tech stack

- **Backend:** Django 6, Django REST Framework, SQLite (dev) / PostgreSQL (prod)
- **Auth:** `djangorestframework-simplejwt` (JWT), `pyotp` (2FA)
- **Config:** `django-environ` — all secrets/hosts/CORS come from `.env`, never hardcoded
- **Audit:** `django-simple-history` on models that need change tracking
- **Frontend:** Next.js (App Router), Zustand for state, Axios for API calls — see `frontend/CLAUDE.md` / `frontend/AGENTS.md` for frontend-specific conventions

## Settings

Split into `backend/config/settings/{base,dev,prod}.py`:
- `base.py` — shared config
- `dev.py` — local SQLite, permissive localhost defaults
- `prod.py` — Postgres, requires `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` set explicitly via env (raises on boot if missing, no wildcard fallback)

`manage.py` defaults to `config.settings.dev`; `wsgi.py`/`asgi.py` default to `config.settings.prod`. Override with the `DJANGO_SETTINGS_MODULE` env var when needed.

Shared, non-app code (e.g. `TimeStampedModel`/`CreatedAtModel`, the DRF exception handler, shared DRF permission classes) lives in `backend/apps/common/`, not under `config/`.

## Test commands

Run from the repo root (config lives in root `pytest.ini` / `pyproject.toml`):

```bash
pytest                  # run the full backend test suite
pytest backend/invoices # run a single app's tests
ruff check .            # lint
```

`manage.py test` also works but `pytest` (via `pytest-django`) is the standard for this project. Use `factory_boy` for test fixtures instead of fixture JSON files.

## Coding conventions

- **Service layer for writes.** Business-logic writes (creating journal entries, posting invoices, allocating payments, etc.) belong in plain functions/services — `accounting/models.py::create_journal_entry`, `invoices/services.py::create_invoice`, `payments/services.py::create_payment_allocation` — called explicitly from serializers, wrapped in `transaction.atomic()`. Serializers should orchestrate, not contain the business logic themselves.
- **No signals for business logic.** Don't use `post_save`/`pre_save` signals to trigger side effects like journal entry creation. `invoices` and `payments` used to do this (`signals.py`, wired up in `apps.py::ready()`) and it caused a real bug: the invoice's journal entry was posted from the `post_save` fired at `Invoice.objects.create()`, before line items existed and `calculate_totals()` had run — so the ledger always recorded a `0.00` entry instead of the real total. Both signal files are gone; call the service function directly from the serializer instead, after totals are known.
- **Django apps are domain modules**: `users`, `contacts`, `items`, `invoices`, `payments`, `accounting`, `core_settings`, `reports`. Keep cross-app imports one-directional where possible (e.g. `invoices` depends on `accounting`, not vice versa).
- Env-driven config only — no hardcoded hosts, origins, or secrets in settings files.
