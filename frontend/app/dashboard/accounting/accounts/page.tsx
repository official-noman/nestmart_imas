'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ChevronRight, Plus, AlertCircle, Loader2, BookOpen, Layers, X
} from 'lucide-react';

interface Account {
  id: number;
  code: string;
  name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  is_active: boolean;
}

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', account_type: 'Asset' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/accounts/');
      setAccounts(res.data.results ?? res.data);
    } catch {
      setError('Failed to load chart of accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAccounts();
  }, [isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code || !form.name) {
      setFormError('Code and Name are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/v1/accounts/', { ...form, is_active: true });
      setShowModal(false);
      setForm({ code: '', name: '', account_type: 'Asset' });
      fetchAccounts();
    } catch (err: any) {
      const data = err.response?.data;
      setFormError(data?.detail || data?.code?.[0] || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) acc[account.account_type] = [];
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

  return (
    <div className="space-y-6">
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
          onClick={() => { setFormError(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Account
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-zinc-200/80 rounded-2xl p-6 animate-pulse">
               <div className="h-6 w-32 bg-zinc-100 rounded mb-4" />
               <div className="space-y-2">
                 <div className="h-4 w-full bg-zinc-50 rounded" />
                 <div className="h-4 w-full bg-zinc-50 rounded" />
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {accountTypes.map((type) => {
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
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-semibold text-zinc-900">Create Account</h2>
              <button onClick={() => setShowModal(false)} disabled={submitting} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-rose-700">{formError}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Account Type</label>
                <select
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value as any })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                >
                  {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Account Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2.5 font-mono text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cash in Bank"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
