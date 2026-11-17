import React from 'react';
import { Menu, Wifi, WifiOff, Activity } from 'lucide-react';
import { SimulatorStatus, RiskLabel } from '../types';
import { AppView, VIEW_TITLES } from './Sidebar';
import { StatusBadge } from './ui/StatusBadge';

interface TopBarProps {
  activeView: AppView;
  overallStatus: RiskLabel;
  overallHealth: number;
  simulatorStatus: SimulatorStatus;
  isConnected: boolean;
  isLoading: boolean;
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  overallStatus,
  overallHealth,
  simulatorStatus,
  isConnected,
  isLoading,
  onMenuClick,
}) => {
  const isLive = simulatorStatus.isRunning && !simulatorStatus.isPaused;

  return (
    <header className="sticky top-0 z-30 h-[var(--topbar-height)] bg-[#0a0e14]/95 backdrop-blur-sm border-b border-slate-800/80">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 gap-4">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-100 truncate">
              {VIEW_TITLES[activeView]}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Real-time vehicle diagnostics & predictive maintenance
            </p>
          </div>
        </div>

        {/* Right: status indicators */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Connection */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
              isConnected
                ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}
            title={isConnected ? 'Connected to OBD simulator' : 'Connection lost'}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className="font-medium">{isConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Simulator status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isLive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />
            <span>{isLive ? 'Simulator Active' : 'Simulator Paused'}</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-blue-400">{simulatorStatus.readingsCount}</span>
            <span className="text-slate-500">readings</span>
          </div>

          {/* Health badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            {isLoading ? (
              <Activity className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
            ) : (
              <>
                <span className="text-sm font-bold font-mono text-slate-100">{overallHealth}%</span>
                <StatusBadge status={overallStatus} />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
