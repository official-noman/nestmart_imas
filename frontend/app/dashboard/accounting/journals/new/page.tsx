'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ChevronRight, Plus, Trash2, AlertCircle, CheckCircle,
  FileText, Calendar, BookOpen, Loader2
} from 'lucide-react';

interface Account {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

interface Contact {
  id: number;
  name: string;
  is_active: boolean;
}

interface JournalLineInput {
  uid: string;
  account: string;
  contact: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string;
}

const uid = () => Math.random().toString(36).slice(2);

const blankLine = (): JournalLineInput => ({
  uid: uid(),
  account: '',
  contact: '',
  entry_type: 'DEBIT',
  amount: '',
});

const safeNum = (v: string | number) => parseFloat(String(v)) || 0;
const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function NewJournalEntryPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLineInput[]>([blankLine(), blankLine()]);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [accRes, ctRes] = await Promise.all([
          api.get('/api/v1/accounts/'),
          api.get('/api/v1/contacts/'),
        ]);
        const accData: Account[] = accRes.data.results ?? accRes.data;
        setAccounts(accData.filter(a => a.is_active));
        
        const ctData: Contact[] = ctRes.data.results ?? ctRes.data;
        setContacts(ctData.filter(c => c.is_active));
      } catch {
        setGlobalError('Failed to load accounts and contacts.');
      } finally {
        setLoadingData(false);
      }
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const addLine = () => setLines(prev => [...prev, blankLine()]);
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.uid !== id));

  const updateLine = (id: string, field: keyof JournalLineInput, value: string) => {
    setLines(prev => prev.map(l => l.uid === id ? { ...l, [field]: value } : l));
  };

  const totals = useMemo(() => {
    let totalDebits = 0;
    let totalCredits = 0;
    lines.forEach(l => {
      const amt = safeNum(l.amount);
      if (l.entry_type === 'DEBIT') totalDebits += amt;
      else totalCredits += amt;
    });
    return {
      totalDebits,
      totalCredits,
      variance: Math.abs(totalDebits - totalCredits)
    };
  }, [lines]);

  const isBalanced = totals.variance === 0 && totals.totalDebits > 0;
  const isReadyToSubmit = isBalanced && date && description && lines.every(l => l.account && safeNum(l.amount) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    if (!isReadyToSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        date,
        description,
        source: 'Manual',
        lines: lines.map(l => ({
          account: parseInt(l.account),
          contact: l.contact ? parseInt(l.contact) : null,
          entry_type: l.entry_type,
          amount: l.amount
        }))
      };

      await api.post('/api/v1/journal-entries/', payload);
      router.push('/dashboard/accounting/journals');
    } catch (err: any) {
      const data = err.response?.data;
      setGlobalError(data?.detail || JSON.stringify(data) || 'Failed to post entry.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-700 cursor-pointer hover:text-zinc-900" onClick={() => router.push('/dashboard/accounting/journals')}>
            Accounting
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-medium">New Journal Entry</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create Journal Entry</h1>
        <p className="mt-1 text-sm text-zinc-500">Post a manual double-entry journal to the general ledger.</p>
      </div>

      {globalError && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{globalError}</p>
        </div>
      )}

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Entry Details</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Depreciation for Q3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
            />
          </div>
        </div>
      </div>

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
          {lines.map((line, idx) => (
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

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          {isBalanced ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Balanced (Total: {fmt(totals.totalDebits)})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Unbalanced (Difference: {fmt(totals.variance)})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => router.push('/dashboard/accounting/journals')}
            className="flex-1 md:flex-none px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isReadyToSubmit || submitting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-6 rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {submitting ? 'Posting...' : 'Post Entry'}
          </button>
        </div>
      </div>
    </form>
  );
}
