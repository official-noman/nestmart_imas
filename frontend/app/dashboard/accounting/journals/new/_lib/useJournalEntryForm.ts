import { useEffect, useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api, { getApiErrorData } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Account, Contact, JournalLineInput } from '../_types';
import { blankLine, safeNum } from './helpers';

export function useJournalEntryForm() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLineInput[]>([blankLine(), blankLine()]);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [accRes, ctRes] = await Promise.all([
          api.get('/api/v1/accounts/'),
          api.get('/api/v1/contacts/'),
        ]);
        const accData: Account[] = accRes.data.results ?? accRes.data;
        setAccounts(accData.filter(a => a.is_active));

        const ctData: Contact[] = ctRes.data.results ?? ctRes.data;
        setContacts(ctData.filter(c => c.is_active));
      } catch {
        setGlobalError('Failed to load accounts and contacts.');
      } finally {
        setLoadingData(false);
      }
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const addLine = () => setLines(prev => [...prev, blankLine()]);
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.uid !== id));

  const updateLine = (id: string, field: keyof JournalLineInput, value: string) => {
    setLines(prev => prev.map(l => l.uid === id ? { ...l, [field]: value } : l));
  };

  const totals = useMemo(() => {
    let totalDebits = 0;
    let totalCredits = 0;
    lines.forEach(l => {
      const amt = safeNum(l.amount);
      if (l.entry_type === 'DEBIT') totalDebits += amt;
      else totalCredits += amt;
    });
    return {
      totalDebits,
      totalCredits,
      variance: Math.abs(totalDebits - totalCredits)
    };
  }, [lines]);

  const isBalanced = totals.variance === 0 && totals.totalDebits > 0;
  const isReadyToSubmit = isBalanced && date && description && lines.every(l => l.account && safeNum(l.amount) > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    if (!isReadyToSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        date,
        description,
        source: 'Manual',
        lines: lines.map(l => ({
          account: parseInt(l.account),
          contact: l.contact ? parseInt(l.contact) : null,
          entry_type: l.entry_type,
          amount: l.amount
        }))
      };

      await api.post('/api/v1/journal-entries/', payload);
      router.push('/dashboard/accounting/journals');
    } catch (err) {
      const data = getApiErrorData(err);
      setGlobalError(data?.detail || JSON.stringify(data) || 'Failed to post entry.');
      setSubmitting(false);
    }
  };

  return {
    accounts, contacts, loadingData,
    date, setDate, description, setDescription,
    lines, addLine, removeLine, updateLine,
    submitting, globalError,
    totals, isBalanced, isReadyToSubmit,
    handleSubmit,
    goToList: () => router.push('/dashboard/accounting/journals'),
  };
}
