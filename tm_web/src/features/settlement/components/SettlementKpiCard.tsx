import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SettlementKpiCardProps {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'green' | 'blue' | 'amber' | 'slate';
}

const accentMap: Record<string, string> = {
  green: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
  blue: 'border-blue-200 bg-blue-50/60 text-blue-700',
  amber: 'border-amber-200 bg-amber-50/60 text-amber-700',
  slate: 'border-slate-200 bg-slate-50/60 text-slate-700',
};

export function SettlementKpiCard({ title, value, sub, accent = 'slate' }: SettlementKpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
          {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
        </div>
        <span className={cn('rounded-full border px-2 py-1 text-xs font-semibold', accentMap[accent])}>
          KPI
        </span>
      </div>
    </div>
  );
}
