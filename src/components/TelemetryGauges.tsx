import React from 'react';
import { Gauge, Thermometer, Zap, Disc, Navigation } from 'lucide-react';
import { OBDSensorData, DerivedContextData } from '../types';

interface TelemetryGaugesProps {
  sensorData: OBDSensorData;
  contextData?: DerivedContextData;
  compact?: boolean;
}

type Severity = 'good' | 'warning' | 'critical';

interface GaugeConfig {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  severity: Severity;
  percent: number;
  ticks: [string, string, string];
}

function getTempSeverity(temp: number): Severity {
  if (temp > 108) return 'critical';
  if (temp > 95) return 'warning';
  return 'good';
}

function getVoltageSeverity(v: number): Severity {
  if (v < 11.5 || v > 14.6) return 'critical';
  if (v < 12.3) return 'warning';
  return 'good';
}

function getLoadSeverity(load: number): Severity {
  if (load > 85) return 'critical';
  if (load > 65) return 'warning';
  return 'good';
}

function getRpmSeverity(rpm: number): Severity {
  if (rpm > 4500) return 'critical';
  if (rpm > 3200) return 'warning';
  return 'good';
}

const severityBar: Record<Severity, string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-400',
  critical: 'bg-red-500',
};

const severityText: Record<Severity, string> = {
  good: 'text-slate-100',
  warning: 'text-amber-300',
  critical: 'text-red-400',
};

const GaugeCard: React.FC<GaugeConfig> = ({ label, value, unit, icon, severity, percent, ticks }) => {
  return (
    <div className="dashboard-card p-4 hover:border-slate-700/80 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-2xl font-bold font-mono tabular-nums ${severityText[severity]}`}>
          {value}
        </span>
        <span className="text-xs text-slate-500 font-medium">{unit}</span>
      </div>
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${severityBar[severity]}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1.5">
        <span>{ticks[0]}</span>
        <span>{ticks[1]}</span>
        <span>{ticks[2]}</span>
      </div>
    </div>
  );
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ sensorData }) => {
  const tempSev = getTempSeverity(sensorData.engine_temp);
  const voltSev = getVoltageSeverity(sensorData.battery_voltage);
  const loadSev = getLoadSeverity(sensorData.engine_load);
  const rpmSev = getRpmSeverity(sensorData.rpm);

  const gauges: GaugeConfig[] = [
    {
      label: 'Engine RPM',
      value: sensorData.rpm,
      unit: 'rpm',
      icon: <Gauge className="w-4 h-4 text-blue-400" />,
      severity: rpmSev,
      percent: (sensorData.rpm / 6000) * 100,
      ticks: ['0', '3k', '6k'],
    },
    {
      label: 'Speed',
      value: sensorData.speed,
      unit: 'km/h',
      icon: <Navigation className="w-4 h-4 text-sky-400" />,
      severity: 'good',
      percent: (sensorData.speed / 160) * 100,
      ticks: ['0', '80', '160'],
    },
    {
      label: 'Engine Temp',
      value: sensorData.engine_temp,
      unit: '°C',
      icon: <Thermometer className={`w-4 h-4 ${tempSev === 'critical' ? 'text-red-400' : tempSev === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />,
      severity: tempSev,
      percent: (sensorData.engine_temp / 130) * 100,
      ticks: ['70°', '95°', '120°'],
    },
    {
      label: 'Engine Load',
      value: sensorData.engine_load,
      unit: '%',
      icon: <Disc className={`w-4 h-4 ${loadSev === 'critical' ? 'text-red-400' : loadSev === 'warning' ? 'text-amber-400' : 'text-violet-400'}`} />,
      severity: loadSev,
      percent: sensorData.engine_load,
      ticks: ['0%', '50%', '100%'],
    },
    {
      label: 'Throttle',
      value: sensorData.throttle_position,
      unit: '%',
      icon: <Gauge className="w-4 h-4 text-cyan-400" />,
      severity: 'good',
      percent: sensorData.throttle_position,
      ticks: ['0%', '50%', '100%'],
    },
    {
      label: 'Battery',
      value: sensorData.battery_voltage,
      unit: 'V',
      icon: <Zap className={`w-4 h-4 ${voltSev === 'critical' ? 'text-red-400' : voltSev === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />,
      severity: voltSev,
      percent: ((sensorData.battery_voltage - 10) / 5) * 100,
      ticks: ['10V', '12.6V', '15V'],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {gauges.map((g) => (
        <GaugeCard
          key={g.label}
          label={g.label}
          value={g.value}
          unit={g.unit}
          icon={g.icon}
          severity={g.severity}
          percent={g.percent}
          ticks={g.ticks}
        />
      ))}
    </div>
  );
};
