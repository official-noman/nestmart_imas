import { AlertTriangle, CheckCircle2, Package, Plus, Search, Tag, TrendingDown } from 'lucide-react';
import { Item } from '../_types';
import { fmtUSD } from '../_lib/helpers';

function StockBadge({ item }: { item: Item }) {
  if (!item.track_stock)
    return <span className="text-xs italic text-slate-400">Not tracked</span>;

  if (item.stock_quantity <= 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </span>
    );

  if (item.stock_quantity <= 5)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-600/10">
        <TrendingDown className="h-3 w-3" />
        {item.stock_quantity} — Low Stock
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <CheckCircle2 className="h-3 w-3" />
      {item.stock_quantity} in stock
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-4 pl-6 pr-4">
        <div className="space-y-1.5">
          <div className="h-3.5 w-40 rounded-full bg-slate-100" />
          <div className="h-2.5 w-24 rounded-full bg-slate-50" />
        </div>
      </td>
      <td className="py-4 px-4 text-right"><div className="h-3.5 w-16 rounded-full bg-slate-100 ml-auto" /></td>
      <td className="py-4 px-4 text-right"><div className="h-5 w-14 rounded-full bg-slate-100 ml-auto" /></td>
      <td className="py-4 px-4 text-center"><div className="h-6 w-24 rounded-full bg-slate-100 mx-auto" /></td>
    </tr>
  );
}

interface Props {
  filtered: Item[];
  items: Item[];
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  onAdd: () => void;
}

export default function ItemsTable({ filtered, items, query, setQuery, loading, onAdd }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="relative max-w-sm w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
          />
        </div>
        {!loading && (
          <p className="text-xs text-slate-400 shrink-0">
            {filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {[
                { label: 'Product', align: 'text-left', cls: 'pl-6 pr-4' },
                { label: 'Unit Price', align: 'text-right', cls: 'px-4' },
                { label: 'Tax Rate', align: 'text-right', cls: 'px-4' },
                { label: 'Stock Status', align: 'text-center', cls: 'pl-4 pr-6' },
              ].map(({ label, align, cls }) => (
                <th
                  key={label}
                  scope="col"
                  className={`py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 ${align} ${cls}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {query ? 'No items match your search.' : 'No items yet.'}
                    </p>
                    {!query && (
                      <button
                        onClick={onAdd}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                      >
                        <Plus className="h-4 w-4" /> Add your first item
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Product */}
                  <td className="py-4 pl-6 pr-4">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                      <Tag className="h-3 w-3" />
                      {item.sku}
                    </span>
                  </td>

                  {/* Unit Price */}
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-semibold text-slate-900">
                      {fmtUSD(item.unit_price)}
                    </span>
                  </td>

                  {/* Tax Rate */}
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {parseFloat(String(item.tax_rate)).toFixed(2)}%
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="py-4 pl-4 pr-6 text-center">
                    <StockBadge item={item} />
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
