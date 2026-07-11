'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  Plus, X, Search, Package, AlertCircle, ChevronRight,
  Loader2, RefreshCw, Tag, BarChart3, AlertTriangle,
  CheckCircle2, TrendingDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Item {
  id: number;
  sku: string;
  name: string;
  unit_price: string | number;
  tax_rate: string | number;
  track_stock: boolean;
  stock_quantity: number;
}

const INITIAL_FORM = {
  sku: '', name: '', unit_price: '', tax_rate: '0.00',
  track_stock: false, stock_quantity: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (v: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(String(v)) || 0,
  );

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

function StockBadge({ item }: { item: Item }) {
  if (!item.track_stock)
    return <span className="text-xs italic text-slate-400">Not tracked</span>;

  if (item.stock_quantity <= 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </span>
    );

  if (item.stock_quantity <= 5)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-600/10">
        <TrendingDown className="h-3 w-3" />
        {item.stock_quantity} — Low Stock
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <CheckCircle2 className="h-3 w-3" />
      {item.stock_quantity} in stock
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-4 pl-6 pr-4">
        <div className="space-y-1.5">
          <div className="h-3.5 w-40 rounded-full bg-slate-100" />
          <div className="h-2.5 w-24 rounded-full bg-slate-50" />
        </div>
      </td>
      <td className="py-4 px-4 text-right"><div className="h-3.5 w-16 rounded-full bg-slate-100 ml-auto" /></td>
      <td className="py-4 px-4 text-right"><div className="h-5 w-14 rounded-full bg-slate-100 ml-auto" /></td>
      <td className="py-4 px-4 text-center"><div className="h-6 w-24 rounded-full bg-slate-100 mx-auto" /></td>
    </tr>
  );
}

// ─── Styled Toggle Switch ─────────────────────────────────────────────────────
function Toggle({
  checked, onChange, id,
}: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2
        focus-visible:ring-zinc-900 focus-visible:ring-offset-2
        ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ItemsPage() {
  const [items, setItems]         = useState<Item[]>([]);
  const [filtered, setFiltered]   = useState<Item[]>([]);
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
      const res = await api.get('/api/v1/items/');
      const data: Item[] = res.data.results ?? res.data;
      setItems(data);
      setFiltered(data);
    } catch {
      setFetchError('Unable to load items. Check your connection and try again.');
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
    if (!query.trim()) { setFiltered(items); return; }
    const q = query.toLowerCase();
    setFiltered(
      items.filter(i =>
        i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
      ),
    );
  }, [query, items]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal  = () => { setForm(INITIAL_FORM); setFormError(null); setSuccess(false); setIsOpen(true); };
  const closeModal = () => { if (!saving) setIsOpen(false); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/api/v1/items/', {
        ...form,
        unit_price: parseFloat(form.unit_price as string) || 0,
        tax_rate: parseFloat(form.tax_rate as string) || 0,
        stock_quantity: parseInt(String(form.stock_quantity), 10) || 0,
      });
      setSuccess(true);
      setTimeout(() => { setIsOpen(false); load(); }, 1000);
    } catch (err: any) {
      setFormError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const lowStock  = items.filter(i => i.track_stock && i.stock_quantity <= 5).length;
  const tracked   = items.filter(i => i.track_stock).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-slate-600">Items</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Items &amp; Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your product catalog, pricing, tax rates, and stock levels.
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
            Add Item
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Items', value: loading ? '—' : items.length,
            icon: Package, iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
          },
          {
            label: 'Stock Tracked', value: loading ? '—' : tracked,
            icon: BarChart3, iconBg: 'bg-sky-50', iconColor: 'text-sky-600',
          },
          {
            label: 'Low / Out of Stock', value: loading ? '—' : lowStock,
            icon: AlertTriangle,
            iconBg: lowStock > 0 ? 'bg-orange-50' : 'bg-emerald-50',
            iconColor: lowStock > 0 ? 'text-orange-500' : 'text-emerald-500',
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
              placeholder="Search by name or SKU…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>
          {!loading && (
            <p className="text-xs text-slate-400 shrink-0">
              {filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {[
                  { label: 'Product',       align: 'text-left',   cls: 'pl-6 pr-4' },
                  { label: 'Unit Price',    align: 'text-right',  cls: 'px-4' },
                  { label: 'Tax Rate',      align: 'text-right',  cls: 'px-4' },
                  { label: 'Stock Status',  align: 'text-center', cls: 'pl-4 pr-6' },
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
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        {query ? 'No items match your search.' : 'No items yet.'}
                      </p>
                      {!query && (
                        <button
                          onClick={openModal}
                          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                        >
                          <Plus className="h-4 w-4" /> Add your first item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Product */}
                    <td className="py-4 pl-6 pr-4">
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                        <Tag className="h-3 w-3" />
                        {item.sku}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        {fmtUSD(item.unit_price)}
                      </span>
                    </td>

                    {/* Tax Rate */}
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {parseFloat(String(item.tax_rate)).toFixed(2)}%
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-4 pl-4 pr-6 text-center">
                      <StockBadge item={item} />
                    </td>
                  </tr>
                ))
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

          {/* Dialog panel */}
          <div
            className="
              relative w-full max-w-lg
              rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5
              animate-in fade-in zoom-in-95 duration-200
              max-h-[90vh] overflow-y-auto
            "
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add New Item</h2>
                <p className="mt-0.5 text-xs text-slate-500">Define a new product or service in your catalog.</p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={submit} className="px-6 py-5 space-y-5">
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
                  <p className="text-xs font-medium text-emerald-700">Item created successfully!</p>
                </div>
              )}

              {/* Item Name */}
              <div>
                <Label req>Item Name</Label>
                <input
                  id="name" name="name" type="text" required
                  placeholder="Premium Widget"
                  value={form.name} onChange={handleInput}
                  className={inputBase}
                />
              </div>

              {/* SKU + Unit Price */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label req>SKU</Label>
                  <input
                    id="sku" name="sku" type="text" required
                    placeholder="WDG-001"
                    value={form.sku} onChange={handleInput}
                    className={inputBase}
                  />
                </div>
                <div>
                  <Label req>Unit Price</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                    <input
                      id="unit_price" name="unit_price" type="number"
                      step="0.01" min="0" required placeholder="0.00"
                      value={form.unit_price} onChange={handleInput}
                      className={`${inputBase} pl-6`}
                    />
                  </div>
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <Label>Tax Rate</Label>
                <div className="relative">
                  <input
                    id="tax_rate" name="tax_rate" type="number"
                    step="0.01" min="0" max="100" placeholder="0.00"
                    value={form.tax_rate} onChange={handleInput}
                    className={`${inputBase} pr-8`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
                </div>
              </div>

              {/* Track Stock Toggle */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Track Inventory Stock</p>
                    <p className="mt-0.5 text-xs text-slate-500">Enable to manage quantities and receive low-stock alerts.</p>
                  </div>
                  <Toggle
                    id="track_stock"
                    checked={form.track_stock}
                    onChange={v => setForm(p => ({ ...p, track_stock: v }))}
                  />
                </div>

                {/* Conditional stock qty */}
                {form.track_stock && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <Label>Initial Stock Quantity</Label>
                    <input
                      id="stock_quantity" name="stock_quantity" type="number" min="0"
                      value={form.stock_quantity} onChange={handleInput}
                      className={`${inputBase} max-w-[140px]`}
                    />
                  </div>
                )}
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
                    : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
