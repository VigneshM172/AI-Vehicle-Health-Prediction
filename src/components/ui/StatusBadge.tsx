import React from 'react';
import { RiskLabel } from '../../types';

type Severity = RiskLabel | 'Warning' | 'Critical' | 'Danger' | 'Good' | 'Normal';

interface StatusBadgeProps {
  status: Severity | string;
  size?: 'sm' | 'md';
  className?: string;
}

const styles: Record<string, string> = {
  Good: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  Normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  Warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  Critical: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
  Danger: 'bg-red-500/10 text-red-400 border-red-500/25',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const key = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const normalized =
    key === 'Good' || key === 'Normal'
      ? 'Good'
      : key === 'Warning'
        ? 'Warning'
        : key === 'Critical'
          ? 'Critical'
          : key === 'Danger'
            ? 'Danger'
            : 'Good';

  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wide rounded-md border ${sizeClass} ${styles[normalized] ?? styles.Good} ${className}`}
    >
      {status}
    </span>
  );
};
