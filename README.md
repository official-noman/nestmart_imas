# Nestmart IMAS - Invoice Management & Accounting System

## Project Status: Full-Stack MVP In Progress 🚀

### Completed Modules (Backend API):
1. *Project Setup & Architecture:* Django + DRF, SQLite (ready for PostgreSQL), django-environ for security. ✅
2. *Auth & Authorization:* JWT, Roles (Admin/Accountant), 2FA, Console Password Reset. ✅
3. *Customer & Vendor Management:* CRUD, Soft Delete, Dynamic Outstanding Balances. ✅
4. *Product & Service Catalog:* CRUD, Negative Stock Prevention. ✅
5. *Invoicing:* Nested Serializers, Auto Tax/Discount/Total Calculations, Sequential Numbering, Auto Overdue. ✅
6. *Payments & Allocations:* Multi-invoice payment splitting, Auto Invoice Status Updates (Paid/Partially Paid). ✅
7. *Accounting Core:* Double-Entry Ledger, Immutable Journal Entries, Debit=Credit strict validation, Auto-Journals via Signals. ✅
8. *Tax & Settings:* Configurable Tax Rates and Company Profiles (Admin only). ✅
9. *Audit & Logs:* django-simple-history integrated for full database change tracking. ✅
10. *Dashboard & Reporting:* Automated KPIs (Revenue, Receivables) and P&L generation APIs. ✅

### Completed Modules (Frontend UI - 100% Custom Designed from Scratch):
1. *Frontend Architecture & Security:* Set up Next.js App Router, Axios API client with automatic JWT token injection, and Zustand for state management. ✅
2. *Dashboard UI:* Premium custom KPI metric cards fetching real-time database calculations (Receivables, Revenue, Overdue). ✅
3. *Sidebar Navigation Layout:* Vercel-style deep dark minimalist sidebar with responsive layout. ✅
4. *Auth Expansion UI:* Custom built Register, Forgot Password, and Reset Password views (Zinc Minimalist Theme). ✅
5. *Customer & Vendor Management UI:* Custom designed tables with badge statuses and modern backdrop-blurred modals for adding customers. ✅
6. *Product Catalog UI:* Customized items table displaying stock levels with low-stock warnings and modal forms for item creation. ✅
7. *System Settings UI:* Built two-column layout containing the Company Profile editor form and the Tax Configuration grid with tax creation modals. ✅
8. *Invoicing UI (Live Calculator):* Custom designed Invoice List table with KPI status strips, and a fully reactive Invoice Creator form featuring real-time nested calculation arrays (Subtotal, Tax, Discounts, Grand Total) on keystrokes. ✅
9. *Payments & Allocations UI:* Custom designed receipts list, and a smart split-payment allocation wizard with real-time balance tracking, dynamic customer-invoice filtering, and over-allocation prevention. ✅

---
Last Updated: Today
