'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ChevronRight, ChevronDown, Plus, Trash2, Loader2,
  AlertCircle, CheckCircle, Calculator, Package, User,
  Calendar, FileText, X,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────── */
interface Contact {
  id: number;
  name: string;
  contact_type: string;
  is_active: boolean;
}

interface Item {
  id: number;
  name: string;
  sku: string;
  unit_price: string;
  tax_rate: string;
}

interface LineItem {
  uid: string;     // local unique key for React rendering
  item: number | '';
  quantity: number;
  unit_price: string;
  discount: string;
  tax_rate: string;
}

/* ─── Helpers ─────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);

const blankLine = (): LineItem => ({
  uid: uid(),
  item: '',
  quantity: 1,
  unit_price: '',
  discount: '0',
  tax_rate: '0',
});

const safeNum = (v: string | number) => parseFloat(String(v)) || 0;

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

/* ─── Sub-component: Field Label ─────────────────────────────── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
    {children}
  </label>
);

/* ─── Sub-component: Skeleton Input ─────────────────────────── */
const SkeletonInput = ({ w = 'full' }: { w?: string }) => (
  <div className={`h-10 w-${w} animate-pulse bg-zinc-100 rounded-xl`} />
);

/* ─── Main Component ──────────────────────────────────────────── */
export default function NewInvoicePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /* ── Data ── */
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemMap, setItemMap] = useState<Record<number, Item>>({});
  const [dataLoading, setDataLoading] = useState(true);

  /* ── Form header fields ── */
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [customer, setCustomer] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(thirtyDays);
  const [status, setStatus] = useState<'Draft' | 'Sent'>('Draft');

  /* ── Line items ── */
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);

  /* ── Submission ── */
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  /* ── Load data ── */
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [ctRes, itRes] = await Promise.all([
          api.get('/api/v1/contacts/'),
          api.get('/api/v1/items/'),
        ]);
        const ctAll: Contact[] = ctRes.data.results ?? ctRes.data;
        setContacts(ctAll.filter((c) => c.is_active));

        const itAll: Item[] = itRes.data.results ?? itRes.data;
        setItems(itAll);
        const map: Record<number, Item> = {};
        itAll.forEach((it) => { map[it.id] = it; });
        setItemMap(map);
      } catch {
        setGlobalError('Failed to load customers or items. Please refresh.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ─── Live Calculations ──────────────────────────────────────── */
  const totals = useMemo(() => {
    let subtotal = 0, discountTotal = 0, taxTotal = 0;
    lines.forEach((l) => {
      const qty = safeNum(l.quantity);
      const up  = safeNum(l.unit_price);
      const dis = safeNum(l.discount);
      const tr  = safeNum(l.tax_rate);
      const lineSub   = qty * up;
      const taxable   = lineSub - dis;
      const lineTax   = taxable * (tr / 100);
      subtotal       += lineSub;
      discountTotal  += dis;
      taxTotal       += lineTax;
    });
    return {
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal: subtotal - discountTotal + taxTotal,
    };
  }, [lines]);

  /* ─── Line Item Handlers ─────────────────────────────────────── */
  const addLine = () => setLines((prev) => [...prev, blankLine()]);

  const removeLine = (uid: string) =>
    setLines((prev) => prev.filter((l) => l.uid !== uid));

  const updateLine = useCallback(
    (uid: string, field: keyof LineItem, value: string | number) => {
      setLines((prev) =>
        prev.map((l) => {
          if (l.uid !== uid) return l;
          if (field === 'item') {
            // Auto-fill price + tax_rate from item catalog
            const it = itemMap[Number(value)];
            return it
              ? { ...l, item: Number(value), unit_price: it.unit_price, tax_rate: it.tax_rate }
              : { ...l, item: Number(value) };
          }
          return { ...l, [field]: value };
        })
      );
    },
    [itemMap]
  );

  /* ─── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!customer) errs.customer = 'Please select a customer.';
    if (!issueDate) errs.issue_date = 'Issue date is required.';
    if (!dueDate) errs.due_date = 'Due date is required.';
    if (lines.some((l) => !l.item)) errs.lines = 'All line items must have an item selected.';
    if (lines.some((l) => safeNum(l.unit_price) <= 0)) errs.unit_price = 'Unit price must be greater than zero for all lines.';

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        customer,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        lines: lines.map(({ uid: _uid, item, quantity, unit_price, discount, tax_rate }) => ({
          item,
          quantity: Number(quantity),
          unit_price,
          discount,
          tax_rate,
        })),
      };

      await api.post('/api/v1/invoices/', payload);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/invoices'), 1600);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const { detail, non_field_errors, ...rest } = data;
        if (detail) setGlobalError(detail);
        else if (non_field_errors) setGlobalError(non_field_errors.join(' '));
        else setGlobalError(JSON.stringify(rest));
      } else {
        setGlobalError('Failed to create invoice. Please check all fields and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Success Overlay ─────────────────────────────────────────── */
  if (success) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">Invoice Created!</p>
            <p className="text-sm text-zinc-500 mt-1">Redirecting to invoices list…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── JSX ─────────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-700 cursor-pointer hover:text-zinc-900" onClick={() => router.push('/dashboard/invoices')}>
            Invoices
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-medium">New Invoice</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create Invoice</h1>
        <p className="mt-1 text-sm text-zinc-500">Fill in the details and add line items to generate a new invoice.</p>
      </div>

      {/* ── Global Error ── */}
      {globalError && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{globalError}</p>
        </div>
      )}

      {/* ── Header Card: Invoice Meta ── */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Invoice Details</p>
            <p className="text-xs text-zinc-400">Customer, dates, and initial status</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Customer */}
          <div className="lg:col-span-2">
            <FieldLabel>Customer *</FieldLabel>
            {dataLoading ? <SkeletonInput /> : (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <select
                    value={customer}
                    onChange={(e) => { setCustomer(Number(e.target.value)); setFieldErrors((p) => ({...p, customer: ''})); }}
                    className={`w-full appearance-none pl-9 pr-9 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.customer ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                  >
                    <option value="">Select a customer…</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {fieldErrors.customer && <p className="text-xs text-rose-600 mt-1">{fieldErrors.customer}</p>}
              </>
            )}
          </div>

          {/* Status */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Draft' | 'Sent')}
                className="w-full appearance-none px-3 pr-9 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
              </select>
            </div>
          </div>

          {/* Spacer for alignment */}
          <div className="hidden lg:block" />

          {/* Issue Date */}
          <div>
            <FieldLabel>Issue Date *</FieldLabel>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                value={issueDate}
                onChange={(e) => { setIssueDate(e.target.value); setFieldErrors((p) => ({...p, issue_date: ''})); }}
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.issue_date ? 'border-rose-300' : 'border-zinc-200'}`}
              />
            </div>
            {fieldErrors.issue_date && <p className="text-xs text-rose-600 mt-1">{fieldErrors.issue_date}</p>}
          </div>

          {/* Due Date */}
          <div>
            <FieldLabel>Due Date *</FieldLabel>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); setFieldErrors((p) => ({...p, due_date: ''})); }}
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.due_date ? 'border-rose-300' : 'border-zinc-200'}`}
              />
            </div>
            {fieldErrors.due_date && <p className="text-xs text-rose-600 mt-1">{fieldErrors.due_date}</p>}
          </div>
        </div>
      </div>

      {/* ── Line Items Card ── */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Line Items</p>
              <p className="text-xs text-zinc-400">Products or services included in this invoice</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Line
          </button>
        </div>

        {/* Column header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-zinc-50/60 border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          <div className="col-span-4">Item</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-2">Discount</div>
          <div className="col-span-1">Tax %</div>
          <div className="col-span-1 text-right">Line Total</div>
        </div>

        {/* Lines */}
        <div className="divide-y divide-zinc-50">
          {dataLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-6 py-4 grid grid-cols-12 gap-3">
                {[4, 2, 2, 2, 1, 1].map((span, j) => (
                  <div key={j} className={`col-span-${span} h-9 animate-pulse bg-zinc-100 rounded-xl`} />
                ))}
              </div>
            ))
          ) : (
            lines.map((line, idx) => {
              const qty    = safeNum(line.quantity);
              const up     = safeNum(line.unit_price);
              const dis    = safeNum(line.discount);
              const tr     = safeNum(line.tax_rate);
              const taxable = qty * up - dis;
              const lineTotal = taxable + taxable * (tr / 100);

              return (
                <div key={line.uid} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-3 items-start">
                    {/* Item select */}
                    <div className="col-span-12 md:col-span-4">
                      <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Item</label>
                      <div className="relative">
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                        <select
                          value={line.item}
                          onChange={(e) => updateLine(line.uid, 'item', e.target.value)}
                          className={`w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.lines && !line.item ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                        >
                          <option value="">Select item…</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.uid, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Unit Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.uid, 'unit_price', e.target.value)}
                          className={`w-full pl-6 pr-3 py-2 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono ${fieldErrors.unit_price && safeNum(line.unit_price) <= 0 ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                        />
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="col-span-5 md:col-span-2">
                      <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Discount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.discount}
                          onChange={(e) => updateLine(line.uid, 'discount', e.target.value)}
                          className="w-full pl-6 pr-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Tax Rate (readonly) */}
                    <div className="col-span-3 md:col-span-1">
                      <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Tax</label>
                      <div className="flex items-center justify-center h-9 px-2 rounded-xl bg-zinc-50 border border-zinc-200">
                        <span className="text-sm font-mono text-zinc-600 text-center">{line.tax_rate}%</span>
                      </div>
                    </div>

                    {/* Line Total + Delete */}
                    <div className="col-span-4 md:col-span-1 flex items-center justify-between md:justify-end gap-2">
                      <span className="text-sm font-semibold font-mono text-zinc-900 text-right">
                        {fmt(lineTotal > 0 ? lineTotal : 0)}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(line.uid)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0"
                          title="Remove line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Line errors */}
        {fieldErrors.lines && (
          <div className="px-6 pb-3">
            <p className="text-xs text-rose-600">{fieldErrors.lines}</p>
          </div>
        )}
        {fieldErrors.unit_price && (
          <div className="px-6 pb-3">
            <p className="text-xs text-rose-600">{fieldErrors.unit_price}</p>
          </div>
        )}
      </div>

      {/* ── Totals + Submit ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        {/* Submit CTA */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/invoices')}
            className="px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || dataLoading}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
            ) : (
              <><FileText className="w-4 h-4" /> Create Invoice</>
            )}
          </button>
        </div>

        {/* Live Totals Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden min-w-[300px]">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
            <Calculator className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Live Calculation</span>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Subtotal</span>
              <span className="text-sm font-mono font-medium text-zinc-800">{fmt(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Discount</span>
              <span className="text-sm font-mono font-medium text-rose-600">−{fmt(totals.discountTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Tax</span>
              <span className="text-sm font-mono font-medium text-zinc-800">+{fmt(totals.taxTotal)}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100">
              <span className="text-sm font-semibold text-zinc-900">Grand Total</span>
              <span className="text-lg font-bold font-mono text-zinc-900">{fmt(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
