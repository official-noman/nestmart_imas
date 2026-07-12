'use client';

import { AlertCircle } from 'lucide-react';

import { useJournalsPage } from './_lib/useJournalsPage';
import JournalsPageHeader from './_components/JournalsPageHeader';
import JournalEntriesTable from './_components/JournalEntriesTable';

export default function JournalsPage() {
  const { entries, accounts, loading, error, expandedRows, toggleRow } = useJournalsPage();

  return (
    <div className="space-y-6">
      <JournalsPageHeader />

      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <JournalEntriesTable
        entries={entries}
        accounts={accounts}
        loading={loading}
        expandedRows={expandedRows}
        toggleRow={toggleRow}
      />
    </div>
  );
}
