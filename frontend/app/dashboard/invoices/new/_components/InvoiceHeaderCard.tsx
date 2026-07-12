import { ChevronDown, Calendar, FileText, User } from 'lucide-react';
import { Contact } from '../_types';
import { FieldLabel, SkeletonInput } from './FormPrimitives';

interface Props {
  contacts: Contact[];
  dataLoading: boolean;
  customer: number | '';
  setCustomer: (v: number) => void;
  status: 'Draft' | 'Sent';
  setStatus: (v: 'Draft' | 'Sent') => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  fieldErrors: Record<string, string>;
  clearFieldError: (field: string) => void;
}

export default function InvoiceHeaderCard({
  contacts, dataLoading, customer, setCustomer, status, setStatus,
  issueDate, setIssueDate, dueDate, setDueDate, fieldErrors, clearFieldError,
}: Props) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-zinc-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Invoice Details</p>
          <p className="text-xs text-zinc-400">Customer, dates, and initial status</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Customer */}
        <div className="lg:col-span-2">
          <FieldLabel>Customer *</FieldLabel>
          {dataLoading ? <SkeletonInput /> : (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <select
                  value={customer}
                  onChange={(e) => { setCustomer(Number(e.target.value)); clearFieldError('customer'); }}
                  className={`w-full appearance-none pl-9 pr-9 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.customer ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                >
                  <option value="">Select a customer…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {fieldErrors.customer && <p className="text-xs text-rose-600 mt-1">{fieldErrors.customer}</p>}
            </>
          )}
        </div>

        {/* Status */}
        <div>
          <FieldLabel>Status</FieldLabel>
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Draft' | 'Sent')}
              className="w-full appearance-none px-3 pr-9 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
        </div>

        {/* Spacer for alignment */}
        <div className="hidden lg:block" />

        {/* Issue Date */}
        <div>
          <FieldLabel>Issue Date *</FieldLabel>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="date"
              value={issueDate}
              onChange={(e) => { setIssueDate(e.target.value); clearFieldError('issue_date'); }}
              className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.issue_date ? 'border-rose-300' : 'border-zinc-200'}`}
            />
          </div>
          {fieldErrors.issue_date && <p className="text-xs text-rose-600 mt-1">{fieldErrors.issue_date}</p>}
        </div>

        {/* Due Date */}
        <div>
          <FieldLabel>Due Date *</FieldLabel>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); clearFieldError('due_date'); }}
              className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${fieldErrors.due_date ? 'border-rose-300' : 'border-zinc-200'}`}
            />
          </div>
          {fieldErrors.due_date && <p className="text-xs text-rose-600 mt-1">{fieldErrors.due_date}</p>}
        </div>
      </div>
    </div>
  );
}
