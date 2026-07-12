import { AlertTriangle, BarChart3, Package } from 'lucide-react';
import { Item } from '../_types';

interface Props {
  items: Item[];
  loading: boolean;
  tracked: number;
  lowStock: number;
}

export default function KpiCards({ items, loading, tracked, lowStock }: Props) {
  const cards = [
    {
      label: 'Total Items', value: loading ? '—' : items.length,
      icon: Package, iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
    },
    {
      label: 'Stock Tracked', value: loading ? '—' : tracked,
      icon: BarChart3, iconBg: 'bg-sky-50', iconColor: 'text-sky-600',
    },
    {
      label: 'Low / Out of Stock', value: loading ? '—' : lowStock,
      icon: AlertTriangle,
      iconBg: lowStock > 0 ? 'bg-orange-50' : 'bg-emerald-50',
      iconColor: lowStock > 0 ? 'text-orange-500' : 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
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
