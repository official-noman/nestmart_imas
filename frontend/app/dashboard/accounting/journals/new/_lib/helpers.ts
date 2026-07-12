import { JournalLineInput } from '../_types';

export const uid = () => Math.random().toString(36).slice(2);

export const blankLine = (): JournalLineInput => ({
  uid: uid(),
  account: '',
  contact: '',
  entry_type: 'DEBIT',
  amount: '',
});

export const safeNum = (v: string | number) => parseFloat(String(v)) || 0;

export const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
