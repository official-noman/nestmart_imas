import { CreditCard, Hash, User, DollarSign, FileText, Calendar } from 'lucide-react';
import { Contact, Payment } from '../_types';
import { fmt, fmtDate } from '../_lib/helpers';

interface Props {
  payments: Payment[];
  contacts: Record<number, Contact>;
  loading: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100">
      {[24, 32, 20, 24, 24, 20].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`animate-pulse bg-zinc-100 rounded h-4 w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

export default function PaymentsTable({ payments, contacts, loading }: Props) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5 text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Payment History</p>
        </div>
        <span className="text-xs text-zinc-400">{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50/60 border-b border-zinc-100">
              {[
                { icon: Hash,       label: 'Payment ID' },
                { icon: User,       label: 'Customer' },
                { icon: DollarSign, label: 'Amount' },
                { icon: CreditCard, label: 'Method' },
                { icon: FileText,   label: 'Reference' },
                { icon: Calendar,   label: 'Date' },
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
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-700">No payments yet</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Click "Record Payment" to log a new receipt.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-zinc-50/60 transition-colors cursor-default">
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-semibold text-zinc-900 tracking-tight">
                      PAY-{pay.id.toString().padStart(4, '0')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-700 font-medium">
                      {contacts[pay.customer]?.name ?? `Customer #${pay.customer}`}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-zinc-900 font-mono">
                      {fmt(pay.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-600">{pay.payment_method}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-500">{pay.reference || '-'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-500">{fmtDate(pay.payment_date)}</span>
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
