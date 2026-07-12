import { BookOpen, Layers } from 'lucide-react';
import { Account } from '../_types';
import { ACCOUNT_TYPES } from '../_lib/helpers';

export default function AccountsList({
  groupedAccounts,
}: {
  groupedAccounts: Record<string, Account[]>;
}) {
  return (
    <div className="space-y-8">
      {ACCOUNT_TYPES.map((type) => {
        const typeAccounts = groupedAccounts[type] || [];
        if (typeAccounts.length === 0) return null;
        return (
          <div key={type} className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <Layers className="w-4 h-4 text-zinc-500" />
              <h2 className="text-base font-semibold text-zinc-900">{type}s</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-32">Code</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Account Name</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {typeAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-zinc-900">{acc.code}</td>
                      <td className="px-6 py-4 text-sm text-zinc-700">{acc.name}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${acc.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                          {acc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {Object.keys(groupedAccounts).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-zinc-200/80 rounded-2xl bg-white shadow-sm">
          <BookOpen className="w-10 h-10 text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-900">No accounts found</p>
          <p className="text-sm text-zinc-500 mt-1">Create an account to build your general ledger.</p>
        </div>
      )}
    </div>
  );
}
