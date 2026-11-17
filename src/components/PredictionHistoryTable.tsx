import React, { useState } from 'react';
import { VehicleHealthPrediction } from '../types';
import { RefreshCw, Trash2, Download, Search } from 'lucide-react';
import { DashboardCard, SectionHeader } from './ui/DashboardCard';
import { StatusBadge } from './ui/StatusBadge';
import { EmptyState } from './ui/EmptyState';

interface PredictionHistoryTableProps {
  history: VehicleHealthPrediction[];
  onClearHistory: () => void;
}

export const PredictionHistoryTable: React.FC<PredictionHistoryTableProps> = ({
  history,
  onClearHistory,
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredHistory = history.filter((item) => {
    if (filterRisk !== 'ALL' && item.overall_status.toUpperCase() !== filterRisk) {
      return false;
    }
    if (
      searchQuery &&
      !item.highest_risk_component.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.overall_status.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vehicle_health_prediction_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardCard padding={false}>
      <div className="dashboard-card-header">
        <SectionHeader
          title="Prediction History"
          description={`${history.length} ML inference records in memory`}
          icon={<RefreshCw className="w-4 h-4" />}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-8 py-1.5 w-40 sm:w-48"
                  aria-label="Search prediction history"
                />
              </div>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="input-field py-1.5 w-auto"
                aria-label="Filter by risk level"
              >
                <option value="ALL">All levels</option>
                <option value="GOOD">Good</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
                <option value="DANGER">Danger</option>
              </select>
              <button type="button" onClick={exportJSON} className="btn-secondary py-1.5" title="Download logs as JSON">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="btn-secondary py-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                title="Clear all history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        />
      </div>

      <div className="dashboard-card-body pt-0">
        {filteredHistory.length === 0 ? (
          <EmptyState
            title="No matching records"
            description={history.length === 0 ? 'Prediction history will populate as telemetry arrives.' : 'Try adjusting your search or filter.'}
          />
        ) : (
          <div className="table-scroll rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-900/80 sticky top-0">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Health</th>
                  <th className="py-3 px-3">Risk</th>
                  <th className="py-3 px-3">Highest Risk</th>
                  <th className="py-3 px-3">Coolant</th>
                  <th className="py-3 px-3">RPM</th>
                  <th className="py-3 px-3">Battery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100">{item.overall_health}%</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={item.overall_status} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{item.highest_risk_component}</td>
                    <td className="py-2.5 px-3">{item.sensor_data.engine_temp}°C</td>
                    <td className="py-2.5 px-3">{item.sensor_data.rpm}</td>
                    <td className="py-2.5 px-3">{item.sensor_data.battery_voltage} V</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};
