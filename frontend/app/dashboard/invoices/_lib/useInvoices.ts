import { startTransition, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Invoice, Contact } from '../_types';

export function useInvoices() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, ctRes] = await Promise.all([
        api.get('/api/v1/invoices/'),
        api.get('/api/v1/contacts/'),
      ]);

      // Build a map of contact id → name
      const ctData: Contact[] = ctRes.data.results ?? ctRes.data;
      const ctMap: Record<number, string> = {};
      ctData.forEach((c) => { ctMap[c.id] = c.name; });
      setContacts(ctMap);

      const invData: Invoice[] = invRes.data.results ?? invRes.data;
      setInvoices(invData);
    } catch {
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    startTransition(() => { fetchAll(); });
  }, [isAuthenticated, router, fetchAll]);

  /* ── KPI counts for header strip ── */
  const kpi = {
    total: invoices.length,
    overdue: invoices.filter((i) => i.status === 'Overdue').length,
    paid: invoices.filter((i) => i.status === 'Paid').length,
    draft: invoices.filter((i) => i.status === 'Draft').length,
  };

  return {
    invoices,
    contacts,
    loading,
    error,
    kpi,
    fetchAll,
  };
}
