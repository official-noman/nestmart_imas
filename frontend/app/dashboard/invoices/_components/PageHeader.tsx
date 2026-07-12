import Link from 'next/link';
import { Plus, ChevronRight, RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  kpi: { total: number; overdue: number; paid: number; draft: number };
}

export default function PageHeader({ loading, onRefresh, kpi }: PageHeaderProps) {
  return (
    <>
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
            onClick={onRefresh}
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
    </>
  );
}
