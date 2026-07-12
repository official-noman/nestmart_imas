import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { ItemForm } from '../_types';
import { inputBase } from '../_lib/helpers';

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
      {children}
      {req && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function Toggle({
  checked, onChange, id,
}: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2
        focus-visible:ring-zinc-900 focus-visible:ring-offset-2
        ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

interface Props {
  isOpen: boolean;
  saving: boolean;
  formError: string | null;
  success: boolean;
  form: ItemForm;
  setForm: React.Dispatch<React.SetStateAction<ItemForm>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ItemFormModal({
  isOpen, saving, formError, success, form, setForm, onClose, onSubmit, onInput,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        className="
          relative w-full max-w-lg
          rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5
          animate-in fade-in zoom-in-95 duration-200
          max-h-[90vh] overflow-y-auto
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add New Item</h2>
            <p className="mt-0.5 text-xs text-slate-500">Define a new product or service in your catalog.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
          {/* API error */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <p className="text-xs text-rose-700">{formError}</p>
            </div>
          )}

          {/* Inline success */}
          {success && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-medium text-emerald-700">Item created successfully!</p>
            </div>
          )}

          {/* Item Name */}
          <div>
            <Label req>Item Name</Label>
            <input
              id="name" name="name" type="text" required
              placeholder="Premium Widget"
              value={form.name} onChange={onInput}
              className={inputBase}
            />
          </div>

          {/* SKU + Unit Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label req>SKU</Label>
              <input
                id="sku" name="sku" type="text" required
                placeholder="WDG-001"
                value={form.sku} onChange={onInput}
                className={inputBase}
              />
            </div>
            <div>
              <Label req>Unit Price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                <input
                  id="unit_price" name="unit_price" type="number"
                  step="0.01" min="0" required placeholder="0.00"
                  value={form.unit_price} onChange={onInput}
                  className={`${inputBase} pl-6`}
                />
              </div>
            </div>
          </div>

          {/* Tax Rate */}
          <div>
            <Label>Tax Rate</Label>
            <div className="relative">
              <input
                id="tax_rate" name="tax_rate" type="number"
                step="0.01" min="0" max="100" placeholder="0.00"
                value={form.tax_rate} onChange={onInput}
                className={`${inputBase} pr-8`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
            </div>
          </div>

          {/* Track Stock Toggle */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Track Inventory Stock</p>
                <p className="mt-0.5 text-xs text-slate-500">Enable to manage quantities and receive low-stock alerts.</p>
              </div>
              <Toggle
                id="track_stock"
                checked={form.track_stock}
                onChange={v => setForm(p => ({ ...p, track_stock: v }))}
              />
            </div>

            {/* Conditional stock qty */}
            {form.track_stock && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <Label>Initial Stock Quantity</Label>
                <input
                  id="stock_quantity" name="stock_quantity" type="number" min="0"
                  value={form.stock_quantity} onChange={onInput}
                  className={`${inputBase} max-w-[140px]`}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-95 disabled:opacity-60 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                : success
                ? <><CheckCircle2 className="h-4 w-4" />Saved!</>
                : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
