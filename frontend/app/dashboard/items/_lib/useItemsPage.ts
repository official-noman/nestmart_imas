import { useEffect, useState, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Item } from '../_types';
import { INITIAL_FORM, parseApiError } from './helpers';

export function useItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filtered, setFiltered] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const isAuth = useAuthStore(s => s.isAuthenticated);
  const router = useRouter();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/api/v1/items/');
      const data: Item[] = res.data.results ?? res.data;
      setItems(data);
      setFiltered(data);
    } catch {
      setFetchError('Unable to load items. Check your connection and try again.');
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
    if (!query.trim()) { setFiltered(items); return; }
    const q = query.toLowerCase();
    setFiltered(
      items.filter(i =>
        i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
      ),
    );
  }, [query, items]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = () => { setForm(INITIAL_FORM); setFormError(null); setSuccess(false); setIsOpen(true); };
  const closeModal = () => { if (!saving) setIsOpen(false); };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/api/v1/items/', {
        ...form,
        unit_price: parseFloat(form.unit_price as string) || 0,
        tax_rate: parseFloat(form.tax_rate as string) || 0,
        stock_quantity: parseInt(String(form.stock_quantity), 10) || 0,
      });
      setSuccess(true);
      setTimeout(() => { setIsOpen(false); load(); }, 1000);
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const lowStock = items.filter(i => i.track_stock && i.stock_quantity <= 5).length;
  const tracked = items.filter(i => i.track_stock).length;

  return {
    items, filtered, query, setQuery, loading, fetchError, load,
    isOpen, saving, formError, success, form, setForm,
    openModal, closeModal, handleInput, submit,
    lowStock, tracked,
  };
}
