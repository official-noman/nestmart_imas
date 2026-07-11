'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Plus, FileText, ChevronRight, AlertCircle,
  Calendar, User, Hash, DollarSign, RefreshCw,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────── */
interface Invoice {
  id: number;
  invoice_number: string;
  customer: number;
  customer_name?: string;
  status: string;
  issue_date: string;
  due_date: string;
  grand_total: string;
}

interface Contact {
  id: number;
  name: string;
  contact_type: string;
}

/* ─── Status Badge ────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Draft':          { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  'Sent':           { bg: 'bg-indigo-50',  text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Partially Paid': { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Paid':           { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  'Overdue':        { bg: 'bg-rose-50',    text: 'text-rose-700',   dot: 'bg-rose-500' },
  'Cancelled':      { bg: 'bg-zinc-100',   text: 'text-zinc-500',   dot: 'bg-zinc-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Draft'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-transparent ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

/* ─── Skeleton Row ────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100">
      {[40, 28, 24, 24, 20, 20].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`animate-pulse bg-zinc-100 rounded h-4 w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Currency formatter ──────────────────────────────────────── */
const fmt = (v: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v) || 0);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/* ─── Main Page ───────────────────────────────────────────────── */
export default function InvoicesPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchAll();
  }, [isAuthenticated]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, ctRes] = await Promise.all([
        api.get('/api/v1/invoices/'),
        api.get('/api/v1/contacts/'),
      ]);

      // Build a map of contact id → name
      const ctData: Contact[] = ctRes.data.results ?? ctRes.data;
      const ctMap: Record<number, string> = {};
      ctData.forEach((c) => { ctMap[c.id] = c.name; });
      setContacts(ctMap);

      const invData: Invoice[] = invRes.data.results ?? invRes.data;
      setInvoices(invData);
    } catch {
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── KPI counts for header strip ── */
  const kpi = {
    total: invoices.length,
    overdue: invoices.filter((i) => i.status === 'Overdue').length,
    paid: invoices.filter((i) => i.status === 'Paid').length,
    draft: invoices.filter((i) => i.status === 'Draft').length,
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-900 font-medium">Invoices</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Invoices</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage and track all customer invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: kpi.total,   color: 'text-zinc-900' },
          { label: 'Draft',   value: kpi.draft,   color: 'text-slate-600' },
          { label: 'Overdue', value: kpi.overdue, color: 'text-rose-600' },
          { label: 'Paid',    value: kpi.paid,    color: 'text-emerald-600' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-zinc-200/80 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">{k.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">All Invoices</p>
          </div>
          <span className="text-xs text-zinc-400">{invoices.length} record{invoices.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-100">
                {[
                  { icon: Hash,       label: 'Invoice #' },
                  { icon: User,       label: 'Customer' },
                  { icon: Calendar,   label: 'Issue Date' },
                  { icon: Calendar,   label: 'Due Date' },
                  { icon: null,       label: 'Status' },
                  { icon: DollarSign, label: 'Grand Total' },
                ].map(({ icon: Icon, label }) => (
                  <th key={label} className="px-5 py-3 text-left">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                      {Icon && <Icon className="w-3 h-3" />}
                      {label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-700">No invoices yet</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Click "New Invoice" to create your first one.</p>
                      </div>
                      <Link
                        href="/dashboard/invoices/new"
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-zinc-50/60 transition-colors cursor-default group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-zinc-900 tracking-tight">
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-zinc-700 font-medium">
                        {contacts[inv.customer] ?? `Customer #${inv.customer}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-zinc-500">{fmtDate(inv.issue_date)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${inv.status === 'Overdue' ? 'text-rose-600' : 'text-zinc-500'}`}>
                        {fmtDate(inv.due_date)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-zinc-900 font-mono">
                        {fmt(inv.grand_total)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
