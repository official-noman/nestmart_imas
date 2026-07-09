# Nestmart IMAS - Invoice Management & Accounting System

## Project Setup & Status

### Completed Modules:
1. **Project Setup & Architecture (Django + Next.js)** ✅
   - Configured Django REST Framework backend with SQLite.
   - Initialized Next.js frontend with TypeScript and Tailwind CSS.
   - Connected both projects and enabled CORS.

2. **Auth & Authorization (JWT, RBAC & 2FA)** ✅
   - Configured Custom User Model supporting unique `email` for login.
   - Implemented Role-Based Access Control (RBAC) with roles: Admin, Accountant, Manager, Viewer (FR-2).
   - Integrated SimpleJWT for token-based authentication (FR-1 & FR-5).
   - Created password reset endpoints using Console Email Backend for secure token generation (FR-3).
   - Integrated `pyotp` for TOTP-based optional Multi-Factor Authentication (2FA) with 2-step verification endpoints (FR-4).

---
*Last Updated: Today*
