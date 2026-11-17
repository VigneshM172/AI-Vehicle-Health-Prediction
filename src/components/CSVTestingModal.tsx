import React, { useState } from 'react';
import { CSVDataRow, VehicleHealthPrediction, ComponentHealth } from '../types';
import { processCSVBatch, sendRealNotification } from '../services/apiService';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  X,
  Search,
  Filter,
  Flame,
  ShieldAlert,
  MapPin,
  Wrench,
  ChevronRight,
  Send,
  Mail,
  ExternalLink,
  Sparkles,
  Zap,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

interface CSVTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchProcessed?: (predictions: VehicleHealthPrediction[]) => void;
}

export const CSVTestingModal: React.FC<CSVTestingModalProps> = ({
  isOpen,
  onClose,
  onBatchProcessed,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<VehicleHealthPrediction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRowDetail, setSelectedRowDetail] = useState<VehicleHealthPrediction | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid .csv telemetry dataset file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCsvText(event.target.result as string);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const parseCSV = (rawText: string): CSVDataRow[] => {
    const lines = rawText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV file must contain a header line and at least 1 data row.');

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: CSVDataRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map((v) => v.trim());
      const rowObj: any = {};

      headers.forEach((h, idx) => {
        rowObj[h] = values[idx];
      });

      rows.push({
        km_driven: Number(rowObj.km_driven ?? 20000),
        road_type: rowObj.road_type ?? 'City',
        braking_style: rowObj.braking_style ?? 'Moderate',
        load: Number(rowObj.load ?? 40),
        engine_temp: Number(rowObj.engine_temp ?? 88),
        rpm: Number(rowObj.rpm ?? 2200),
        battery_voltage: Number(rowObj.battery_voltage ?? 14.0),
        component_age: Number(rowObj.component_age ?? 12),
        speed: Number(rowObj.speed ?? 50),
        throttle_position: Number(rowObj.throttle_position ?? 25),
      });
    }

    return rows;
  };

  const handleRunBatch = async () => {
    setLoading(true);
    setError(null);
    setEmailStatus(null);
    try {
      const parsedRows = parseCSV(csvText);
      const res = await processCSVBatch(parsedRows);
      setResults(res);
      if (onBatchProcessed) onBatchProcessed(res);

      // Check if any Danger rows exist and notify user
      const dangerCount = res.filter((r) => r.overall_status === 'Danger').length;
      if (dangerCount > 0) {
        setEmailStatus(`⚠️ Batch complete: Found ${dangerCount} Danger-level anomalies! You can send an emergency alert email below.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing or processing CSV telemetry batch');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBatchReportEmail = async () => {
    if (!results || results.length === 0) return;
    setIsSendingEmail(true);
    setEmailStatus(null);

    const highestRiskRow = results.reduce((prev, curr) => (curr.overall_health < prev.overall_health ? curr : prev), results[0]);

    try {
      const res = await sendRealNotification({
        toEmail: 'shettyvignesh91@gmail.com',
        toPhone: '+1 (555) 019-2831',
        componentName: `CSV Batch Summary (${results.length} telemetry rows)`,
        severity: highestRiskRow.overall_status,
        healthScore: highestRiskRow.overall_health,
        message: `Processed CSV dataset with ${results.length} telemetry records. Highest risk detected: ${highestRiskRow.highest_risk_component} at ${highestRiskRow.overall_health}% health.`,
        recommendation: highestRiskRow.recommendation,
      });

      setEmailStatus(`✅ Diagnostic Report Email dispatched to shettyvignesh91@gmail.com! ${res.dispatch?.previewUrl ? 'Preview link ready.' : ''}`);
    } catch (err: any) {
      setEmailStatus(`❌ Email dispatch error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleExportJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle_ml_batch_report_${Date.now()}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    if (!results) return;
    const headers = ['Row', 'Overall_Health', 'Overall_Status', 'Highest_Risk_Component', 'Engine_Temp_C', 'Battery_V', 'RPM', 'Speed_kmh'];
    const csvLines = [headers.join(',')];

    results.forEach((r, idx) => {
      csvLines.push([
        idx + 1,
        r.overall_health,
        r.overall_status,
        `"${r.highest_risk_component}"`,
        r.sensor_data.engine_temp,
        r.sensor_data.battery_voltage,
        r.sensor_data.rpm,
        r.sensor_data.speed,
      ].join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle_ml_diagnostic_results_${Date.now()}.csv`;
    a.click();
  };

  // Filtered results logic
  const filteredResults = results?.filter((r) => {
    const matchesFilter = statusFilter === 'ALL' || r.overall_status.toUpperCase() === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      r.highest_risk_component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.overall_status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const dangerCount = results?.filter((r) => r.overall_status === 'Danger').length ?? 0;
  const criticalCount = results?.filter((r) => r.overall_status === 'Critical').length ?? 0;
  const warningCount = results?.filter((r) => r.overall_status === 'Warning').length ?? 0;
  const normalCount = results?.filter((r) => r.overall_status === 'Normal').length ?? 0;
  const avgHealth = results ? Math.round(results.reduce((acc, r) => acc + r.overall_health, 0) / results.length) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111820] border border-slate-800/80 rounded-xl w-full max-w-5xl p-5 sm:p-7 relative my-6 text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>CSV Batch Telemetry Testing & ML Diagnostics Engine</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Load telemetry datasets, test multi-row vehicle risk predictions, and trigger emergency alerts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="mt-4 space-y-5 overflow-y-auto pr-1">
          
          {/* Drag & Drop Upload Zone + CSV Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload CSV Telemetry Dataset</span>
              </label>

              <div className="flex items-center space-x-2 text-xs">
                <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/20">
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Upload .CSV File</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleRunBatch}
                  disabled={loading || !csvText.trim()}
                  className="flex items-center space-x-2 px-5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-indigo-400" />
                      <span>Run ML Batch Inference</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all ${
                dragOver ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800 bg-slate-950'
              }`}
            >
              {!csvText.trim() ? (
                <label className="flex flex-col items-center justify-center p-8 cursor-pointer text-center">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-3">
                    <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">
                    Click to select or drag & drop your <span className="text-indigo-400">.CSV dataset file</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    CSV should contain vehicle telemetry headers: <code className="text-slate-400 font-mono text-[11px]">km_driven, road_type, braking_style, load, engine_temp, rpm, battery_voltage, component_age, speed, throttle_position</code>
                  </p>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              ) : (
                <div className="p-1 relative">
                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="CSV content..."
                    className="w-full bg-transparent p-3 font-mono text-xs text-slate-200 focus:outline-none leading-relaxed resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => { setCsvText(''); setResults(null); setError(null); }}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono border border-slate-700 cursor-pointer"
                  >
                    Clear CSV
                  </button>
                </div>
              )}
            </div>
            {csvText.trim() && (
              <div className="text-[10px] text-slate-400 font-mono text-right">
                Rows in CSV: {csvText.trim().split('\n').length - 1} data record(s)
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {emailStatus && (
            <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs flex items-center justify-between">
              <span className="font-mono">{emailStatus}</span>
              <button
                type="button"
                onClick={handleSendBatchReportEmail}
                disabled={isSendingEmail}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                {isSendingEmail ? 'Sending...' : 'Send Alert Email'}
              </button>
            </div>
          )}

          {/* Results Analytics Dashboard */}
          {results && (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Evaluated</div>
                  <div className="text-xl font-bold text-white mt-1 font-mono">{results.length} Rows</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Telemetry Samples</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Avg Health Index</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{avgHealth}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fleet Overall Score</div>
                </div>

                <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-red-400">Danger Anomalies</div>
                  <div className="text-xl font-bold text-red-400 mt-1 font-mono">{dangerCount}</div>
                  <div className="text-[10px] text-red-300/70 mt-0.5">Emergency Alerts</div>
                </div>

                <div className="bg-orange-950/40 border border-orange-500/30 rounded-2xl p-3">
                  <div className="text-[10px] uppercase font-bold text-orange-400">Critical Warnings</div>
                  <div className="text-xl font-bold text-orange-400 mt-1 font-mono">{criticalCount}</div>
                  <div className="text-[10px] text-orange-300/70 mt-0.5">Service Required</div>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Normal Operations</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{normalCount}</div>
                  <div className="text-[10px] text-emerald-300/70 mt-0.5">Optimal Telemetry</div>
                </div>
              </div>

              {/* Controls, Filter Tabs & Export Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                
                {/* Search & Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search component or risk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                    />
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                    {['ALL', 'DANGER', 'CRITICAL', 'WARNING', 'NORMAL'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setStatusFilter(tab)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === tab
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Report Buttons */}
                <div className="flex items-center space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CSV Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>JSON Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendBatchReportEmail}
                    disabled={isSendingEmail}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Send Alert Email</span>
                  </button>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-900 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Health Score</th>
                      <th className="py-2.5 px-3">Risk Status</th>
                      <th className="py-2.5 px-3">Primary Anomaly</th>
                      <th className="py-2.5 px-3">Engine Temp</th>
                      <th className="py-2.5 px-3">Battery V</th>
                      <th className="py-2.5 px-3">RPM / Speed</th>
                      <th className="py-2.5 px-3">Nearest Service</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResults?.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-6 text-slate-500 text-xs">
                          No CSV rows match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredResults?.map((res, i) => (
                        <tr key={i} className="hover:bg-slate-900/80 transition-all">
                          <td className="py-2.5 px-3 text-slate-400 font-bold">#{i + 1}</td>
                          
                          <td className="py-2.5 px-3 font-bold text-white">
                            <div className="flex items-center space-x-2">
                              <span>{res.overall_health}%</span>
                              <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    res.overall_health > 75
                                      ? 'bg-emerald-400'
                                      : res.overall_health > 50
                                      ? 'bg-amber-400'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${res.overall_health}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                res.overall_status === 'Danger'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : res.overall_status === 'Critical'
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                                  : res.overall_status === 'Warning'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              }`}
                            >
                              {res.overall_status}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-bold text-slate-200">
                            {res.highest_risk_component}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={res.sensor_data.engine_temp > 105 ? 'text-red-400 font-bold' : ''}>
                              {res.sensor_data.engine_temp}°C
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={res.sensor_data.battery_voltage < 11.5 ? 'text-red-400 font-bold' : ''}>
                              {res.sensor_data.battery_voltage} V
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-slate-400">
                            {res.sensor_data.rpm} / {res.sensor_data.speed} km/h
                          </td>

                          <td className="py-2.5 px-3 text-[11px] text-slate-300">
                            {res.location?.nearestServiceCenters?.[0] ? (
                              <span className="truncate max-w-[140px] inline-block">
                                {res.location.nearestServiceCenters[0].name}
                              </span>
                            ) : (
                              'Bosch Car Service'
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRowDetail(res)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Row Detail Breakdown Modal */}
        {selectedRowDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-[#111820] border border-slate-800/80 rounded-xl w-full max-w-xl p-6 relative space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    Detailed Component Diagnostic Inspection
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRowDetail(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Overall Vehicle Health</div>
                  <div className="text-2xl font-bold text-white font-mono">{selectedRowDetail.overall_health}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Risk Level</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                      selectedRowDetail.overall_status === 'Danger'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : selectedRowDetail.overall_status === 'Critical'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {selectedRowDetail.overall_status}
                  </span>
                </div>
              </div>

              {/* Component breakdown list */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Component Breakdown (6 Sub-Systems)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {selectedRowDetail.components.map((comp: ComponentHealth) => (
                    <div key={comp.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-white font-bold">
                        <span>{comp.name}</span>
                        <span className={comp.health < 60 ? 'text-red-400' : 'text-emerald-400'}>
                          {comp.health}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            comp.health > 70 ? 'bg-emerald-400' : comp.health > 40 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${comp.health}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Wear: {comp.wear}%</span>
                        <span>Risk: {comp.risk_level}/3</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service center info */}
              {selectedRowDetail.location?.nearestServiceCenters?.[0] && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-white flex items-center space-x-1">
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nearest Recommended Service Center</span>
                  </div>
                  <div className="text-indigo-200 font-bold">
                    {selectedRowDetail.location.nearestServiceCenters[0].name} ({selectedRowDetail.location.nearestServiceCenters[0].distanceKm} km away)
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    📞 {selectedRowDetail.location.nearestServiceCenters[0].phone}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedRowDetail(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspection
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
