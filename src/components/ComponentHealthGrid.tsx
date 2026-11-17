import React from 'react';
import {
  Disc,
  Circle,
  Cpu,
  Zap,
  Droplet,
  Link,
  Wind,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Flame,
  Send,
  Wrench,
} from 'lucide-react';
import { ComponentHealth, RiskLevel } from '../types';
import { DashboardCard, SectionHeader } from './ui/DashboardCard';
import { StatusBadge } from './ui/StatusBadge';

interface ComponentHealthGridProps {
  components: ComponentHealth[];
  onSendDemoAlert: (componentName: string) => void;
  showHeader?: boolean;
}

export const ComponentHealthGrid: React.FC<ComponentHealthGridProps> = ({
  components,
  onSendDemoAlert,
  showHeader = true,
}) => {
  const getComponentIcon = (id: string) => {
    switch (id) {
      case 'brake_pads':
        return <Disc className="w-4 h-4 text-red-400" />;
      case 'tyres':
        return <Circle className="w-4 h-4 text-amber-400" />;
      case 'engine':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'battery':
        return <Zap className="w-4 h-4 text-amber-300" />;
      case 'engine_oil':
        return <Droplet className="w-4 h-4 text-sky-400" />;
      case 'chain_belt':
        return <Link className="w-4 h-4 text-violet-400" />;
      case 'air_filter':
        return <Wind className="w-4 h-4 text-teal-400" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRiskMeta = (risk: RiskLevel) => {
    switch (risk) {
      case 3:
        return { label: 'Danger', barClass: 'bg-red-500', borderClass: 'border-red-500/40', icon: <Flame className="w-3 h-3 text-red-400" /> };
      case 2:
        return { label: 'Critical', barClass: 'bg-orange-500', borderClass: 'border-orange-500/30', icon: <AlertOctagon className="w-3 h-3 text-orange-400" /> };
      case 1:
        return { label: 'Warning', barClass: 'bg-amber-400', borderClass: 'border-amber-500/25', icon: <AlertTriangle className="w-3 h-3 text-amber-400" /> };
      default:
        return { label: 'Good', barClass: 'bg-emerald-500', borderClass: 'border-slate-800/80', icon: <ShieldCheck className="w-3 h-3 text-emerald-400" /> };
    }
  };

  const grid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {components.map((comp) => {
        const meta = getRiskMeta(comp.risk_level);
        return (
          <div
            key={comp.id}
            className={`dashboard-card p-4 flex flex-col justify-between ${meta.borderClass} ${comp.risk_level >= 2 ? 'bg-slate-900/80' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getComponentIcon(comp.id)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-100 truncate">{comp.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Weight {Math.round(comp.weight * 100)}%</span>
                  </div>
                </div>
                <StatusBadge status={meta.label} />
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-500">Health</span>
                  <span className="font-mono font-bold text-slate-100">{comp.health}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${meta.barClass}`}
                    style={{ width: `${comp.health}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Wear {comp.wear}%</span>
                  <span>
                    RUL {comp.remaining_life.toLocaleString()} {comp.remaining_life_unit}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 mb-3">
                {comp.status_message}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-600 font-mono">
                {comp.risk_level > 0 ? 'Alert available' : 'Normal'}
              </span>
              <button
                type="button"
                onClick={() => onSendDemoAlert(comp.name)}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                title="Test SMS/Email alert notification"
              >
                <Send className="w-3 h-3" />
                Send Alert
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!showHeader) return grid;

  return (
    <div className="space-y-4">
      <DashboardCard padding={false}>
        <div className="dashboard-card-header">
          <SectionHeader
            title="Component Health"
            description="Predictive maintenance status for 7 vehicle system nodes"
            action={<span className="text-xs text-slate-500 font-mono">Total weight 100%</span>}
          />
        </div>
        <div className="dashboard-card-body pt-0">{grid}</div>
      </DashboardCard>
    </div>
  );
};
