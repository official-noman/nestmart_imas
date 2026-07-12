'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ChevronRight } from 'lucide-react';

import { useCompanyProfile } from './_lib/useCompanyProfile';
import { useTaxRates } from './_lib/useTaxRates';
import CompanyProfileCard from './_components/CompanyProfileCard';
import TaxRatesCard from './_components/TaxRatesCard';
import TaxRateModal from './_components/TaxRateModal';

export default function SettingsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const companyProfile = useCompanyProfile();
  const taxRates = useTaxRates();

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
        <CompanyProfileCard
          profile={companyProfile.profile}
          setProfile={companyProfile.setProfile}
          profileLoading={companyProfile.profileLoading}
          profileSaving={companyProfile.profileSaving}
          profileToast={companyProfile.profileToast}
          onSubmit={companyProfile.handleProfileSave}
        />

        <TaxRatesCard
          taxes={taxRates.taxes}
          taxLoading={taxRates.taxLoading}
          taxError={taxRates.taxError}
          taxTogglingId={taxRates.taxTogglingId}
          onAddClick={taxRates.openTaxModal}
          onToggle={taxRates.handleTaxToggle}
        />
      </div>

      <TaxRateModal
        show={taxRates.showTaxModal}
        onClose={taxRates.closeTaxModal}
        taxForm={taxRates.taxForm}
        setTaxForm={taxRates.setTaxForm}
        taxFormError={taxRates.taxFormError}
        setTaxFormError={taxRates.setTaxFormError}
        taxSubmitting={taxRates.taxSubmitting}
        onSubmit={taxRates.handleTaxSubmit}
      />
    </div>
  );
}
