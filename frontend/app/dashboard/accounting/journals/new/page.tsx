'use client';

import { AlertCircle } from 'lucide-react';

import { useJournalEntryForm } from './_lib/useJournalEntryForm';
import PageHeader from './_components/PageHeader';
import EntryDetailsCard from './_components/EntryDetailsCard';
import JournalLinesCard from './_components/JournalLinesCard';
import BalanceSummaryAndActions from './_components/BalanceSummaryAndActions';

export default function NewJournalEntryPage() {
  const form = useJournalEntryForm();

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      <PageHeader onNavigateToList={form.goToList} />

      {form.globalError && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{form.globalError}</p>
        </div>
      )}

      <EntryDetailsCard
        date={form.date}
        setDate={form.setDate}
        description={form.description}
        setDescription={form.setDescription}
      />

      <JournalLinesCard
        accounts={form.accounts}
        contacts={form.contacts}
        lines={form.lines}
        addLine={form.addLine}
        removeLine={form.removeLine}
        updateLine={form.updateLine}
      />

      <BalanceSummaryAndActions
        totals={form.totals}
        isBalanced={form.isBalanced}
        isReadyToSubmit={form.isReadyToSubmit}
        submitting={form.submitting}
        onCancel={form.goToList}
      />
    </form>
  );
}
