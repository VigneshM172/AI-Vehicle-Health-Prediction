import React from 'react';
import { AlertNotification, VehicleHealthPrediction } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { DashboardCard, SectionHeader } from './ui/DashboardCard';
import { EmptyState } from './ui/EmptyState';
import { ShieldAlert, History, ChevronRight } from 'lucide-react';
import { AppView } from './Sidebar';

interface DashboardSummaryProps {
  alerts: AlertNotification[];
  history: VehicleHealthPrediction[];
  onNavigate: (view: AppView) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  alerts,
  history,
  onNavigate,
}) => {
  const recentAlerts = alerts.slice(0, 5);
  const recentHistory = history.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardCard>
        <SectionHeader
          title="Recent Alerts"
          description={`${alerts.length} alert${alerts.length !== 1 ? 's' : ''} in audit trail`}
          icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
          action={
            alerts.length > 0 ? (
              <button
                type="button"
                onClick={() => onNavigate('alerts')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
        />
        {recentAlerts.length === 0 ? (
          <EmptyState
            title="No active alerts"
            description="Vehicle telemetry is within normal parameters."
            icon={<ShieldAlert className="w-8 h-8 text-emerald-500/50" />}
          />
        ) : (
          <ul className="space-y-2">
            {recentAlerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200">{alert.component_name}</span>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{alert.message}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard>
        <SectionHeader
          title="Recent Predictions"
          description={`${history.length} prediction${history.length !== 1 ? 's' : ''} recorded`}
          icon={<History className="w-4 h-4 text-blue-400" />}
          action={
            history.length > 0 ? (
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
        />
        {recentHistory.length === 0 ? (
          <EmptyState
            title="Awaiting predictions"
            description="Live telemetry will populate prediction history automatically."
            icon={<History className="w-8 h-8" />}
          />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-3 font-semibold">Time</th>
                  <th className="py-2 pr-3 font-semibold">Health</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Top Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentHistory.map((item, idx) => (
                  <tr key={idx} className="text-slate-300">
                    <td className="py-2.5 pr-3 font-mono text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 pr-3 font-mono font-semibold text-slate-100">
                      {item.overall_health}%
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={item.overall_status} />
                    </td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[120px]">
                      {item.highest_risk_component}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
};
