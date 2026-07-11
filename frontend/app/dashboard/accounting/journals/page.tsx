'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ChevronRight, Plus, AlertCircle, Book, Hash, Calendar, FileText, ChevronDown, ChevronUp, Database
} from 'lucide-react';

interface JournalLine {
  id: number;
  account: number;
  contact?: number | null;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string;
}

interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  description: string;
  source: string;
  lines: JournalLine[];
}

interface Account {
  id: number;
  code: string;
  name: string;
}

const safeNum = (v: string | number) => parseFloat(String(v)) || 0;
const fmt = (v: number | string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeNum(v));
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export default function JournalsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Record<number, Account>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jeRes, accRes] = await Promise.all([
        api.get('/api/v1/journal-entries/'),
        api.get('/api/v1/accounts/')
      ]);
      setEntries(jeRes.data.results ?? jeRes.data);
      
      const accData: Account[] = accRes.data.results ?? accRes.data;
      const accMap: Record<number, Account> = {};
      accData.forEach(a => { accMap[a.id] = a; });
      setAccounts(accMap);
    } catch {
      setError('Failed to load journal entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  return (
    <div className="space-y-6">
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

      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

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
                        <p className="text-xs text-zinc-400 mt-0.5">Click "New Journal Entry" to post a manual entry.</p>
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
    </div>
  );
}
