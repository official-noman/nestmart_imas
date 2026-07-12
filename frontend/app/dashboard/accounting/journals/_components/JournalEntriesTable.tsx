import React from 'react';
import { Book, ChevronDown, ChevronUp } from 'lucide-react';
import { Account, JournalEntry } from '../_types';
import { fmt, fmtDate, safeNum } from '../_lib/helpers';

interface JournalEntriesTableProps {
  entries: JournalEntry[];
  accounts: Record<number, Account>;
  loading: boolean;
  expandedRows: Set<number>;
  toggleRow: (id: number) => void;
}

export default function JournalEntriesTable({
  entries,
  accounts,
  loading,
  expandedRows,
  toggleRow,
}: JournalEntriesTableProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Book className="w-3.5 h-3.5 text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Journal Entries</p>
        </div>
        <span className="text-xs text-zinc-400">{entries.length} record{entries.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-zinc-100">
              <th className="w-10"></th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-40">Entry #</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-40">Date</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-32">Source</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Description</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-40">Total Debits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="animate-pulse bg-zinc-100 rounded h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      <Book className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-700">No journal entries yet</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Click &quot;New Journal Entry&quot; to post a manual entry.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((je) => {
                const isExpanded = expandedRows.has(je.id);
                const totalDebits = je.lines.filter(l => l.entry_type === 'DEBIT').reduce((acc, l) => acc + safeNum(l.amount), 0);

                return (
                  <React.Fragment key={je.id}>
                    <tr
                      className={`hover:bg-zinc-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-zinc-50/50' : 'bg-white'}`}
                      onClick={() => toggleRow(je.id)}
                    >
                      <td className="pl-4 pr-1 py-4 text-zinc-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-5 py-4 font-mono text-sm font-semibold text-zinc-900">{je.entry_number}</td>
                      <td className="px-5 py-4 text-sm text-zinc-500">{fmtDate(je.date)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 uppercase tracking-widest">
                          {je.source}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700 truncate max-w-[200px]">{je.description}</td>
                      <td className="px-5 py-4 text-right text-sm font-mono font-semibold text-zinc-900">{fmt(totalDebits)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-zinc-50/30">
                        <td colSpan={6} className="p-0">
                          <div className="px-10 py-4 border-t border-zinc-100/50">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-zinc-200/50 text-xs font-semibold text-zinc-500">
                                  <th className="py-2 text-left">Account</th>
                                  <th className="py-2 text-left">Contact</th>
                                  <th className="py-2 text-left w-24">Type</th>
                                  <th className="py-2 text-right w-32">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100/50">
                                {je.lines.map((line) => (
                                  <tr key={line.id}>
                                    <td className="py-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-zinc-500">{accounts[line.account]?.code}</span>
                                        <span className="text-zinc-700">{accounts[line.account]?.name || 'Unknown Account'}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 text-zinc-500">
                                      {line.contact ? `Contact #${line.contact}` : <span className="text-zinc-300">-</span>}
                                    </td>
                                    <td className="py-2.5">
                                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${line.entry_type === 'DEBIT' ? 'bg-slate-100 text-slate-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {line.entry_type}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-right font-mono text-zinc-900">
                                      {fmt(line.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
