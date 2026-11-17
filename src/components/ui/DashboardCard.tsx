import React from 'react';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className = '',
  padding = true,
}) => (
  <div className={`dashboard-card ${padding ? 'p-5' : ''} ${className}`}>{children}</div>
);

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  action,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-blue-400 shrink-0">{icon}</div>}
      <div>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {description && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
