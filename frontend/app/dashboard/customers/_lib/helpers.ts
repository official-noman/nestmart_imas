export const INITIAL_FORM = { name: '', email: '', phone: '', tax_id: '', billing_address: '' };

export const fmtUSD = (v: string | number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(String(v ?? 0)) || 0,
  );

const AVATAR_PALETTE = [
  'bg-violet-100 text-violet-600',
  'bg-sky-100    text-sky-600',
  'bg-teal-100   text-teal-600',
  'bg-amber-100  text-amber-600',
  'bg-rose-100   text-rose-600',
  'bg-indigo-100 text-indigo-600',
];

export const avatarFor = (name: string, id: number) => ({
  initials: name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
  palette: AVATAR_PALETTE[id % AVATAR_PALETTE.length],
});

import { getApiErrorData } from '@/lib/api';

export const parseApiError = (err: unknown): string => {
  const d = getApiErrorData(err);
  if (!d) return 'Something went wrong. Please try again.';
  if (typeof d === 'string') return d;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' · ');
};
