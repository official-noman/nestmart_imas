import Link from 'next/link';
import { FileText, Calendar, User, Hash, DollarSign, Plus } from 'lucide-react';
import { Invoice } from '../_types';
import { fmt, fmtDate } from '../_lib/helpers';
import StatusBadge from './StatusBadge';

/* ─── Skeleton Row ────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100">
      {[40, 28, 24, 24, 20, 20].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`animate-pulse bg-zinc-100 rounded h-4 w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

interface InvoicesTableProps {
  invoices: Invoice[];
  contacts: Record<number, string>;
  loading: boolean;
}

export default function InvoicesTable({ invoices, contacts, loading }: InvoicesTableProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">All Invoices</p>
        </div>
        <span className="text-xs text-zinc-400">{invoices.length} record{invoices.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50/60 border-b border-zinc-100">
              {[
                { icon: Hash,       label: 'Invoice #' },
                { icon: User,       label: 'Customer' },
                { icon: Calendar,   label: 'Issue Date' },
                { icon: Calendar,   label: 'Due Date' },
                { icon: null,       label: 'Status' },
                { icon: DollarSign, label: 'Grand Total' },
              ].map(({ icon: Icon, label }) => (
                <th key={label} className="px-5 py-3 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-700">No invoices yet</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Click "New Invoice" to create your first one.</p>
                    </div>
                    <Link
                      href="/dashboard/invoices/new"
                      className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Invoice
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-zinc-50/60 transition-colors cursor-default group"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-semibold text-zinc-900 tracking-tight">
                      {inv.invoice_number}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-700 font-medium">
                      {contacts[inv.customer] ?? `Customer #${inv.customer}`}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-500">{fmtDate(inv.issue_date)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${inv.status === 'Overdue' ? 'text-rose-600' : 'text-zinc-500'}`}>
                      {fmtDate(inv.due_date)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-zinc-900 font-mono">
                      {fmt(inv.grand_total)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
