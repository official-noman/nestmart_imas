'use client';

import { AlertCircle } from 'lucide-react';

import { useItemsPage } from './_lib/useItemsPage';
import PageHeader from './_components/PageHeader';
import KpiCards from './_components/KpiCards';
import ItemsTable from './_components/ItemsTable';
import ItemFormModal from './_components/ItemFormModal';

export default function ItemsPage() {
  const p = useItemsPage();

  return (
    <div className="space-y-7">
      <PageHeader onRefresh={p.load} onAdd={p.openModal} />

      <KpiCards items={p.items} loading={p.loading} tracked={p.tracked} lowStock={p.lowStock} />

      {p.fetchError && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <p className="flex-1 text-sm text-rose-700">{p.fetchError}</p>
          <button onClick={p.load} className="text-xs font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      <ItemsTable
        filtered={p.filtered}
        items={p.items}
        query={p.query}
        setQuery={p.setQuery}
        loading={p.loading}
        onAdd={p.openModal}
      />

      <ItemFormModal
        isOpen={p.isOpen}
        saving={p.saving}
        formError={p.formError}
        success={p.success}
        form={p.form}
        setForm={p.setForm}
        onClose={p.closeModal}
        onSubmit={p.submit}
        onInput={p.handleInput}
      />
    </div>
  );
}
