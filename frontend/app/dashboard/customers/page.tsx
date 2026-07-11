'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  Plus, X, Search, Users, AlertCircle, ChevronRight,
  Mail, Phone, CreditCard, Loader2, RefreshCw, MapPin,
  CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  outstanding_balance: string | number;
  billing_address: string;
}

const INITIAL_FORM = { name: '', email: '', phone: '', tax_id: '', billing_address: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (v: string | number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(String(v ?? 0)) || 0,
  );

const AVATAR_PALETTE = [
  'bg-violet-100 text-violet-600',
  'bg-sky-100    text-sky-600',
  'bg-teal-100   text-teal-600',
  'bg-amber-100  text-amber-600',
  'bg-rose-100   text-rose-600',
  'bg-indigo-100 text-indigo-600',
];
const avatarFor = (name: string, id: number) => ({
  initials: name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
  palette: AVATAR_PALETTE[id % AVATAR_PALETTE.length],
});

const parseApiError = (err: any): string => {
  const d = err?.response?.data;
  if (!d) return 'Something went wrong. Please try again.';
  if (typeof d === 'string') return d;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' · ');
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const inputBase =
  'block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 shadow-sm transition-all ' +
  'hover:border-zinc-400 ' +
  'focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10';

// ─── Sub-components ───────────────────────────────────────────────────────────
function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
      {children}
      {req && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-32 rounded-full bg-slate-100" />
            <div className="h-2.5 w-44 rounded-full bg-slate-50" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4"><div className="h-3 w-40 rounded-full bg-slate-100" /></td>
      <td className="py-4 px-4"><div className="h-3 w-28 rounded-full bg-slate-100" /></td>
      <td className="py-4 px-4"><div className="h-5 w-20 rounded-full bg-slate-100" /></td>
      <td className="py-4 pl-4 pr-6 text-right"><div className="h-3.5 w-16 rounded-full bg-slate-100 ml-auto" /></td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered]   = useState<Customer[]>([]);
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isOpen, setIsOpen]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [form, setForm]           = useState(INITIAL_FORM);

  const isAuth = useAuthStore(s => s.isAuthenticated);
  const router = useRouter();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/api/v1/contacts/');
      const data: Customer[] = res.data.results ?? res.data;
      setCustomers(data);
      setFiltered(data);
    } catch {
      setFetchError('Unable to load customers. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) { router.push('/login'); return; }
    load();
  }, [isAuth, router, load]);

  // ── Client-side search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setFiltered(customers); return; }
    const q = query.toLowerCase();
    setFiltered(
      customers.filter(c =>
        c.name.toLowerCase().includes(q)      ||
        c.email?.toLowerCase().includes(q)    ||
        c.phone?.toLowerCase().includes(q)    ||
        c.tax_id?.toLowerCase().includes(q),
      ),
    );
  }, [query, customers]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal  = () => { setForm(INITIAL_FORM); setFormError(null); setSuccess(false); setIsOpen(true); };
  const closeModal = () => { if (!saving) setIsOpen(false); };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/api/v1/contacts/', { ...form, contact_type: 'Customer' });
      setSuccess(true);
      setTimeout(() => { setIsOpen(false); load(); }, 1000);
    } catch (err: any) {
      setFormError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalBalance = customers.reduce(
    (s, c) => s + (parseFloat(String(c.outstanding_balance ?? 0)) || 0),
    0,
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-slate-600">Customers</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage your client contacts and outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={load}
            title="Refresh list"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: 'Total Customers',
            value: loading ? '—' : customers.length,
            icon: Users,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-600',
          },
          {
            label: 'Total Outstanding',
            value: loading ? '—' : fmtUSD(totalBalance),
            icon: CreditCard,
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-500',
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FETCH ERROR ────────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <p className="flex-1 text-sm text-rose-700">{fetchError}</p>
          <button onClick={load} className="text-xs font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* ── DATA TABLE CARD ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative max-w-sm w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>
          {!loading && (
            <p className="text-xs text-slate-400 shrink-0">
              {filtered.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {[
                  { label: 'Customer',     align: 'text-left',  cls: 'pl-6 pr-4' },
                  { label: 'Email',        align: 'text-left',  cls: 'px-4' },
                  { label: 'Phone',        align: 'text-left',  cls: 'px-4' },
                  { label: 'Tax ID',       align: 'text-left',  cls: 'px-4' },
                  { label: 'Outstanding',  align: 'text-right', cls: 'pl-4 pr-6' },
                ].map(({ label, align, cls }) => (
                  <th
                    key={label}
                    scope="col"
                    className={`py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 ${align} ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Users className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        {query ? 'No customers match your search.' : 'No customers yet.'}
                      </p>
                      {!query && (
                        <button
                          onClick={openModal}
                          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                        >
                          <Plus className="h-4 w-4" /> Add your first customer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const { initials, palette } = avatarFor(c.name, c.id);
                  const bal = parseFloat(String(c.outstanding_balance ?? 0)) || 0;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${palette}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                            {c.billing_address && (
                              <p className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 truncate max-w-[220px]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {c.billing_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4">
                        {c.email
                          ? <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors group">
                              <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                              {c.email}
                            </a>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4">
                        {c.phone
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {c.phone}
                            </span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      {/* Tax ID */}
                      <td className="py-4 px-4">
                        {c.tax_id
                          ? <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                              {c.tax_id}
                            </span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      {/* Balance */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        {bal > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
                            {fmtUSD(bal)}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-400">{fmtUSD(bal)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Dialog panel — entry animation via Tailwind arbitrary */}
          <div
            className="
              relative w-full max-w-lg
              rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5
              animate-in fade-in zoom-in-95 duration-200
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add New Customer</h2>
                <p className="mt-0.5 text-xs text-slate-500">Fill in the details below to create a new contact.</p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              {/* API error */}
              {formError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <p className="text-xs text-rose-700">{formError}</p>
                </div>
              )}

              {/* Inline success */}
              {success && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <p className="text-xs font-medium text-emerald-700">Customer created successfully!</p>
                </div>
              )}

              {/* Name */}
              <div>
                <Label req>Customer Name</Label>
                <input
                  id="name" name="name" type="text" required
                  placeholder="Acme Corporation"
                  value={form.name} onChange={handleInput}
                  className={inputBase}
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Email Address</Label>
                  <input
                    id="email" name="email" type="email"
                    placeholder="hello@acme.com"
                    value={form.email} onChange={handleInput}
                    className={inputBase}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <input
                    id="phone" name="phone" type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone} onChange={handleInput}
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Tax ID */}
              <div>
                <Label>Tax ID / VAT</Label>
                <input
                  id="tax_id" name="tax_id" type="text"
                  placeholder="US-123456789"
                  value={form.tax_id} onChange={handleInput}
                  className={inputBase}
                />
              </div>

              {/* Billing address */}
              <div>
                <Label req>Billing Address</Label>
                <textarea
                  id="billing_address" name="billing_address"
                  rows={3} required
                  placeholder="123 Main St, New York, NY 10001, USA"
                  value={form.billing_address} onChange={handleInput}
                  className={`${inputBase} resize-none`}
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || success}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-95 disabled:opacity-60 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                    : success
                    ? <><CheckCircle2 className="h-4 w-4" />Saved!</>
                    : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
