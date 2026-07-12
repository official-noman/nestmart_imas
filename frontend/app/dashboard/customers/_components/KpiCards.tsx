'use client';

import { Users, CreditCard } from 'lucide-react';
import { fmtUSD } from '../_lib/helpers';

export default function KpiCards({
  loading,
  totalCustomers,
  totalBalance,
}: {
  loading: boolean;
  totalCustomers: number;
  totalBalance: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        {
          label: 'Total Customers',
          value: loading ? '—' : totalCustomers,
          icon: Users,
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-600',
        },
        {
          label: 'Total Outstanding',
          value: loading ? '—' : fmtUSD(totalBalance),
          icon: CreditCard,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-500',
        },
      ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
