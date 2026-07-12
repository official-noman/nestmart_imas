import { Calendar, FileText } from 'lucide-react';

interface Props {
  date: string;
  setDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

export default function EntryDetailsCard({ date, setDate, description, setDescription }: Props) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-zinc-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Entry Details</p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Description</label>
          <input
            type="text"
            required
            placeholder="e.g. Depreciation for Q3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
