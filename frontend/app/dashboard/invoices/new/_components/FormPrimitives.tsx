import type { ReactNode } from 'react';

export const FieldLabel = ({ children }: { children: ReactNode }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
    {children}
  </label>
);

export const SkeletonInput = ({ w = 'full' }: { w?: string }) => (
  <div className={`h-10 w-${w} animate-pulse bg-zinc-100 rounded-xl`} />
);
