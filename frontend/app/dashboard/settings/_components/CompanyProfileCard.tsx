import type { FormEvent } from 'react';
import { Building2, Loader2, Save } from 'lucide-react';
import { CompanyProfile, ToastMessage } from '../_types';
import Toast from './Toast';
import Skeleton from './Skeleton';

interface CompanyProfileCardProps {
  profile: CompanyProfile;
  setProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  profileLoading: boolean;
  profileSaving: boolean;
  profileToast: ToastMessage | null;
  onSubmit: (e: FormEvent) => void;
}

export default function CompanyProfileCard({
  profile, setProfile, profileLoading, profileSaving, profileToast, onSubmit,
}: CompanyProfileCardProps) {
  return (
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
        <form onSubmit={onSubmit} className="p-6 space-y-5">
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
  );
}
