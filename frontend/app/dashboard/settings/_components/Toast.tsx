import { AlertCircle, CheckCircle } from 'lucide-react';
import { ToastMessage } from '../_types';

export default function Toast({ message, type }: ToastMessage) {
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
