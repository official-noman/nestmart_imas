import { InvoiceWithBalance } from '../_types';
import { fmt } from '../_lib/helpers';

interface Props {
  selectedCustomerId: number;
  customerInvoices: InvoiceWithBalance[];
  allocations: Record<number, string>;
  onAllocationChange: (invoiceId: number, value: string) => void;
}

export default function AllocationTable({
  selectedCustomerId, customerInvoices, allocations, onAllocationChange,
}: Props) {
  if (!selectedCustomerId) return null;

  if (customerInvoices.length === 0) {
    return (
      <div className="p-4 text-center bg-zinc-100 rounded-xl text-sm text-zinc-500">
        No outstanding invoices found for this customer.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900">Allocate to Invoices</h3>
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50/80 border-b border-zinc-100 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Invoice #</th>
              <th className="px-4 py-3 text-right">Grand Total</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-right w-32">Allocate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {customerInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-mono font-medium text-zinc-900">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-right text-zinc-500">{fmt(inv.grand_total)}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-700">{fmt(inv.outstanding_balance || inv.grand_total)}</td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number" min="0" step="0.01"
                    value={allocations[inv.id] || ''}
                    onChange={(e) => onAllocationChange(inv.id, e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2 py-1.5 text-right text-sm font-mono rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
