import React from 'react';
import { Play, Pause, RotateCcw, ShieldCheck, AlertTriangle, Flame, FastForward } from 'lucide-react';
import { SimulatorStatus, SimulationScenario } from '../types';
import { DashboardCard, SectionHeader } from './ui/DashboardCard';

interface SimulatorControlsProps {
  status: SimulatorStatus;
  onControl: (payload: {
    action?: 'start' | 'stop' | 'pause' | 'resume' | 'reset';
    scenario?: SimulationScenario;
    speed?: number;
  }) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({ status, onControl }) => {
  const isLive = status.isRunning && !status.isPaused;

  return (
    <DashboardCard>
      <SectionHeader
        title="OBD Simulator Controls"
        description="Manage telemetry simulation playback, speed, and demo scenarios."
      />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {isLive ? (
            <button type="button" onClick={() => onControl({ action: 'pause' })} className="btn-secondary">
              <Pause className="w-4 h-4 text-amber-400" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onControl({ action: status.isPaused ? 'resume' : 'start' })}
              className="btn-primary"
            >
              <Play className="w-4 h-4 fill-current" />
              {status.isPaused ? 'Resume' : 'Start'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onControl({ action: 'reset' })}
            className="btn-secondary"
            title="Reset telemetry and history"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 ml-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase px-2 flex items-center gap-1">
              <FastForward className="w-3 h-3" />
              <span className="hidden sm:inline">Speed</span>
            </span>
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onControl({ speed: spd })}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  status.speed === spd
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Scenario:</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onControl({ scenario: 'NORMAL' })}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                status.scenario === 'NORMAL'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Normal
            </button>
            <button
              type="button"
              onClick={() => onControl({ scenario: 'WARNING' })}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                status.scenario === 'WARNING'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Warning
            </button>
            <button
              type="button"
              onClick={() => onControl({ scenario: 'DANGER' })}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                status.scenario === 'DANGER'
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Danger
            </button>
          </div>
        </div>
      </div>

      {status.scenario === 'DANGER' && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>Automatic email alert enabled.</strong> Severe risk triggers diagnostic email to{' '}
              <strong>shettyvignesh91@gmail.com</strong> with GPS location and nearest service center.
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-red-600/30 text-red-200 border border-red-500/30">
            Auto-mail active
          </span>
        </div>
      )}
    </DashboardCard>
  );
};
