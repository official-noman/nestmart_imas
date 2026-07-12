import { ChevronRight, Plus } from 'lucide-react';

export default function PageHeader({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-medium">Accounting</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-medium">Chart of Accounts</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Chart of Accounts</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your general ledger accounts.</p>
      </div>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" /> Create Account
      </button>
    </div>
  );
}
