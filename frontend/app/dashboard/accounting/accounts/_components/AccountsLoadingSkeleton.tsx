export default function AccountsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-zinc-200/80 rounded-2xl p-6 animate-pulse">
          <div className="h-6 w-32 bg-zinc-100 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-zinc-50 rounded" />
            <div className="h-4 w-full bg-zinc-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
