'use client';

import { AlertCircle } from 'lucide-react';

import { useInvoices } from './_lib/useInvoices';
import PageHeader from './_components/PageHeader';
import InvoicesTable from './_components/InvoicesTable';

export default function InvoicesPage() {
  const { invoices, contacts, loading, error, kpi, fetchAll } = useInvoices();

  return (
    <div className="space-y-6">
      <PageHeader loading={loading} onRefresh={fetchAll} kpi={kpi} />

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <InvoicesTable invoices={invoices} contacts={contacts} loading={loading} />
    </div>
  );
}
