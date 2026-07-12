import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import api, { getApiErrorData } from '@/lib/api';
import { TaxRate } from '../_types';

export function useTaxRates() {
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: '', rate: '' });
  const [taxSubmitting, setTaxSubmitting] = useState(false);
  const [taxFormError, setTaxFormError] = useState<string | null>(null);
  const [taxTogglingId, setTaxTogglingId] = useState<number | null>(null);

  const fetchTaxes = useCallback(async () => {
    setTaxLoading(true);
    setTaxError(null);
    try {
      const res = await api.get('/api/v1/settings/taxes/');
      setTaxes(res.data.results ?? res.data);
    } catch {
      setTaxError('Failed to load tax rates.');
    } finally {
      setTaxLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  const openTaxModal = () => {
    setShowTaxModal(true);
    setTaxFormError(null);
    setTaxForm({ name: '', rate: '' });
  };

  const closeTaxModal = () => setShowTaxModal(false);

  const handleTaxSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taxForm.name.trim()) { setTaxFormError('Tax name is required.'); return; }
    if (!taxForm.rate || isNaN(parseFloat(taxForm.rate))) { setTaxFormError('Enter a valid rate.'); return; }
    setTaxSubmitting(true);
    setTaxFormError(null);
    try {
      await api.post('/api/v1/settings/taxes/', { ...taxForm, rate: parseFloat(taxForm.rate), is_active: true });
      setShowTaxModal(false);
      setTaxForm({ name: '', rate: '' });
      fetchTaxes();
    } catch (err) {
      const data = getApiErrorData(err);
      setTaxFormError(data?.detail || data?.name?.[0] || data?.rate?.[0] || 'Failed to create tax rate.');
    } finally {
      setTaxSubmitting(false);
    }
  };

  const handleTaxToggle = async (tax: TaxRate) => {
    setTaxTogglingId(tax.id);
    try {
      await api.patch(`/api/v1/settings/taxes/${tax.id}/`, { is_active: !tax.is_active });
      setTaxes((prev) => prev.map((t) => t.id === tax.id ? { ...t, is_active: !t.is_active } : t));
    } catch { /* silent */ } finally {
      setTaxTogglingId(null);
    }
  };

  return {
    taxes, taxLoading, taxError,
    showTaxModal, openTaxModal, closeTaxModal,
    taxForm, setTaxForm,
    taxSubmitting, taxFormError, setTaxFormError,
    taxTogglingId,
    handleTaxSubmit, handleTaxToggle,
  };
}
