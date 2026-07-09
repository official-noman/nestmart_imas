# Nestmart IMAS - Invoice Management & Accounting System

## Project Setup & Status

### Completed Modules:
1. **Project Setup & Architecture (Django + Next.js)** ✅
   - Configured Django REST Framework backend with SQLite.
   - Initialized Next.js frontend with TypeScript and Tailwind CSS.
   - Connected both projects and enabled CORS.
   - Separated Dev/Prod environments using `.env` variables and `django-environ`.

2. **Auth & Authorization (JWT, RBAC & 2FA)** ✅
   - Configured Custom User Model supporting unique `email` for login.
   - Implemented Role-Based Access Control (RBAC) with roles: Admin, Accountant, Manager, Viewer (FR-2).
   - Integrated SimpleJWT for token-based authentication (FR-1 & FR-5).
   - Created password reset endpoints using Console Email Backend for secure token generation (FR-3).
   - Integrated `pyotp` for TOTP-based optional Multi-Factor Authentication (2FA) with 2-step verification endpoints (FR-4).

3. **Customer & Vendor Management (Contacts)** ✅
   - Created unified `Contact` model supporting both Customers and Vendors (FR-6).
   - Implemented soft-delete logic: Prevents deletion of contacts associated with posted transactions, falling back to deactivation (`is_active = False`) (FR-8).
   - Added custom dynamic decimal property `outstanding_balance` (FR-7).
   - Protected all contact endpoints with JWT Auth.

4. **Product & Service Catalog (Items)** ✅
   - Created `Item` model with SKU, pricing, tax rate (using Decimals) and stock tracking properties (FR-9).
   - Implemented validation preventing negative stock quantity when stock tracking is active (FR-10).
   - Exposed protected DRF ModelViewSet at `/api/v1/items/`.

5. **Invoicing & Calculations (Invoices)** ✅
   - Created `Invoice` (Header) and `InvoiceLineItem` (Detail) models supporting nested multiple line items (FR-11).
   - Implemented sequential invoice number generation: `INV-YYYY-XXXX` format (FR-12).
   - Implemented status options (FR-13) and automatic overdue detection based on due dates (FR-17).
   - Built automatic line-level and invoice-level calculation engines using Decimals for subtotal, discount totals, tax totals, and grand totals (FR-14).
   - Built writable nested serializers to allow creating and updating invoices with multiple items in a single HTTP request.

6. **Payments & Allocations (Payments)** ✅
   - Created `Payment`, `PaymentAllocation` (for splitting a single payment across multiple invoices), and `CreditNote` (for credits and refunds) models (FR-18, FR-20, FR-21).
   - Implemented real-time, signal-like status updates: Automatically transitions Invoice statuses to `Paid` or `Partially Paid` based on payments received (FR-19).
   - Added strict validation to ensure payment allocation amounts do not exceed the total payment amount.
   - Exposed protected DRF viewsets at `/api/v1/payments/` and `/api/v1/credit-notes/`.

---
*Last Updated: Today*
