'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Building2, Percent, X, Plus, Loader2, AlertCircle, CheckCircle,
  ChevronRight, Save, Tag
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────── */
interface CompanyProfile {
  id?: number;
  name: string;
  currency_symbol: string;
  invoice_prefix: string;
  tax_id: string;
}

interface TaxRate {
  id: number;
  name: string;
  rate: string;
  is_active: boolean;
}

/* ─── Inline Toast ──────────────────────────────────────────────── */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-rose-50 text-rose-700 border-rose-200'
    }`}>
      {type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {message}
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-100 rounded-lg ${className}`} />;
}

export default function SettingsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /* ── Company Profile State ── */
  const [profile, setProfile] = useState<CompanyProfile>({ name: '', currency_symbol: '$', invoice_prefix: 'INV', tax_id: '' });
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  /* ── Tax Rates State ── */
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: '', rate: '' });
  const [taxSubmitting, setTaxSubmitting] = useState(false);
  const [taxFormError, setTaxFormError] = useState<string | null>(null);
  const [taxTogglingId, setTaxTogglingId] = useState<number | null>(null);

  /* ── Auth Guard ── */
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  /* ── Load Company Profile ── */
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

  /* ── Load Tax Rates ── */
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

  useEffect(() => { fetchProfile(); fetchTaxes(); }, [fetchProfile, fetchTaxes]);

  /* ── Company Save ── */
  const handleProfileSave = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.detail || data?.name?.[0] || 'Failed to save profile.';
      setProfileToast({ message: msg, type: 'error' });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileToast(null), 4000);
    }
  };

  /* ── Tax Modal Submit ── */
  const handleTaxSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      const data = err.response?.data;
      setTaxFormError(data?.detail || data?.name?.[0] || data?.rate?.[0] || 'Failed to create tax rate.');
    } finally {
      setTaxSubmitting(false);
    }
  };

  /* ── Tax Toggle Active ── */
  const handleTaxToggle = async (tax: TaxRate) => {
    setTaxTogglingId(tax.id);
    try {
      await api.patch(`/api/v1/settings/taxes/${tax.id}/`, { is_active: !tax.is_active });
      setTaxes((prev) => prev.map((t) => t.id === tax.id ? { ...t, is_active: !t.is_active } : t));
    } catch { /* silent */ } finally {
      setTaxTogglingId(null);
    }
  };

  /* ─── JSX ─────────────────────────────────────────────────────── */
  return (
    <div className="space-y-2">
      {/* Page Header */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <span>Dashboard</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-900 font-medium">Settings</span>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">System Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Configure your company profile and global tax rates.</p>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Card 1: Company Profile ─────────────────────────────── */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Company Profile</p>
              <p className="text-xs text-zinc-400">Business identity & invoice branding</p>
            </div>
          </div>

          {/* Card Body */}
          {profileLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="p-6 space-y-5">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Company Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nestmart Retail Ltd."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>

              {/* 2-col row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Currency Symbol</label>
                  <input
                    value={profile.currency_symbol}
                    onChange={(e) => setProfile((p) => ({ ...p, currency_symbol: e.target.value }))}
                    placeholder="$"
                    maxLength={5}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Invoice Prefix</label>
                  <input
                    value={profile.invoice_prefix}
                    onChange={(e) => setProfile((p) => ({ ...p, invoice_prefix: e.target.value }))}
                    placeholder="INV"
                    maxLength={10}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              {/* Tax ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Business Tax ID</label>
                <input
                  value={profile.tax_id}
                  onChange={(e) => setProfile((p) => ({ ...p, tax_id: e.target.value }))}
                  placeholder="e.g. GST-123456789"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-1">
                {profileToast ? <Toast {...profileToast} /> : <span />}
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
                >
                  {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {profileSaving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Card 2: Tax Configuration ───────────────────────────── */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Percent className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Tax Rates</p>
                <p className="text-xs text-zinc-400">GST, VAT, and custom tax configurations</p>
              </div>
            </div>
            <button
              onClick={() => { setShowTaxModal(true); setTaxFormError(null); setTaxForm({ name: '', rate: '' }); }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rate
            </button>
          </div>

          {/* Table */}
          <div className="divide-y divide-zinc-50">
            {taxLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : taxError ? (
              <div className="flex items-center gap-2 p-6 text-sm text-rose-600">
                <AlertCircle className="w-4 h-4" /> {taxError}
              </div>
            ) : taxes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-600">No tax rates configured</p>
                <p className="text-xs text-zinc-400">Click "Add Rate" to create your first tax rule.</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-3 px-6 py-2.5 bg-zinc-50/60">
                  <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400">Name</span>
                  <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 text-center">Rate</span>
                  <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 text-right">Status</span>
                </div>
                {taxes.map((tax) => (
                  <div key={tax.id} className="grid grid-cols-3 items-center px-6 py-3.5 hover:bg-zinc-50/50 transition-colors">
                    <span className="text-sm font-medium text-zinc-900 truncate">{tax.name}</span>
                    <span className="text-sm text-zinc-600 text-center font-mono">{tax.rate}%</span>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleTaxToggle(tax)}
                        disabled={taxTogglingId === tax.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          tax.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {taxTogglingId === tax.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <span className={`w-1.5 h-1.5 rounded-full ${tax.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        }
                        {tax.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tax Rate Modal ──────────────────────────────────────────── */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowTaxModal(false)}
          />

          {/* Modal card */}
          <div className="relative bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5 text-zinc-600" />
                </div>
                <p className="text-sm font-semibold text-zinc-900">New Tax Rate</p>
              </div>
              <button onClick={() => setShowTaxModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleTaxSubmit} className="p-5 space-y-4">
              {taxFormError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-700">{taxFormError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Tax Name</label>
                <input
                  value={taxForm.name}
                  onChange={(e) => { setTaxForm((f) => ({ ...f, name: e.target.value })); setTaxFormError(null); }}
                  placeholder="e.g. GST 18%, VAT 15%"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxForm.rate}
                    onChange={(e) => { setTaxForm((f) => ({ ...f, rate: e.target.value })); setTaxFormError(null); }}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 pr-8 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taxSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  {taxSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {taxSubmitting ? 'Creating…' : 'Create Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
