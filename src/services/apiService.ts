import {
  VehicleHealthPrediction,
  SimulatorStatus,
  SimulationScenario,
  AlertNotification,
  CSVDataRow,
} from '../types';

const API_BASE = '';

export async function fetchLiveOBDPrediction(): Promise<{
  status: SimulatorStatus;
  prediction: VehicleHealthPrediction;
}> {
  const res = await fetch(`${API_BASE}/api/obd/live`);
  if (!res.ok) throw new Error('Failed to fetch live OBD telemetry');
  const data = await res.json();
  return {
    status: data.status,
    prediction: data.prediction,
  };
}

export async function controlSimulator(payload: {
  action?: 'start' | 'stop' | 'pause' | 'resume' | 'reset';
  scenario?: SimulationScenario;
  speed?: number;
}): Promise<SimulatorStatus> {
  const res = await fetch(`${API_BASE}/api/obd/simulator/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update simulator state');
  const data = await res.json();
  return data.status;
}

export async function postCustomPrediction(
  input: Record<string, any>
): Promise<VehicleHealthPrediction> {
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to run custom ML prediction');
  const data = await res.json();
  return data.prediction;
}

export async function processCSVBatch(
  rows: CSVDataRow[]
): Promise<VehicleHealthPrediction[]> {
  const res = await fetch(`${API_BASE}/api/predict/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error('Failed to process CSV dataset');
  const data = await res.json();
  return data.predictions;
}

export async function fetchAlerts(): Promise<AlertNotification[]> {
  const res = await fetch(`${API_BASE}/api/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  const data = await res.json();
  return data.alerts;
}

export async function sendDemoAlert(
  componentName: string,
  channel: 'SMS' | 'Email',
  recipient: string
): Promise<AlertNotification> {
  const res = await fetch(`${API_BASE}/api/alerts/demo-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ componentName, channel, recipient }),
  });
  if (!res.ok) throw new Error('Failed to dispatch demo alert');
  const data = await res.json();
  return data.alert;
}

export async function sendRealNotification(payload: {
  toEmail?: string;
  toPhone?: string;
  componentName?: string;
  severity?: 'Warning' | 'Critical' | 'Danger';
  healthScore?: number;
  message?: string;
  recommendation?: string;
  customSmtp?: any;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/alerts/send-real`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to dispatch real email/SMS notification');
  return await res.json();
}

export async function fetchEmailSettings(): Promise<{
  recipientEmail: string;
  smtpConfigured: boolean;
  customSmtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
  };
}> {
  const res = await fetch(`${API_BASE}/api/settings/email`);
  if (!res.ok) {
    return { recipientEmail: 'shettyvignesh91@gmail.com', smtpConfigured: false };
  }
  return await res.json();
}

export async function updateEmailSettings(email: string, customSmtp?: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/settings/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, customSmtp }),
  });
  if (!res.ok) throw new Error('Failed to update email settings');
  return await res.json();
}

export async function fetchDispatchedHistory(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/dispatched-history`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    return [];
  }
}

export async function fetchHistory(): Promise<VehicleHealthPrediction[]> {
  const res = await fetch(`${API_BASE}/api/history`);
  if (!res.ok) throw new Error('Failed to fetch prediction history');
  const data = await res.json();
  return data.history;
}

export async function clearHistory(): Promise<void> {
  await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
}
