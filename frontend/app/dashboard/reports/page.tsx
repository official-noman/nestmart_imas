'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Printer, AlertCircle, ChevronRight, FileText } from 'lucide-react';

interface PnLData {
  total_income: string;
  total_expense: string;
  net_profit: string;
}

const safeNum = (v: string | number) => parseFloat(String(v)) || 0;
const fmt = (v: number | string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeNum(v));

export default function ReportsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [data, setData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchPnL = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/v1/reports/pnl/');
        setData(res.data);
      } catch (err) {
        setError('Failed to load Profit & Loss statement.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchPnL();
  }, [isAuthenticated]);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Page Header (Hidden on Print) ── */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-900 font-medium">Reports</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Financial Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">View and print your Profit & Loss statement.</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={loading || !!error}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 print:hidden">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── P&L Statement Card ── */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-8 md:p-12 print:border-none print:shadow-none print:p-0">
        
        {/* Report Header */}
        <div className="text-center mb-10 border-b border-zinc-100 pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 mb-4 print:hidden">
            <FileText className="w-6 h-6 text-zinc-700" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profit & Loss Statement</h1>
          <h2 className="text-lg font-medium text-slate-600 mt-2">Nestmart IT</h2>
          <p className="text-sm text-slate-500 mt-1">For the period ended {today}</p>
        </div>

        {loading ? (
          /* ── Skeleton State ── */
          <div className="space-y-8 animate-pulse">
            <div>
              <div className="h-5 bg-zinc-100 rounded w-1/4 mb-4"></div>
              <div className="flex justify-between py-2">
                <div className="h-4 bg-zinc-50 rounded w-1/3"></div>
                <div className="h-4 bg-zinc-50 rounded w-24"></div>
              </div>
              <div className="flex justify-between py-3 border-t border-zinc-100 mt-2">
                <div className="h-5 bg-zinc-100 rounded w-32"></div>
                <div className="h-5 bg-zinc-100 rounded w-28"></div>
              </div>
            </div>
            <div>
              <div className="h-5 bg-zinc-100 rounded w-1/4 mb-4"></div>
              <div className="flex justify-between py-2">
                <div className="h-4 bg-zinc-50 rounded w-2/5"></div>
                <div className="h-4 bg-zinc-50 rounded w-24"></div>
              </div>
              <div className="flex justify-between py-3 border-t border-zinc-100 mt-2">
                <div className="h-5 bg-zinc-100 rounded w-32"></div>
                <div className="h-5 bg-zinc-100 rounded w-28"></div>
              </div>
            </div>
            <div className="flex justify-between py-4 border-t-2 border-b-4 border-double border-zinc-200 mt-8">
              <div className="h-6 bg-zinc-100 rounded w-40"></div>
              <div className="h-6 bg-zinc-100 rounded w-32"></div>
            </div>
          </div>
        ) : data ? (
          /* ── Actual Data ── */
          <div className="space-y-8 text-sm md:text-base">
            
            {/* Revenue */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs mb-3">Revenue</h3>
              <div className="flex justify-between py-2 text-slate-600">
                <span>Operating Revenue (Sales)</span>
                <span className="font-mono">{fmt(data.total_income)}</span>
              </div>
              <div className="flex justify-between py-3 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-900">Total Revenue</span>
                <span className="font-bold font-mono text-slate-900">{fmt(data.total_income)}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-2 pt-4">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs mb-3">Expenses</h3>
              <div className="flex justify-between py-2 text-slate-600">
                <span>Operating Expenses (Cost of Sales / General)</span>
                <span className="font-mono">{fmt(data.total_expense)}</span>
              </div>
              <div className="flex justify-between py-3 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-900">Total Expenses</span>
                <span className="font-bold font-mono text-slate-900">{fmt(data.total_expense)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="pt-8">
              <div className="flex justify-between items-center py-4 border-t-2 border-slate-400 border-b-4 border-double border-slate-900">
                <span className="text-lg font-bold text-slate-900">Net Profit / (Loss)</span>
                <span className={`text-lg font-bold font-mono ${safeNum(data.net_profit) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {fmt(data.net_profit)}
                </span>
              </div>
            </div>

          </div>
        ) : (
           <div className="text-center py-12 text-slate-500">
             No data available.
           </div>
        )}

      </div>
    </div>
  );
}
