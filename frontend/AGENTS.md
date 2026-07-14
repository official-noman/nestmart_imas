<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend conventions (Nestmart IMAS)

Next.js App Router frontend for the Invoice Management & Accounting System. See root `CLAUDE.md` for the backend/API side.

## Feature folder structure

Each dashboard route under `app/dashboard/<feature>/` is self-contained:

```
app/dashboard/<feature>/
  page.tsx              # route entry, thin — wires the hook to the components
  _types.ts             # TS interfaces for this feature's API shapes
  _components/          # presentational components, feature-scoped
  _lib/
    use<Feature>.ts      # data-fetching + state hook (the "controller")
    helpers.ts           # pure formatting/calculation helpers
```

The `_`-prefixed folders opt out of Next.js routing. Nested routes (e.g. `invoices/new/`, `accounting/journals/new/`) repeat the same structure one level deeper with their own `_components`/`_lib`/`_types.ts`.

Keep this pattern for new features rather than introducing a different shape (no global `components/` or `hooks/` dump) — it keeps each feature independently readable and deletable.

## Data fetching

- All API calls go through the shared `api` axios instance in `lib/api.ts` — don't call `axios` or `fetch` directly. It injects the JWT bearer token from cookies and redirects to `/login` on a 401.
- Fetch logic lives in a `_lib/use<Feature>.ts` hook (plain `useState`/`useEffect`/`useCallback`, no data-fetching library) that returns state + loading/error flags + actions. `page.tsx` and `_components/*` stay presentational and consume the hook's return value — don't `useEffect`-fetch directly inside a component.
- Use `getApiErrorData(err)` from `lib/api.ts` to read a DRF error payload out of a caught axios error instead of `catch (err: any)`.
- Guard routes with `useAuthStore(s => s.isAuthenticated)` + `router.push('/login')` in the feature hook's effect, matching the pattern in `useCustomerList.ts`.

## State

- `zustand` is for cross-page/global state only (currently just auth in `lib/store.ts`). Feature-local state (list data, filters, form fields, loading/error) stays in the feature's `_lib` hook via `useState` — don't promote it to a Zustand store.
- Auth tokens/user live in cookies (`js-cookie`), mirrored into the `useAuthStore` state; `login()`/`logout()` are the only mutators.

## Types

- Each feature declares its own `_types.ts` matching the DRF response shape it consumes (see `app/dashboard/customers/_types.ts`). Don't share a global `types.ts` across features — API shapes drift per resource, and coupling them makes an unrelated feature's type edit ripple elsewhere.

## Commands

```bash
npm run dev        # local dev server
npm run build       # production build
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
```

Run `lint` and `typecheck` before considering frontend work done — there's no pre-commit hook enforcing it yet.
