import { useState } from 'react';
import api from '@/lib/api';
import { INITIAL_FORM, parseApiError } from './helpers';

export function useCustomerForm(onSaved: () => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const openModal = () => { setForm(INITIAL_FORM); setFormError(null); setSuccess(false); setIsOpen(true); };
  const closeModal = () => { if (!saving) setIsOpen(false); };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/api/v1/contacts/', { ...form, contact_type: 'Customer' });
      setSuccess(true);
      setTimeout(() => { setIsOpen(false); onSaved(); }, 1000);
    } catch (err: any) {
      setFormError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    isOpen, saving, formError, success, form,
    openModal, closeModal, handleInput, submit,
  };
}
