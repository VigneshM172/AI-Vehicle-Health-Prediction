import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame, Activity } from 'lucide-react';
import { VehicleHealthPrediction, RiskLabel } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { DashboardCard } from './ui/DashboardCard';

interface OverallHealthCardProps {
  prediction: VehicleHealthPrediction;
  compact?: boolean;
}

export const OverallHealthCard: React.FC<OverallHealthCardProps> = ({ prediction, compact = false }) => {
  const { overall_health, overall_status, highest_risk_component, ml_meta, derived_context } = prediction;

  const getStatusIcon = (status: RiskLabel) => {
    switch (status) {
      case 'Danger':
        return <Flame className="w-6 h-6 text-red-400" />;
      case 'Critical':
        return <AlertOctagon className="w-6 h-6 text-orange-400" />;
      case 'Warning':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
    }
  };

  const getGaugeColor = (health: number) => {
    if (health < 50) return 'text-red-400 stroke-red-400';
    if (health < 70) return 'text-orange-400 stroke-orange-400';
    if (health < 85) return 'text-amber-400 stroke-amber-400';
    return 'text-emerald-400 stroke-emerald-400';
  };

  const borderAccent =
    overall_status === 'Danger'
      ? 'border-red-500/30'
      : overall_status === 'Critical'
        ? 'border-orange-500/30'
        : overall_status === 'Warning'
          ? 'border-amber-500/30'
          : 'border-emerald-500/20';

  return (
    <DashboardCard className={`${borderAccent}`}>
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-12' : 'xl:grid-cols-12'} gap-6 items-center`}>
        {/* Health score ring */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-6 lg:pb-0 lg:pr-6">
          <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <path
                className="text-slate-800 stroke-current"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${getGaugeColor(overall_health)} transition-all duration-700 ease-out`}
                strokeDasharray={`${overall_health}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold font-mono text-slate-100 tabular-nums">{overall_health}%</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                Health Score
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {getStatusIcon(overall_status)}
            <div>
              <p className="text-sm font-semibold text-slate-100">{overall_status} Condition</p>
              <StatusBadge status={overall_status} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Vehicle Health Summary</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Random Forest ML classifier across 7 mechanical components
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Highest risk:</span>
              <span className="font-medium px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-amber-300">
                {highest_risk_component}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Odometer</span>
              <span className="font-mono font-medium text-slate-200">{derived_context.km_driven.toLocaleString()} km</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Road Type</span>
              <span className="font-medium text-slate-200">{derived_context.road_type}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Braking</span>
              <span className="font-medium text-slate-200">{derived_context.braking_style}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Component Age</span>
              <span className="font-mono font-medium text-slate-200">{derived_context.component_age} mo</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Model: <strong className="text-slate-400 font-mono">{ml_meta.model_name}</strong>
              </span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span>Trees: <strong className="text-slate-400 font-mono">{ml_meta.tree_count}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span>Confidence: <strong className="text-emerald-400 font-mono">{(ml_meta.confidence * 100).toFixed(0)}%</strong></span>
              <span className="text-slate-700">•</span>
              <span>Inference: <strong className="text-blue-400 font-mono">{ml_meta.inference_time_ms} ms</strong></span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};
