import { LineItem } from '../_types';

export const uid = () => Math.random().toString(36).slice(2);

export const blankLine = (): LineItem => ({
  uid: uid(),
  item: '',
  quantity: 1,
  unit_price: '',
  discount: '0',
  tax_rate: '0',
});

export const safeNum = (v: string | number) => parseFloat(String(v)) || 0;

export const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
