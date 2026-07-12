'use client';

import { AlertCircle } from 'lucide-react';

import { usePaymentsPage } from './_lib/usePaymentsPage';
import PageHeader from './_components/PageHeader';
import PaymentsTable from './_components/PaymentsTable';
import RecordPaymentModal from './_components/RecordPaymentModal';

export default function PaymentsPage() {
  const p = usePaymentsPage();

  return (
    <div className="space-y-6">
      <PageHeader onRecordPayment={p.handleModalOpen} />

      {p.error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {p.error}
        </div>
      )}

      <PaymentsTable payments={p.payments} contacts={p.contacts} loading={p.loading} />

      {p.showModal && (
        <RecordPaymentModal
          contacts={p.contacts}
          modalForm={p.modalForm}
          setModalForm={p.setModalForm}
          onClose={() => p.setShowModal(false)}
          onCustomerChange={p.handleCustomerChange}
          allocations={p.allocations}
          onAllocationChange={p.handleAllocationChange}
          submitting={p.submitting}
          modalError={p.modalError}
          selectedCustomerId={p.selectedCustomerId}
          customerInvoices={p.customerInvoices}
          totalAllocated={p.totalAllocated}
          unallocatedBalance={p.unallocatedBalance}
          isOverAllocated={p.isOverAllocated}
          onSubmit={p.handleSubmit}
        />
      )}
    </div>
  );
}
