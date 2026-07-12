'use client';

import { useCustomerList } from './_lib/useCustomerList';
import { useCustomerForm } from './_lib/useCustomerForm';
import PageHeader from './_components/PageHeader';
import KpiCards from './_components/KpiCards';
import FetchErrorBanner from './_components/FetchErrorBanner';
import CustomersTable from './_components/CustomersTable';
import AddCustomerModal from './_components/AddCustomerModal';

export default function CustomersPage() {
  const list = useCustomerList();
  const modal = useCustomerForm(list.load);

  return (
    <div className="space-y-7">
      <PageHeader onRefresh={list.load} onAdd={modal.openModal} />

      <KpiCards
        loading={list.loading}
        totalCustomers={list.customers.length}
        totalBalance={list.totalBalance}
      />

      {list.fetchError && (
        <FetchErrorBanner fetchError={list.fetchError} onRetry={list.load} />
      )}

      <CustomersTable
        customers={list.customers}
        filtered={list.filtered}
        loading={list.loading}
        query={list.query}
        setQuery={list.setQuery}
        onAdd={modal.openModal}
      />

      <AddCustomerModal
        isOpen={modal.isOpen}
        saving={modal.saving}
        formError={modal.formError}
        success={modal.success}
        form={modal.form}
        onClose={modal.closeModal}
        onInputChange={modal.handleInput}
        onSubmit={modal.submit}
      />
    </div>
  );
}
