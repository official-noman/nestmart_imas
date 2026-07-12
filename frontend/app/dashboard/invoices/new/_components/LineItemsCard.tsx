import { ChevronDown, Package, Plus, Trash2 } from 'lucide-react';
import { Item, LineItem } from '../_types';
import { safeNum, fmt } from '../_lib/helpers';

interface Props {
  items: Item[];
  lines: LineItem[];
  dataLoading: boolean;
  fieldErrors: Record<string, string>;
  addLine: () => void;
  removeLine: (uid: string) => void;
  updateLine: (uid: string, field: keyof LineItem, value: string | number) => void;
}

export default function LineItemsCard({
  items, lines, dataLoading, fieldErrors, addLine, removeLine, updateLine,
}: Props) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Line Items</p>
            <p className="text-xs text-zinc-400">Products or services included in this invoice</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Line
        </button>
      </div>

      {/* Column header */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-zinc-50/60 border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
        <div className="col-span-4">Item</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Unit Price</div>
        <div className="col-span-2">Discount</div>
        <div className="col-span-1">Tax %</div>
        <div className="col-span-1 text-right">Line Total</div>
      </div>

      {/* Lines */}
      <div className="divide-y divide-zinc-50">
        {dataLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-6 py-4 grid grid-cols-12 gap-3">
              {[4, 2, 2, 2, 1, 1].map((span, j) => (
                <div key={j} className={`col-span-${span} h-9 animate-pulse bg-zinc-100 rounded-xl`} />
              ))}
            </div>
          ))
        ) : (
          lines.map((line) => {
            const qty = safeNum(line.quantity);
            const up = safeNum(line.unit_price);
            const dis = safeNum(line.discount);
            const tr = safeNum(line.tax_rate);
            const taxable = qty * up - dis;
            const lineTotal = taxable + taxable * (tr / 100);

            return (
              <div key={line.uid} className="px-6 py-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* Item select */}
                  <div className="col-span-12 md:col-span-4">
                    <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Item</label>
                    <div className="relative">
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      <select
                        value={line.item}
                        onChange={(e) => updateLine(line.uid, 'item', e.target.value)}
                        className={`w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.lines && !line.item ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                      >
                        <option value="">Select item…</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-6 md:col-span-2">
                    <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.uid, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-6 md:col-span-2">
                    <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Unit Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(line.uid, 'unit_price', e.target.value)}
                        className={`w-full pl-6 pr-3 py-2 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono ${fieldErrors.unit_price && safeNum(line.unit_price) <= 0 ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="col-span-5 md:col-span-2">
                    <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Discount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.discount}
                        onChange={(e) => updateLine(line.uid, 'discount', e.target.value)}
                        className="w-full pl-6 pr-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Tax Rate (readonly) */}
                  <div className="col-span-3 md:col-span-1">
                    <label className="block md:hidden text-[11px] text-zinc-400 mb-1 uppercase tracking-widest font-semibold">Tax</label>
                    <div className="flex items-center justify-center h-9 px-2 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-sm font-mono text-zinc-600 text-center">{line.tax_rate}%</span>
                    </div>
                  </div>

                  {/* Line Total + Delete */}
                  <div className="col-span-4 md:col-span-1 flex items-center justify-between md:justify-end gap-2">
                    <span className="text-sm font-semibold font-mono text-zinc-900 text-right">
                      {fmt(lineTotal > 0 ? lineTotal : 0)}
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(line.uid)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Line errors */}
      {fieldErrors.lines && (
        <div className="px-6 pb-3">
          <p className="text-xs text-rose-600">{fieldErrors.lines}</p>
        </div>
      )}
      {fieldErrors.unit_price && (
        <div className="px-6 pb-3">
          <p className="text-xs text-rose-600">{fieldErrors.unit_price}</p>
        </div>
      )}
    </div>
  );
}
