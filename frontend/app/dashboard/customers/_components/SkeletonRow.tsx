export default function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-32 rounded-full bg-slate-100" />
            <div className="h-2.5 w-44 rounded-full bg-slate-50" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4"><div className="h-3 w-40 rounded-full bg-slate-100" /></td>
      <td className="py-4 px-4"><div className="h-3 w-28 rounded-full bg-slate-100" /></td>
      <td className="py-4 px-4"><div className="h-5 w-20 rounded-full bg-slate-100" /></td>
      <td className="py-4 pl-4 pr-6 text-right"><div className="h-3.5 w-16 rounded-full bg-slate-100 ml-auto" /></td>
    </tr>
  );
}
