'use client';

import { AlertCircle } from 'lucide-react';

export default function FetchErrorBanner({
  fetchError,
  onRetry,
}: {
  fetchError: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
      <p className="flex-1 text-sm text-rose-700">{fetchError}</p>
      <button onClick={onRetry} className="text-xs font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-800">
        Retry
      </button>
    </div>
  );
}
