import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';

export default function JournalsPageHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-medium">Accounting</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-medium">Journal Entries</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">General Ledger</h1>
        <p className="mt-1 text-sm text-zinc-500">View and manage posted journal entries.</p>
      </div>
      <Link
        href="/dashboard/accounting/journals/new"
        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" /> New Journal Entry
      </Link>
    </div>
  );
}
