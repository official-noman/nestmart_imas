import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Customer } from '../_types';

export function useCustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isAuth = useAuthStore(s => s.isAuthenticated);
  const router = useRouter();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/api/v1/contacts/');
      const data: Customer[] = res.data.results ?? res.data;
      setCustomers(data);
      setFiltered(data);
    } catch {
      setFetchError('Unable to load customers. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) { router.push('/login'); return; }
    load();
  }, [isAuth, router, load]);

  // ── Client-side search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setFiltered(customers); return; }
    const q = query.toLowerCase();
    setFiltered(
      customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.tax_id?.toLowerCase().includes(q),
      ),
    );
  }, [query, customers]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalBalance = customers.reduce(
    (s, c) => s + (parseFloat(String(c.outstanding_balance ?? 0)) || 0),
    0,
  );

  return {
    customers, filtered, query, setQuery,
    loading, fetchError, load,
    totalBalance,
  };
}
