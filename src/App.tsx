import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  VehicleHealthPrediction,
  SimulatorStatus,
  AlertNotification,
  SimulationScenario,
} from './types';
import {
  fetchLiveOBDPrediction,
  controlSimulator,
  fetchAlerts,
  clearHistory,
  sendDemoAlert,
} from './services/apiService';
import { Sidebar, AppView } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SimulatorControls } from './components/SimulatorControls';
import { TelemetryGauges } from './components/TelemetryGauges';
import { OverallHealthCard } from './components/OverallHealthCard';
import { ComponentHealthGrid } from './components/ComponentHealthGrid';
import { LiveChartsPanel } from './components/LiveChartsPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { PredictionHistoryTable } from './components/PredictionHistoryTable';
import { CSVTestingModal } from './components/CSVTestingModal';
import { SettingsPanel } from './components/SettingsPanel';
import { DashboardSummary } from './components/DashboardSummary';
import { LoadingState } from './components/ui/LoadingState';
import { Flame, AlertTriangle, X, BellOff, Send } from 'lucide-react';

export default function App() {
  const [prediction, setPrediction] = useState<VehicleHealthPrediction | null>(null);
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus>({
    isRunning: true,
    isPaused: false,
    scenario: 'NORMAL',
    speed: 1,
    readingsCount: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [history, setHistory] = useState<VehicleHealthPrediction[]>([]);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeToast, setActiveToast] = useState<AlertNotification | null>(null);
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<string>>(new Set());
  const [isToastMuted, setIsToastMuted] = useState<boolean>(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLiveTelemetry = useCallback(async () => {
    try {
      const data = await fetchLiveOBDPrediction();
      setPrediction(data.prediction);
      setSimulatorStatus(data.status);
      setIsConnected(true);
      setFetchError(null);

      setHistory((prev) => {
        const next = [data.prediction, ...prev];
        return next.slice(0, 100);
      });
    } catch (err) {
      console.error('Error fetching OBD telemetry:', err);
      setIsConnected(false);
      setFetchError('Unable to connect to OBD simulator. Retrying…');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAlertsList = useCallback(async () => {
    try {
      const fetched = await fetchAlerts();
      setAlerts(fetched);

      if (isToastMuted) return;

      const candidate = fetched.find(
        (a) =>
          (a.severity === 'Danger' || a.severity === 'Critical' || a.severity === 'Warning') &&
          !dismissedToastIds.has(a.id)
      );

      if (candidate) {
        setActiveToast(candidate);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setDismissedToastIds((prev) => new Set(prev).add(candidate.id));
          setActiveToast(null);
        }, 7000);
      } else {
        setActiveToast(null);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, [dismissedToastIds, isToastMuted]);

  useEffect(() => {
    loadLiveTelemetry();
    loadAlertsList();

    const interval = setInterval(() => {
      loadLiveTelemetry();
      loadAlertsList();
    }, 2000);

    return () => clearInterval(interval);
  }, [loadLiveTelemetry, loadAlertsList]);

  const handleDismissToast = (id: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setDismissedToastIds((prev) => new Set(prev).add(id));
    setActiveToast(null);
  };

  const handleMuteAllPopups = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setIsToastMuted(true);
    setActiveToast(null);
  };

  const handleSimulatorControl = async (payload: {
    action?: 'start' | 'stop' | 'pause' | 'resume' | 'reset';
    scenario?: SimulationScenario;
    speed?: number;
  }) => {
    try {
      const updatedStatus = await controlSimulator(payload);
      setSimulatorStatus(updatedStatus);
      if (payload.scenario === 'NORMAL') setActiveToast(null);
      await loadLiveTelemetry();
    } catch (err) {
      console.error('Error updating simulator:', err);
    }
  };

  const handleSendDemoAlert = async (
    componentName: string,
    channel: 'SMS' | 'Email' = 'Email',
    recipient: string = 'shettyvignesh91@gmail.com'
  ) => {
    try {
      const alert = await sendDemoAlert(componentName, channel, recipient);
      setIsToastMuted(false);
      setActiveToast(alert);
      await loadAlertsList();
    } catch (err) {
      console.error('Error sending demo alert:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const alertBanner =
    activeToast && !isToastMuted ? (
      <div
        role="alert"
        className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
          activeToast.severity === 'Danger'
            ? 'bg-red-950/60 border-red-500/40 text-red-100'
            : 'bg-orange-950/60 border-orange-500/40 text-orange-100'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          {activeToast.severity === 'Danger' ? (
            <Flame className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                {activeToast.severity} Alert
              </span>
              <span className="text-xs font-semibold font-mono">{activeToast.component_name}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeToast.message}</p>
            <p className="text-[11px] text-indigo-300 mt-1 font-medium">
              Email alert sent automatically to the configured recipient.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button type="button" onClick={() => setActiveView('alerts')} className="btn-primary py-1.5 text-xs">
            <Send className="w-3.5 h-3.5" />
            Alert Center
          </button>
          <button
            type="button"
            onClick={handleMuteAllPopups}
            className="btn-secondary py-1.5 text-xs"
            title="Silence popups"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mute</span>
          </button>
          <button
            type="button"
            onClick={() => handleDismissToast(activeToast.id)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ) : null;

  const renderContent = () => {
    if (isLoading && !prediction) {
      return <LoadingState message="Connecting to OBD simulator…" />;
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {alertBanner}
            {prediction && <OverallHealthCard prediction={prediction} />}
            {prediction && <TelemetryGauges sensorData={prediction.sensor_data} contextData={prediction.derived_context} />}
            {prediction && (
              <ComponentHealthGrid
                components={prediction.components}
                onSendDemoAlert={(comp) => handleSendDemoAlert(comp)}
              />
            )}
            <LiveChartsPanel history={history} />
            <DashboardSummary alerts={alerts} history={history} onNavigate={setActiveView} />
          </div>
        );

      case 'vehicle-health':
        return (
          <div className="space-y-6">
            {alertBanner}
            {prediction ? (
              <OverallHealthCard prediction={prediction} />
            ) : (
              <LoadingState compact message="Waiting for health prediction…" />
            )}
          </div>
        );

      case 'components':
        return (
          <div className="space-y-6">
            {prediction ? (
              <ComponentHealthGrid
                components={prediction.components}
                onSendDemoAlert={(comp) => handleSendDemoAlert(comp)}
              />
            ) : (
              <LoadingState compact message="Waiting for component data…" />
            )}
          </div>
        );

      case 'telemetry':
        return (
          <div className="space-y-6">
            <SimulatorControls status={simulatorStatus} onControl={handleSimulatorControl} />
            {prediction ? (
              <>
                <TelemetryGauges sensorData={prediction.sensor_data} contextData={prediction.derived_context} />
                <LiveChartsPanel history={history} />
              </>
            ) : (
              <LoadingState compact message="Waiting for telemetry…" />
            )}
          </div>
        );

      case 'history':
        return <PredictionHistoryTable history={history} onClearHistory={handleClearHistory} />;

      case 'alerts':
        return (
          <AlertsPanel
            alerts={alerts}
            onSendDemoAlert={(comp, chan, rec) => handleSendDemoAlert(comp, chan, rec)}
            onSilenceToastAlerts={() => setIsToastMuted(!isToastMuted)}
            isToastMuted={isToastMuted}
          />
        );

      case 'settings':
        return <SettingsPanel onOpenCsvModal={() => setCsvModalOpen(true)} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 flex">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        alertCount={alerts.filter((a) => a.severity === 'Danger' || a.severity === 'Critical').length}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar
          activeView={activeView}
          overallStatus={prediction?.overall_status || 'Good'}
          overallHealth={prediction?.overall_health ?? 100}
          simulatorStatus={simulatorStatus}
          isConnected={isConnected}
          isLoading={isLoading && !prediction}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {fetchError && !isConnected && (
          <div className="px-4 lg:px-6 py-2 bg-red-950/40 border-b border-red-500/30 text-xs text-red-300" role="status">
            {fetchError}
          </div>
        )}

        <main className="flex-1 px-4 lg:px-6 py-6 overflow-x-hidden" id="main-content">
          {renderContent()}
        </main>
      </div>

      <CSVTestingModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onBatchProcessed={(batchRes) => {
          if (batchRes.length > 0) setPrediction(batchRes[0]);
        }}
      />
    </div>
  );
}
