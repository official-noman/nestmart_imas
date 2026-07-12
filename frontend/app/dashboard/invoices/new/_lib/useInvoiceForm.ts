import { useEffect, useState, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Contact, Item, LineItem } from '../_types';
import { blankLine, safeNum } from './helpers';

export function useInvoiceForm() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemMap, setItemMap] = useState<Record<number, Item>>({});
  const [dataLoading, setDataLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [customer, setCustomer] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(thirtyDays);
  const [status, setStatus] = useState<'Draft' | 'Sent'>('Draft');

  const [lines, setLines] = useState<LineItem[]>([blankLine()]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) =>
    setFieldErrors((p) => ({ ...p, [field]: '' }));

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [ctRes, itRes] = await Promise.all([
          api.get('/api/v1/contacts/'),
          api.get('/api/v1/items/'),
        ]);
        const ctAll: Contact[] = ctRes.data.results ?? ctRes.data;
        setContacts(ctAll.filter((c) => c.is_active));

        const itAll: Item[] = itRes.data.results ?? itRes.data;
        setItems(itAll);
        const map: Record<number, Item> = {};
        itAll.forEach((it) => { map[it.id] = it; });
        setItemMap(map);
      } catch {
        setGlobalError('Failed to load customers or items. Please refresh.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0, discountTotal = 0, taxTotal = 0;
    lines.forEach((l) => {
      const qty = safeNum(l.quantity);
      const up = safeNum(l.unit_price);
      const dis = safeNum(l.discount);
      const tr = safeNum(l.tax_rate);
      const lineSub = qty * up;
      const taxable = lineSub - dis;
      const lineTax = taxable * (tr / 100);
      subtotal += lineSub;
      discountTotal += dis;
      taxTotal += lineTax;
    });
    return {
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal: subtotal - discountTotal + taxTotal,
    };
  }, [lines]);

  const addLine = () => setLines((prev) => [...prev, blankLine()]);

  const removeLine = (uid: string) =>
    setLines((prev) => prev.filter((l) => l.uid !== uid));

  const updateLine = useCallback(
    (uid: string, field: keyof LineItem, value: string | number) => {
      setLines((prev) =>
        prev.map((l) => {
          if (l.uid !== uid) return l;
          if (field === 'item') {
            // Auto-fill price + tax_rate from item catalog
            const it = itemMap[Number(value)];
            return it
              ? { ...l, item: Number(value), unit_price: it.unit_price, tax_rate: it.tax_rate }
              : { ...l, item: Number(value) };
          }
          return { ...l, [field]: value };
        })
      );
    },
    [itemMap]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!customer) errs.customer = 'Please select a customer.';
    if (!issueDate) errs.issue_date = 'Issue date is required.';
    if (!dueDate) errs.due_date = 'Due date is required.';
    if (lines.some((l) => !l.item)) errs.lines = 'All line items must have an item selected.';
    if (lines.some((l) => safeNum(l.unit_price) <= 0)) errs.unit_price = 'Unit price must be greater than zero for all lines.';

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        customer,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        lines: lines.map(({ uid: _uid, item, quantity, unit_price, discount, tax_rate }) => ({
          item,
          quantity: Number(quantity),
          unit_price,
          discount,
          tax_rate,
        })),
      };

      await api.post('/api/v1/invoices/', payload);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/invoices'), 1600);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const { detail, non_field_errors, ...rest } = data;
        if (detail) setGlobalError(detail);
        else if (non_field_errors) setGlobalError(non_field_errors.join(' '));
        else setGlobalError(JSON.stringify(rest));
      } else {
        setGlobalError('Failed to create invoice. Please check all fields and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    contacts, items, dataLoading,
    customer, setCustomer, issueDate, setIssueDate, dueDate, setDueDate, status, setStatus,
    lines, addLine, removeLine, updateLine,
    submitting, success, globalError, fieldErrors, clearFieldError,
    totals, handleSubmit,
    goToList: () => router.push('/dashboard/invoices'),
  };
}
