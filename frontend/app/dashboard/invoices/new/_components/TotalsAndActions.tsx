import { Calculator, FileText, Loader2 } from 'lucide-react';
import { fmt } from '../_lib/helpers';

interface Totals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

interface Props {
  totals: Totals;
  submitting: boolean;
  dataLoading: boolean;
  onCancel: () => void;
}

export default function TotalsAndActions({ totals, submitting, dataLoading, onCancel }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
      {/* Submit CTA */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || dataLoading}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
          ) : (
            <><FileText className="w-4 h-4" /> Create Invoice</>
          )}
        </button>
      </div>

      {/* Live Totals Card */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden min-w-[300px]">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
          <Calculator className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Live Calculation</span>
        </div>
        <div className="px-5 py-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Subtotal</span>
            <span className="text-sm font-mono font-medium text-zinc-800">{fmt(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Discount</span>
            <span className="text-sm font-mono font-medium text-rose-600">−{fmt(totals.discountTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Tax</span>
            <span className="text-sm font-mono font-medium text-zinc-800">+{fmt(totals.taxTotal)}</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100">
            <span className="text-sm font-semibold text-zinc-900">Grand Total</span>
            <span className="text-lg font-bold font-mono text-zinc-900">{fmt(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
