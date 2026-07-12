'use client';

import { Plus, ChevronRight, RefreshCw } from 'lucide-react';

export default function PageHeader({
  onRefresh,
  onAdd,
}: {
  onRefresh: () => void;
  onAdd: () => void;
}) {
  return (
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
          onClick={onRefresh}
          title="Refresh list"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>
    </div>
  );
}
