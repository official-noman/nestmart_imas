import { CheckCircle } from 'lucide-react';

export default function SuccessOverlay() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-zinc-900">Invoice Created!</p>
          <p className="text-sm text-zinc-500 mt-1">Redirecting to invoices list…</p>
        </div>
      </div>
    </div>
  );
}
