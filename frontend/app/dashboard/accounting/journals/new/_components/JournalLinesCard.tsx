import { Plus, Trash2, BookOpen } from 'lucide-react';
import { Account, Contact, JournalLineInput } from '../_types';

interface Props {
  accounts: Account[];
  contacts: Contact[];
  lines: JournalLineInput[];
  addLine: () => void;
  removeLine: (id: string) => void;
  updateLine: (id: string, field: keyof JournalLineInput, value: string) => void;
}

export default function JournalLinesCard({ accounts, contacts, lines, addLine, removeLine, updateLine }: Props) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Journal Lines</p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Line
        </button>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-zinc-50/60 border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
        <div className="col-span-4">Account</div>
        <div className="col-span-3">Contact (Optional)</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-1"></div>
      </div>

      <div className="divide-y divide-zinc-50">
        {lines.map((line) => (
          <div key={line.uid} className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <div className="col-span-1 md:col-span-4 space-y-1">
              <label className="md:hidden text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Account</label>
              <select
                required
                value={line.account}
                onChange={(e) => updateLine(line.uid, 'account', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              >
                <option value="">Select Account...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 md:col-span-3 space-y-1">
              <label className="md:hidden text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Contact</label>
              <select
                value={line.contact}
                onChange={(e) => updateLine(line.uid, 'contact', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              >
                <option value="">None</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="md:hidden text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Type</label>
              <select
                value={line.entry_type}
                onChange={(e) => updateLine(line.uid, 'entry_type', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              >
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="md:hidden text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                <input
                  type="number" min="0" step="0.01" required
                  value={line.amount}
                  onChange={(e) => updateLine(line.uid, 'amount', e.target.value)}
                  className="w-full pl-6 pr-3 py-2 font-mono text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-1 flex items-center justify-end h-full pt-6 md:pt-0">
              {lines.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeLine(line.uid)}
                  className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
