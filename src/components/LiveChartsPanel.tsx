import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { VehicleHealthPrediction } from '../types';
import { Activity } from 'lucide-react';
import { DashboardCard, SectionHeader } from './ui/DashboardCard';
import { EmptyState } from './ui/EmptyState';

interface LiveChartsPanelProps {
  history: VehicleHealthPrediction[];
}

const CHART_THEME = {
  grid: '#1e293b',
  axis: '#64748b',
  tooltip: {
    backgroundColor: '#111820',
    borderColor: '#334155',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#e2e8f0',
  },
};

export const LiveChartsPanel: React.FC<LiveChartsPanelProps> = ({ history }) => {
  const [chartTab, setChartTab] = useState<'telemetry' | 'thermal' | 'health'>('telemetry');

  const chartData = [...history].reverse().map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    rpm: item.sensor_data.rpm,
    speed: item.sensor_data.speed,
    engine_temp: item.sensor_data.engine_temp,
    engine_load: item.sensor_data.engine_load,
    battery_voltage: item.sensor_data.battery_voltage,
    overall_health: item.overall_health,
  }));

  const tabs = [
    { id: 'telemetry' as const, label: 'RPM & Speed' },
    { id: 'thermal' as const, label: 'Temp & Load' },
    { id: 'health' as const, label: 'Voltage & Health' },
  ];

  return (
    <DashboardCard padding={false}>
      <div className="dashboard-card-header">
        <SectionHeader
          title="Live Telemetry Trends"
          description={`Rolling time-series buffer — ${chartData.length} data points`}
          icon={<Activity className="w-4 h-4" />}
          action={
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    chartTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <div className="dashboard-card-body pt-0">
        {chartData.length === 0 ? (
          <EmptyState
            title="Awaiting telemetry stream"
            description="Start the simulator to begin recording live sensor data."
            icon={<Activity className="w-8 h-8" />}
          />
        ) : (
          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'telemetry' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis dataKey="time" stroke={CHART_THEME.axis} fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#818cf8" fontSize={11} domain={[0, 6500]} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={11} domain={[0, 180]} tickLine={false} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  <Line yAxisId="left" type="monotone" dataKey="rpm" name="Engine RPM" stroke="#818cf8" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              ) : chartTab === 'thermal' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis dataKey="time" stroke={CHART_THEME.axis} fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#f87171" fontSize={11} domain={[60, 130]} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#c084fc" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  <Line yAxisId="left" type="monotone" dataKey="engine_temp" name="Engine Temp (°C)" stroke="#f87171" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="engine_load" name="Engine Load (%)" stroke="#c084fc" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis dataKey="time" stroke={CHART_THEME.axis} fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#fbbf24" fontSize={11} domain={[9, 16]} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  <Line yAxisId="left" type="monotone" dataKey="battery_voltage" name="Battery (V)" stroke="#fbbf24" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="overall_health" name="Overall Health (%)" stroke="#34d399" strokeWidth={2.5} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};
