export const safeNum = (v: string | number) => parseFloat(String(v)) || 0;

export const fmt = (v: number | string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeNum(v));

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
