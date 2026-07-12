'use client';

import { AlertCircle } from 'lucide-react';

import { useInvoiceForm } from './_lib/useInvoiceForm';
import PageHeader from './_components/PageHeader';
import SuccessOverlay from './_components/SuccessOverlay';
import InvoiceHeaderCard from './_components/InvoiceHeaderCard';
import LineItemsCard from './_components/LineItemsCard';
import TotalsAndActions from './_components/TotalsAndActions';

export default function NewInvoicePage() {
  const form = useInvoiceForm();

  if (form.success) return <SuccessOverlay />;

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 max-w-5xl">
      <PageHeader onNavigateToList={form.goToList} />

      {form.globalError && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{form.globalError}</p>
        </div>
      )}

      <InvoiceHeaderCard
        contacts={form.contacts}
        dataLoading={form.dataLoading}
        customer={form.customer}
        setCustomer={form.setCustomer}
        status={form.status}
        setStatus={form.setStatus}
        issueDate={form.issueDate}
        setIssueDate={form.setIssueDate}
        dueDate={form.dueDate}
        setDueDate={form.setDueDate}
        fieldErrors={form.fieldErrors}
        clearFieldError={form.clearFieldError}
      />

      <LineItemsCard
        items={form.items}
        lines={form.lines}
        dataLoading={form.dataLoading}
        fieldErrors={form.fieldErrors}
        addLine={form.addLine}
        removeLine={form.removeLine}
        updateLine={form.updateLine}
      />

      <TotalsAndActions
        totals={form.totals}
        submitting={form.submitting}
        dataLoading={form.dataLoading}
        onCancel={form.goToList}
      />
    </form>
  );
}
