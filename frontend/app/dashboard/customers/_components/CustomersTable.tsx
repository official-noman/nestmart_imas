'use client';

import { Plus, Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import { Customer } from '../_types';
import { avatarFor, fmtUSD } from '../_lib/helpers';
import SkeletonRow from './SkeletonRow';

export default function CustomersTable({
  customers,
  filtered,
  loading,
  query,
  setQuery,
  onAdd,
}: {
  customers: Customer[];
  filtered: Customer[];
  loading: boolean;
  query: string;
  setQuery: (q: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="relative max-w-sm w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
          />
        </div>
        {!loading && (
          <p className="text-xs text-slate-400 shrink-0">
            {filtered.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {[
                { label: 'Customer', align: 'text-left', cls: 'pl-6 pr-4' },
                { label: 'Email', align: 'text-left', cls: 'px-4' },
                { label: 'Phone', align: 'text-left', cls: 'px-4' },
                { label: 'Tax ID', align: 'text-left', cls: 'px-4' },
                { label: 'Outstanding', align: 'text-right', cls: 'pl-4 pr-6' },
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
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <Users className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {query ? 'No customers match your search.' : 'No customers yet.'}
                    </p>
                    {!query && (
                      <button
                        onClick={onAdd}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                      >
                        <Plus className="h-4 w-4" /> Add your first customer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(c => {
                const { initials, palette } = avatarFor(c.name, c.id);
                const bal = parseFloat(String(c.outstanding_balance ?? 0)) || 0;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${palette}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                          {c.billing_address && (
                            <p className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 truncate max-w-[220px]">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {c.billing_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4">
                      {c.email
                        ? <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors group">
                            <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                            {c.email}
                          </a>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4">
                      {c.phone
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {c.phone}
                          </span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    {/* Tax ID */}
                    <td className="py-4 px-4">
                      {c.tax_id
                        ? <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                            {c.tax_id}
                          </span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    {/* Balance */}
                    <td className="py-4 pl-4 pr-6 text-right">
                      {bal > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
                          {fmtUSD(bal)}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">{fmtUSD(bal)}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
