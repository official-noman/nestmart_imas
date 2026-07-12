import { ChevronRight } from 'lucide-react';

export default function PageHeader({ onNavigateToList }: { onNavigateToList: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
        <span>Dashboard</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-700 cursor-pointer hover:text-zinc-900" onClick={onNavigateToList}>
          Accounting
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-900 font-medium">New Journal Entry</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create Journal Entry</h1>
      <p className="mt-1 text-sm text-zinc-500">Post a manual double-entry journal to the general ledger.</p>
    </div>
  );
}
