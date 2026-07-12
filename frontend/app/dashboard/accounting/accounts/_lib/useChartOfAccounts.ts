import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Account, AccountForm } from '../_types';
import { groupAccountsByType } from './helpers';

export function useChartOfAccounts() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AccountForm>({ code: '', name: '', account_type: 'Asset' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/accounts/');
      setAccounts(res.data.results ?? res.data);
    } catch {
      setError('Failed to load chart of accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAccounts();
  }, [isAuthenticated]);

  const openModal = () => {
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (!submitting) setShowModal(false);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code || !form.name) {
      setFormError('Code and Name are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/v1/accounts/', { ...form, is_active: true });
      setShowModal(false);
      setForm({ code: '', name: '', account_type: 'Asset' });
      fetchAccounts();
    } catch (err: any) {
      const data = err.response?.data;
      setFormError(data?.detail || data?.code?.[0] || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedAccounts = groupAccountsByType(accounts);

  return {
    accounts,
    loading,
    error,
    showModal,
    setShowModal,
    form,
    setForm,
    submitting,
    formError,
    openModal,
    closeModal,
    handleCreate,
    groupedAccounts,
  };
}
