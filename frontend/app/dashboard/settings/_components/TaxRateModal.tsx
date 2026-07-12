import type { FormEvent } from 'react';
import { AlertCircle, Loader2, Percent, Plus, X } from 'lucide-react';

interface TaxRateModalProps {
  show: boolean;
  onClose: () => void;
  taxForm: { name: string; rate: string };
  setTaxForm: React.Dispatch<React.SetStateAction<{ name: string; rate: string }>>;
  taxFormError: string | null;
  setTaxFormError: (error: string | null) => void;
  taxSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
}

export default function TaxRateModal({
  show, onClose, taxForm, setTaxForm, taxFormError, setTaxFormError, taxSubmitting, onSubmit,
}: TaxRateModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">New Tax Rate</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Modal form */}
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {taxFormError && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-700">{taxFormError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Tax Name</label>
            <input
              value={taxForm.name}
              onChange={(e) => { setTaxForm((f) => ({ ...f, name: e.target.value })); setTaxFormError(null); }}
              placeholder="e.g. GST 18%, VAT 15%"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxForm.rate}
                onChange={(e) => { setTaxForm((f) => ({ ...f, rate: e.target.value })); setTaxFormError(null); }}
                placeholder="0.00"
                className="w-full px-3 py-2.5 pr-8 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">%</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={taxSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {taxSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {taxSubmitting ? 'Creating…' : 'Create Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
