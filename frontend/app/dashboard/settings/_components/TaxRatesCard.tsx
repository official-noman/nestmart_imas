import { AlertCircle, Loader2, Percent, Plus, Tag } from 'lucide-react';
import { TaxRate } from '../_types';
import Skeleton from './Skeleton';

interface TaxRatesCardProps {
  taxes: TaxRate[];
  taxLoading: boolean;
  taxError: string | null;
  taxTogglingId: number | null;
  onAddClick: () => void;
  onToggle: (tax: TaxRate) => void;
}

export default function TaxRatesCard({
  taxes, taxLoading, taxError, taxTogglingId, onAddClick, onToggle,
}: TaxRatesCardProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Percent className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Tax Rates</p>
            <p className="text-xs text-zinc-400">GST, VAT, and custom tax configurations</p>
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Rate
        </button>
      </div>

      {/* Table */}
      <div className="divide-y divide-zinc-50">
        {taxLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : taxError ? (
          <div className="flex items-center gap-2 p-6 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4" /> {taxError}
          </div>
        ) : taxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
              <Tag className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600">No tax rates configured</p>
            <p className="text-xs text-zinc-400">Click &quot;Add Rate&quot; to create your first tax rule.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-3 px-6 py-2.5 bg-zinc-50/60">
              <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400">Name</span>
              <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 text-center">Rate</span>
              <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 text-right">Status</span>
            </div>
            {taxes.map((tax) => (
              <div key={tax.id} className="grid grid-cols-3 items-center px-6 py-3.5 hover:bg-zinc-50/50 transition-colors">
                <span className="text-sm font-medium text-zinc-900 truncate">{tax.name}</span>
                <span className="text-sm text-zinc-600 text-center font-mono">{tax.rate}%</span>
                <div className="flex justify-end">
                  <button
                    onClick={() => onToggle(tax)}
                    disabled={taxTogglingId === tax.id}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      tax.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {taxTogglingId === tax.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <span className={`w-1.5 h-1.5 rounded-full ${tax.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    }
                    {tax.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
