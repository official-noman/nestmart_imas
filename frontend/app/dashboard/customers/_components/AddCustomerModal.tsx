'use client';

import React from 'react';
import { X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const inputBase =
  'block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 shadow-sm transition-all ' +
  'hover:border-zinc-400 ' +
  'focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10';

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
      {children}
      {req && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

interface CustomerFormState {
  name: string;
  email: string;
  phone: string;
  tax_id: string;
  billing_address: string;
}

export default function AddCustomerModal({
  isOpen,
  saving,
  formError,
  success,
  form,
  onClose,
  onInputChange,
  onSubmit,
}: {
  isOpen: boolean;
  saving: boolean;
  formError: string | null;
  success: boolean;
  form: CustomerFormState;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog panel — entry animation via Tailwind arbitrary */}
      <div
        className="
          relative w-full max-w-lg
          rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add New Customer</h2>
            <p className="mt-0.5 text-xs text-slate-500">Fill in the details below to create a new contact.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
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
              <p className="text-xs font-medium text-emerald-700">Customer created successfully!</p>
            </div>
          )}

          {/* Name */}
          <div>
            <Label req>Customer Name</Label>
            <input
              id="name" name="name" type="text" required
              placeholder="Acme Corporation"
              value={form.name} onChange={onInputChange}
              className={inputBase}
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Email Address</Label>
              <input
                id="email" name="email" type="email"
                placeholder="hello@acme.com"
                value={form.email} onChange={onInputChange}
                className={inputBase}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input
                id="phone" name="phone" type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone} onChange={onInputChange}
                className={inputBase}
              />
            </div>
          </div>

          {/* Tax ID */}
          <div>
            <Label>Tax ID / VAT</Label>
            <input
              id="tax_id" name="tax_id" type="text"
              placeholder="US-123456789"
              value={form.tax_id} onChange={onInputChange}
              className={inputBase}
            />
          </div>

          {/* Billing address */}
          <div>
            <Label req>Billing Address</Label>
            <textarea
              id="billing_address" name="billing_address"
              rows={3} required
              placeholder="123 Main St, New York, NY 10001, USA"
              value={form.billing_address} onChange={onInputChange}
              className={`${inputBase} resize-none`}
            />
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
                : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
