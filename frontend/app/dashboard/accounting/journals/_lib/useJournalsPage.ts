import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Account, JournalEntry } from '../_types';

export function useJournalsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Record<number, Account>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jeRes, accRes] = await Promise.all([
        api.get('/api/v1/journal-entries/'),
        api.get('/api/v1/accounts/')
      ]);
      setEntries(jeRes.data.results ?? jeRes.data);

      const accData: Account[] = accRes.data.results ?? accRes.data;
      const accMap: Record<number, Account> = {};
      accData.forEach(a => { accMap[a.id] = a; });
      setAccounts(accMap);
    } catch {
      setError('Failed to load journal entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  return {
    entries,
    accounts,
    loading,
    error,
    expandedRows,
    toggleRow,
  };
}
