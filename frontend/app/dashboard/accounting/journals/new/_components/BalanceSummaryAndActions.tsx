import { AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { fmt } from '../_lib/helpers';

interface Totals {
  totalDebits: number;
  totalCredits: number;
  variance: number;
}

interface Props {
  totals: Totals;
  isBalanced: boolean;
  isReadyToSubmit: boolean | string;
  submitting: boolean;
  onCancel: () => void;
}

export default function BalanceSummaryAndActions({ totals, isBalanced, isReadyToSubmit, submitting, onCancel }: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
      <div className="flex items-center gap-4">
        {isBalanced ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Balanced (Total: {fmt(totals.totalDebits)})</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Unbalanced (Difference: {fmt(totals.variance)})</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 md:flex-none px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isReadyToSubmit || submitting}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-6 rounded-xl transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {submitting ? 'Posting...' : 'Post Entry'}
        </button>
      </div>
    </div>
  );
}
