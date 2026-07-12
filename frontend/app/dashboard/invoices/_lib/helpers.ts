export const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Draft':          { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  'Sent':           { bg: 'bg-indigo-50',  text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Partially Paid': { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Paid':           { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  'Overdue':        { bg: 'bg-rose-50',    text: 'text-rose-700',   dot: 'bg-rose-500' },
  'Cancelled':      { bg: 'bg-zinc-100',   text: 'text-zinc-500',   dot: 'bg-zinc-400' },
};

export const fmt = (v: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v) || 0);

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
