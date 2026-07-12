import { AlertCircle } from 'lucide-react';

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {message}
    </div>
  );
}
