'use client';

import { useChartOfAccounts } from './_lib/useChartOfAccounts';
import PageHeader from './_components/PageHeader';
import ErrorBanner from './_components/ErrorBanner';
import AccountsLoadingSkeleton from './_components/AccountsLoadingSkeleton';
import AccountsList from './_components/AccountsList';
import CreateAccountModal from './_components/CreateAccountModal';

export default function ChartOfAccountsPage() {
  const coa = useChartOfAccounts();

  return (
    <div className="space-y-6">
      <PageHeader onCreateClick={coa.openModal} />

      {coa.error && <ErrorBanner message={coa.error} />}

      {coa.loading ? (
        <AccountsLoadingSkeleton />
      ) : (
        <AccountsList groupedAccounts={coa.groupedAccounts} />
      )}

      {coa.showModal && (
        <CreateAccountModal
          form={coa.form}
          setForm={coa.setForm}
          submitting={coa.submitting}
          formError={coa.formError}
          onClose={coa.closeModal}
          onSubmit={coa.handleCreate}
        />
      )}
    </div>
  );
}
