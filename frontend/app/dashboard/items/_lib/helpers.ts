import { ItemForm } from '../_types';

export const INITIAL_FORM: ItemForm = {
  sku: '', name: '', unit_price: '', tax_rate: '0.00',
  track_stock: false, stock_quantity: 0,
};

export const fmtUSD = (v: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(String(v)) || 0,
  );

export const parseApiError = (err: any): string => {
  const d = err?.response?.data;
  if (!d) return 'Something went wrong. Please try again.';
  if (typeof d === 'string') return d;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' · ');
};

// ─── Design tokens ────────────────────────────────────────────────────────────
export const inputBase =
  'block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 shadow-sm transition-all ' +
  'hover:border-zinc-400 ' +
  'focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10';
