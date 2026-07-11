# Backend Code Review — nestmart_imas

Reviewer: Arif (via Claude Code) · Branch: `review/backend-intern-review` · Date: 2026-07-11
Scope: `backend/` only. Severity: 🔴 blocker · 🟠 major · 🟡 minor

---

## 1. Correctness bugs (fix first)

- 🔴 **Journal entries posted with amount 0.00.** `invoices/signals.py` fires on `post_save(created=True)`, but `InvoiceSerializer.create()` creates the invoice *before* lines exist and before `calculate_totals()` runs — so `grand_total` is `0.00` at signal time. Every auto-journal for an invoice debits/credits AR and Sales with **zero**. The ledger, receivables KPI, and P&L are all wrong from day one. Move journal creation into an explicit service called after totals are computed (see §5).
- 🔴 **Privilege escalation on register.** `UserRegistrationSerializer` exposes `role` as writable with `AllowAny` — anyone can self-register as `Admin`. Remove `role` from registration; only admins set roles.
- 🔴 **`role` is never enforced.** RBAC exists in the model only; every viewset is plain `IsAuthenticated`. A `Viewer` can create/delete invoices, payments, journal entries. Need permission classes per role.
- 🟠 **Invoice number race.** `_generate_invoice_number` takes `select_for_update` inside its own `atomic()` block, but the lock is released when the block exits — before the invoice row is inserted. Two concurrent creates → duplicate number → 500 from the unique constraint (and `select_for_update` is a no-op on SQLite anyway). Wrap generation + insert in one transaction, or use a DB sequence.
- 🟠 **`Invoice.status` writable via API.** Not in `read_only_fields`, so a client can PATCH an invoice straight to `Paid` with no payment. Status should be derived only.
- 🟠 **`PaymentAllocation.update_invoice_status` resets to `Sent`** when total paid is 0 — clobbers `Draft`/`Cancelled`/`Overdue`. Also never checks allocation against invoice *remaining* balance, only against payment amount — one invoice can be over-allocated to `Paid` across multiple payments.
- 🟠 **`PaymentSerializer` has writable nested `allocations` but no `update()`** — PUT/PATCH on a payment raises. Either implement update or restrict the viewset to create/list/retrieve.
- 🟠 **Signals silently swallow missing accounts.** Both signals `return` if accounts `1000/1200/4000` don't exist — invoices/payments then have no ledger entries, no error, no log. Accounts are magic strings with no data migration seeding them. Seed via migration; fail loudly.
- 🟠 **Immutability is bypassable.** `JournalEntry.save()/delete()` raise, but `queryset.update()`/`bulk` and admin actions bypass model methods. Also raising `ValidationError` from `save()` in a view returns **500**, not 400. Same issue: `mark_overdue_invoices` uses `.update()` which skips `simple_history` and signals.
- 🟡 **Write-on-read:** `InvoiceViewSet.get_queryset()` calls `mark_overdue_invoices()` on every GET. Move to management command / cron (Celery beat).
- 🟡 **Dead stubs that lie:** `Contact.outstanding_balance` hardcoded `0.00`; `Contact.delete` has `has_transactions = False` hardcoded so soft-delete never triggers. README claims both work ("Dynamic Outstanding Balances ✅", "Soft Delete ✅"). Also claims "Negative Stock Prevention" — no such code; `track_stock`/`stock_quantity` never touched by invoicing.
- 🟡 `InvoiceLineItem.quantity = IntegerField` — negatives allowed, fractional quantities impossible. Use `DecimalField` + `MinValueValidator`/CheckConstraint.

## 2. Security

- 🔴 **No throttling anywhere.** `login/`, `password-reset/`, `login/verify-2fa/` are brute-forceable — a 6-digit TOTP with unlimited attempts is not 2FA. Add DRF throttles (strict scoped rates on auth endpoints).
- 🟠 **No `DEFAULT_PERMISSION_CLASSES`.** DRF default is `AllowAny`; one forgotten `permission_classes` = public endpoint. Set `IsAuthenticated` globally, opt out explicitly.
- 🟠 **`CORS_ALLOW_ALL_ORIGINS = True`** hardcoded — must be env-driven allowlist in prod.
- 🟠 **User enumeration:** password reset and login/2FA responses reveal whether an email/user_id exists. Return uniform responses.
- 🟠 **2FA enable is a GET that mutates state** (`TwoFAEnableView.get` rotates `totp_secret`, disables existing 2FA). Make it POST; a stray prefetch shouldn't reset someone's 2FA. `totp_secret` stored plaintext — encrypt at rest if threat model warrants.
- 🟡 No JWT rotation/blacklist (`ROTATE_REFRESH_TOKENS`, `token_blacklist` app) — no way to revoke a 7-day refresh token; no logout endpoint.
- 🟡 No prod hardening block: `SECURE_HSTS_*`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`.

## 3. Dev/prod environment setup

- 🔴 **No dependency manifest at all** — no `requirements.txt`/`pyproject.toml`/lockfile. Project is unreproducible. Recommend `uv` or pip-tools with pinned versions.
- 🟠 **Single `settings.py`, no split.** Use `core/settings/{base,dev,prod}.py` (or env-only 12-factor). `ALLOWED_HOSTS = []` hardcoded — prod won't boot. No `STATIC_ROOT`, no `LOGGING` config, SQLite hardcoded (use `env.db()` / `DATABASE_URL` → Postgres in prod).
- 🟠 `.env.example` lists 3 vars and misses the ones the code needs (`ALLOWED_HOSTS`, `DATABASE_URL`, CORS origins, email host/creds). It also sets `EMAIL_BACKEND=smtp` with no SMTP vars.
- 🟠 No Dockerfile / docker-compose, no CI (`.github/workflows`), no Makefile. Nothing runs checks on push.
- 🟡 `parse_pdf.py` stray script at repo root — move or delete.

## 4. Code quality tooling — absent

Nothing configured: no ruff/black/isort, no mypy/django-stubs, no pre-commit, no coverage. Minimum bar:
`ruff` (lint+format) + `pre-commit` + `mypy --strict`-ish with `django-stubs` + CI running `ruff check`, `python manage.py check --deploy`, `makemigrations --check`, and tests.

## 5. Architecture / service separation

Business logic is smeared across four layers: model `save()` side effects (invoice numbering, overdue mutation, line-total math), signals (journal posting), serializers (orchestration, balance validation), and views (`mark_overdue_invoices` on GET). Signals + nested-serializer ordering is exactly what caused the 🔴 zero-amount ledger bug.

Recommend a thin **service layer** (`invoices/services.py`, `payments/services.py`) as the single write path: `create_invoice(...)` builds lines, computes totals, posts the journal entry — one atomic transaction, no signals. `accounting.create_journal_entry` is already the right shape; extend the pattern. Keep models as data + constraints, serializers as validation/IO only. Also: `CreditNote` is a dead model — affects nothing (no ledger, no invoice balance).

## 6. API design / versioning

- `/api/v1/` exists in URLs but auth lives at unversioned `/api/auth/`; inconsistent. Configure DRF `URLPathVersioning` (or at least `NamespaceVersioning`) so views can branch on version, and version auth too.
- Hand-written `api_root` JSON will drift. Replace with **drf-spectacular** → `/api/schema/`, Swagger UI. No API docs exist today.
- **No pagination** (`DEFAULT_PAGINATION_CLASS` unset) — every list endpoint returns the whole table. No filtering/ordering/search (`django-filter`) — frontend can't query by status/date/customer without client-side filtering.
- Model `ValidationError` surfaces as 500 through DRF — add a custom exception handler mapping Django `ValidationError` → 400.

## 7. Database: indexing, constraints, queries

**Indexes** (none declared beyond FK/unique defaults):
- `Invoice`: `status`, `due_date`, composite `(status, due_date)` — used by overdue sweep and dashboards.
- `Payment.payment_date`, `JournalEntry.date`, `JournalLine (account, entry_type)` — every report aggregates on these.
- `Contact (contact_type, is_active)`.

**Constraints** (none declared): `CheckConstraint`s for `amount > 0` (Payment, PaymentAllocation, CreditNote, JournalLine), `quantity > 0`, `discount >= 0`, `unit_price >= 0`, `due_date >= issue_date`, `credit_terms >= 0`. `CompanyProfile` needs a singleton guard. Money invariants belong in the DB, not just serializers — `.update()`, admin, and shell all bypass serializer validation.

**Query optimization:**
- `reports/views.py` runs 4 separate aggregate queries for P&L and 2 for receivables — collapse each into one query with conditional aggregation: `Sum('amount', filter=Q(entry_type='CREDIT')) - Sum(..., filter=Q(entry_type='DEBIT'))`.
- `DashboardKPIView` overdue loop iterates invoices in Python; do `aggregate(Sum(F('grand_total') - F('total_paid')))` in the DB. Note its `annotate(Sum(...))` + iteration pattern also multiplies rows if joins are added later.
- `JournalEntryViewSet` prefetches `lines` but not `lines__account`/`lines__contact` — serializer emits PKs today so it's latent, but will N+1 the moment nested output is added.
- Leftover LLM chatter committed in `reports/views.py` ("But wait, … The prompt says …") — delete.

## 8. Testing — the biggest gap

All 8 `tests.py` files are empty stubs. **Zero tests in an accounting system.** Money math, double-entry balance, invoice numbering, status transitions, payment allocation — all unverified. Minimum plan:

1. `pytest` + `pytest-django` + `factory_boy`; `conftest.py` with user/account fixtures; `pytest.ini`/`pyproject` config.
2. Priority order: journal balance invariant (would have caught the 🔴 zero-amount bug) → payment allocation/status transitions → invoice totals incl. tax/discount rounding → auth (register role lockdown, 2FA, throttles) → number-generation concurrency.
3. Coverage gate in CI (start ~80% on `models/serializers/services`).

## 9. Claude Code setup — missing entirely

No `.claude/` directory and no `CLAUDE.md` at repo root or in `backend/` — no skills, hooks, agents, or rules. `/home/arif/CLAUDE.md` references `graphify-out/` which doesn't exist in this repo. Recommend:

- `CLAUDE.md` (root): stack, how to run (`manage.py runserver`, test command), conventions (service layer for writes, no signals for business logic), account-code registry.
- `.claude/settings.json`: permission allowlist for `python manage.py test|check`, `ruff`, `pytest`.
- Hooks: post-edit `ruff check --fix` on `*.py`; block edits to `*/migrations/0*.py`.
- Optional agents/skills: reviewer agent pinned to this checklist; skill for "add endpoint" scaffolding (model → service → serializer → viewset → tests).

---

## Verdict

Solid MVP skeleton for an intern — models are sensible, Decimal used for money, nested serializers work, immutability was attempted. But it is **not production-viable**: the ledger records zeros (🔴), registration hands out admin (🔴), there are no tests, no dependency manifest, and no environment story. Fix order: §1 blockers → §8 tests around them → §3/§4 tooling → §7 constraints/indexes → §5 refactor to services.
