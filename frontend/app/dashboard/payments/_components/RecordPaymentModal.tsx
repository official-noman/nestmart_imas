import type { FormEvent } from 'react';
import { AlertCircle, CheckCircle, CreditCard, Loader2, X } from 'lucide-react';
import { Contact, InvoiceWithBalance, ModalForm } from '../_types';
import { fmt } from '../_lib/helpers';
import AllocationTable from './AllocationTable';

interface Props {
  contacts: Record<number, Contact>;
  modalForm: ModalForm;
  setModalForm: (v: ModalForm) => void;
  onClose: () => void;
  onCustomerChange: (customerId: string) => void;
  allocations: Record<number, string>;
  onAllocationChange: (invoiceId: number, value: string) => void;
  submitting: boolean;
  modalError: string | null;
  selectedCustomerId: number;
  customerInvoices: InvoiceWithBalance[];
  totalAllocated: number;
  unallocatedBalance: number;
  isOverAllocated: boolean;
  onSubmit: (e: FormEvent) => void;
}

export default function RecordPaymentModal({
  contacts, modalForm, setModalForm, onClose, onCustomerChange,
  allocations, onAllocationChange, submitting, modalError,
  selectedCustomerId, customerInvoices, totalAllocated, unallocatedBalance, isOverAllocated,
  onSubmit,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-zinc-600" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">Record Payment</h2>
          </div>
          <button onClick={onClose} disabled={submitting} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
          <form id="payment-form" onSubmit={onSubmit} className="space-y-6">

            {modalError && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-rose-700">{modalError}</p>
              </div>
            )}

            {/* Primary Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-white border border-zinc-200 rounded-xl">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Customer</label>
                <select
                  value={modalForm.customer}
                  onChange={(e) => onCustomerChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                >
                  <option value="">Select a customer…</option>
                  {Object.values(contacts).filter(c => c.is_active && c.contact_type === 'Customer').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Amount Received</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                  <input
                    type="number" min="0" step="0.01" required
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2.5 text-sm font-mono rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Method</label>
                <select
                  value={modalForm.payment_method}
                  onChange={(e) => setModalForm({ ...modalForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Reference / Txn ID</label>
                <input
                  type="text"
                  value={modalForm.reference}
                  onChange={(e) => setModalForm({ ...modalForm, reference: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Payment Date</label>
                <input
                  type="date" required
                  value={modalForm.payment_date}
                  onChange={(e) => setModalForm({ ...modalForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
            </div>

            {/* Allocation Section */}
            <AllocationTable
              selectedCustomerId={selectedCustomerId}
              customerInvoices={customerInvoices}
              allocations={allocations}
              onAllocationChange={onAllocationChange}
            />

          </form>
        </div>

        {/* Modal Footer (Tracker & Submit) */}
        <div className="p-5 border-t border-zinc-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-zinc-500">Total Allocated:</span>
              <span className="font-mono font-semibold text-zinc-900">{fmt(totalAllocated)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-zinc-500">Unallocated Balance:</span>
              <span className={`font-mono font-semibold ${isOverAllocated ? 'text-rose-600' : 'text-emerald-600'}`}>
                {fmt(unallocatedBalance)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 md:flex-none px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              form="payment-form"
              type="submit"
              disabled={submitting || isOverAllocated}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-6 rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Confirm Payment'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
