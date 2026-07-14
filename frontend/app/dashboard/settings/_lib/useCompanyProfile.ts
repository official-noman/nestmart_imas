import { startTransition, useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import api, { getApiErrorData } from '@/lib/api';
import { CompanyProfile, ToastMessage } from '../_types';

export function useCompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile>({ name: '', currency_symbol: '$', invoice_prefix: 'INV', tax_id: '' });
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState<ToastMessage | null>(null);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/api/v1/settings/company/');
      const data: CompanyProfile[] = res.data.results ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        setProfileId(first.id ?? null);
        setProfile({ name: first.name, currency_symbol: first.currency_symbol, invoice_prefix: first.invoice_prefix, tax_id: first.tax_id });
      }
    } catch {
      // Profile may not exist yet — silently fail
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { startTransition(() => { fetchProfile(); }); }, [fetchProfile]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileToast(null);
    try {
      if (profileId) {
        await api.patch(`/api/v1/settings/company/${profileId}/`, profile);
      } else {
        const res = await api.post('/api/v1/settings/company/', profile);
        setProfileId(res.data.id);
      }
      setProfileToast({ message: 'Company profile saved.', type: 'success' });
    } catch (err) {
      const data = getApiErrorData(err);
      const msg = data?.detail || data?.name?.[0] || 'Failed to save profile.';
      setProfileToast({ message: msg, type: 'error' });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileToast(null), 4000);
    }
  };

  return {
    profile, setProfile,
    profileLoading, profileSaving, profileToast,
    handleProfileSave,
  };
}
