# Nestmart IMAS - Invoice Management & Accounting System

## Project Setup & Status

### Completed Modules:
1. **Project Setup & Architecture (Django + Next.js)** ✅
2. **Auth & Authorization (JWT, RBAC & 2FA)** ✅
3. **Customer & Vendor Management (Contacts)** ✅
4. **Product & Service Catalog (Items)** ✅
5. **Invoicing & Calculations (Invoices)** ✅
6. **Payments & Allocations (Payments)** ✅

7. **Accounting Core (Double-Entry Ledger)** ✅
   - Implemented `Account` model for configurable Chart of Accounts (FR-22).
   - Implemented `JournalEntry` and `JournalLine` models tracking immutable financial records (FR-24, FR-25).
   - Enforced hard immutability rules: updating or deleting posted entries throws strict validation errors (FR-27).
   - Enforced double-entry constraints (Debits = Credits) during serializer validation (FR-26).
   - Created Django signals to automatically generate balanced journal entries upon Invoice creation and Payment allocation (FR-23).
   - Created a management command to seed default COA accounts (1000 Cash, 1200 AR, 4000 Sales).

---
*Last Updated: Today*
