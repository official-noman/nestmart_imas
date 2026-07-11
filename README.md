# Nestmart IMAS — Enterprise Invoice & Accounting System

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.0-092E20.svg?logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-(Ready_for_PostgreSQL)-003B57.svg?logo=sqlite&logoColor=white)
![Security](https://img.shields.io/badge/Security-JWT_%7C_2FA_%7C_RBAC-red.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## Overview

**Nestmart IMAS (Invoice Management & Accounting System)** is a full-stack, enterprise-grade financial platform designed for modern businesses. The core technical achievement of this platform is a **Strict Double-Entry Accounting Engine** that automatically generates balanced journal entries (Debits = Credits) from operational transactions like invoicing and payment allocations.

The architecture is fully decoupled. The backend exposes a secure RESTful API built on **Django & DRF**, ensuring data immutability and transactional integrity. The frontend is a blazing-fast, server-rendered **Next.js (App Router)** client featuring a 100% custom-built "Zinc Minimalist" design system with real-time financial calculators.

---

## Key Features

- 🧾 **Smart Invoicing & Live Calculators** — Nested line items with real-time reactive calculations (Subtotal, Tax, Discounts) and automatic sequential numbering (`INV-YYYY-XXXX`).
- ⚖️ **Immutable Double-Entry Ledger** — Automated, tamper-proof journal entries generated via Django signals; manual entries feature a real-time variance validation engine preventing unbalanced posts.
- 💸 **Dynamic Payment Split Allocations** — Distribute a single large payment across multiple outstanding invoices with real-time balance tracking and over-allocation prevention.
- 🔒 **Enterprise Security** — Role-Based Access Control (Admin, Accountant), JWT session management, TOTP 2FA, and robust API throttling.
- 📊 **Automated Financial Reporting** — Real-time Dashboard KPIs (Receivables, Revenue) and a print-optimized Profit & Loss (P&L) statement using accounting-standard double underlines.
- 📝 **Full Audit Trail** — Every CRUD operation across the database is tracked with user IDs, timestamps, and historical changes via `django-simple-history`.

---

## System Architecture

The system follows a modern decoupled architecture. The Next.js frontend handles UI, state (`Zustand`), and API calls (`Axios` interceptors). The Django backend acts as a strict validation gatekeeper, ensuring accounting rules are met before touching the relational database.

```mermaid
graph TD
    User([User / Accountant])
    NextJS[Next.js Frontend - App Router]
    Zustand[(Zustand State & Cookies)]
    DRF[Django REST Framework API]
    Auth[SimpleJWT & RBAC Layer]
    Ledger[Accounting Core & Services]
    Audit[Simple History Middleware]
    DB[(Database / SQLite)]

    User -->|Interacts| NextJS
    NextJS <-->|Manages Tokens| Zustand
    NextJS -->|HTTP Requests| DRF
    DRF -->|Validates| Auth
    Auth -->|Routes to| Ledger
    Ledger -->|Tracks Changes| Audit
    Ledger -->|Read/Write| DB
    Audit -->|Save History| DB
Tech Stack
Layer	Technology	Role
Frontend Core	Next.js 14 (App Router)	React framework for SSR and routing
Styling & UI	Tailwind CSS & Lucide Icons	100% Custom "Zinc Minimalist" UI components
State & Fetching	Zustand & Axios	Global state and API interceptors
Backend Core	Django 5.0	Core Python web framework
API Interface	Django REST Framework	Building robust RESTful endpoints
Authentication	SimpleJWT & PyOTP	Token-based auth and 2FA
Audit Logging	django-simple-history	Tracking historical database mutations
Database Design (Core Entities)
Model	Purpose
CustomUser & Role	Core Auth model enforcing Admin/Accountant/Manager privileges.
Contact & Item	Unified Customer/Vendor management (soft-delete enabled) and Inventory tracking.
Invoice & InvoiceLineItem	Header-Detail relationship holding financial billing data.
Payment & PaymentAllocation	Tracks bulk receipts and how they are split across invoices.
JournalEntry & JournalLine	The General Ledger. Immutable records enforcing Sum(Debit) == Sum(Credit).
TaxRate & CompanyProfile	Configurable system variables managed by Admins.
The Core Magic: Invoicing Request Flow
How IMAS handles complex nested invoicing with accounting compliance:
code
Text
User UI → Nested JSON Payload → Serializer → Calculations → DB Transaction → Auto-Journal
Trigger — User fills out the interactive Invoice form on the Next.js frontend (calculating totals in real-time via useMemo).
Payload Submission — Next.js sends a single nested JSON payload (Invoice Header + Array of Items) via POST.
DRF Orchestration — InvoiceSerializer initiates a DB transaction. It validates line items (tax/discounts).
Backend Calculation — The service layer recalculates totals strictly on the server to prevent client-side spoofing.
Ledger Signal — post_save signals detect the new invoice and automatically trigger a balanced Journal Entry (Debit: Accounts Receivable, Credit: Sales Income).
Audit & Return — django-simple-history silently logs the creator's IP and User ID. A 201 Created response is returned to the UI.
Local Development Setup
1. Backend Setup (Django)
code
Bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your SECRET_KEY and DEBUG=True in .env
python manage.py migrate
python manage.py setup_default_accounts  # Seeds the Chart of Accounts
python manage.py createsuperuser
python manage.py runserver
2. Frontend Setup (Next.js)
code
Bash
cd frontend
npm install
npm run dev
App is available at http://localhost:3000. Backend API is available at http://127.0.0.1:8000.
Challenges Solved
Zero-Amount Ledger Bug Prevention — Moved accounting journal generation from raw signals to a dedicated Service Layer to ensure Invoice totals are fully computed before the ledger is touched.
Double-Entry DB Integrity — Implemented strict serializers.ValidationError in the accounting core that rejects any manual journal entry where total Debits do not mathematically equal total Credits.
Financial Record Immutability — Overrode save() and delete() methods on posted JournalEntry models to completely lock the database rows, enforcing corrections via reversing entries only (Accounting standards).
Future Roadmap (Post-MVP)
PostgreSQL & Dockerization — Migrate from SQLite to PostgreSQL and containerize the stack for cloud deployment.
Celery & Redis Integration — Implement async background tasks for automated recurring invoices and email notifications.
PDF Generation Engine — Shift PDF rendering from frontend window.print() to robust backend rendering (e.g., WeasyPrint).
License
MIT — see LICENSE. Built for Nestmart IT.
