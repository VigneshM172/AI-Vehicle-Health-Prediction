import React, { useState, useEffect } from 'react';
import { AlertNotification, VehicleHealthPrediction, ServiceCenter, VehicleLocation } from '../types';
import { sendRealNotification, sendDemoAlert, updateEmailSettings, fetchDispatchedHistory } from '../services/apiService';
import {
  ShieldAlert,
  Send,
  Flame,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Mail,
  PhoneCall,
  ExternalLink,
  RefreshCw,
  BellOff,
  Bell,
  Settings,
  Sparkles,
  Server,
  X,
  Info,
  Inbox,
  Eye,
  HelpCircle,
  KeyRound,
  MapPin,
  Navigation,
  Wrench,
  Star,
  Compass
} from 'lucide-react';

interface DispatchedEmailRecord {
  id: string;
  toEmail: string;
  toPhone?: string;
  subject: string;
  componentName: string;
  severity: 'Warning' | 'Critical' | 'Danger';
  healthScore: number;
  message: string;
  recommendation: string;
  timestamp: string;
  previewUrl?: string | false;
  gmailComposeUrl?: string;
  isTestAccount: boolean;
  location?: VehicleLocation;
  nearestServiceCenter?: ServiceCenter;
}

interface AlertsPanelProps {
  alerts: AlertNotification[];
  onSendDemoAlert: (componentName: string, channel: 'SMS' | 'Email', recipient: string) => void;
  onSilenceToastAlerts?: () => void;
  isToastMuted?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onSendDemoAlert,
  onSilenceToastAlerts,
  isToastMuted = false,
}) => {
  // Real Email & SMS Form State
  const [recipientEmail, setRecipientEmail] = useState('shettyvignesh91@gmail.com');
  const [recipientPhone, setRecipientPhone] = useState('+1 (555) 019-2831');
  const [selectedComponent, setSelectedComponent] = useState('Engine Coolant Overheat');
  const [selectedSeverity, setSelectedSeverity] = useState<'Warning' | 'Critical' | 'Danger'>('Danger');
  const [customMessage, setCustomMessage] = useState('Critical engine temperature spike detected (114°C). Immediate coolant check required.');
  
  // Custom SMTP configuration state
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // Dispatch status state
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // In-App Dispatched Emails Inbox State
  const [sentMailbox, setSentMailbox] = useState<DispatchedEmailRecord[]>([]);
  const [previewEmail, setPreviewEmail] = useState<DispatchedEmailRecord | null>(null);

  // Sync email settings with backend whenever recipient or SMTP settings change
  useEffect(() => {
    updateEmailSettings(
      recipientEmail,
      smtpHost ? { host: smtpHost, port: Number(smtpPort), user: smtpUser, pass: smtpPass } : undefined
    ).catch((err) => console.error('Failed to sync email settings:', err));
  }, [recipientEmail, smtpHost, smtpPort, smtpUser, smtpPass]);

  // Poll backend for auto-dispatched email history
  useEffect(() => {
    const loadDispatched = async () => {
      const serverDispatched = await fetchDispatchedHistory();
      if (serverDispatched && serverDispatched.length > 0) {
        setSentMailbox((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = serverDispatched.filter((item: any) => !existingIds.has(item.id));
          if (newItems.length > 0) {
            return [...newItems, ...prev];
          }
          return prev;
        });
      }
    };

    loadDispatched();
    const interval = setInterval(loadDispatched, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mock vehicle location and service centers data for display
  const currentLocation: VehicleLocation = {
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Outer Ring Road (NH 44), KM 18, Bengaluru, KA 560103',
    city: 'Bengaluru',
    state: 'Karnataka',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=12.9716,77.5946',
    nearestServiceCenters: [
      {
        id: 'sc_1',
        name: 'Bosch Car Service - Indiranagar',
        address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
        distanceKm: 1.2,
        phone: '+91 98765 43210',
        rating: 4.8,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Indiranagar+Bengaluru',
        isOpen24x7: true,
        specialty: 'Engine Diagnostics, Coolant Flush & ECU Calibration',
      },
      {
        id: 'sc_2',
        name: 'Multi-Brand Authorized Auto Care - Domlur',
        address: 'Old Airport Rd, Near Domlur Flyover, Bengaluru, KA 560071',
        distanceKm: 2.5,
        phone: '+91 80 2520 1122',
        rating: 4.6,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Multi+Brand+AutoCare+Domlur+Bengaluru',
        isOpen24x7: false,
        specialty: 'Brake Disc Replacement, Suspension & Fluid Flush',
      },
      {
        id: 'sc_3',
        name: 'Authorized Auto Care & Rapid Service - Koramangala',
        address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru, KA 560034',
        distanceKm: 3.8,
        phone: '+91 80 4110 5500',
        rating: 4.9,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Authorized+AutoCare+Koramangala+Bengaluru',
        isOpen24x7: true,
        specialty: 'Battery Diagnostic, Electrical & Fast Express Service',
      },
    ],
  };

  const handleSendRealNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setDispatchResult(null);
    setDispatchError(null);

    const healthVal = selectedSeverity === 'Danger' ? 25 : selectedSeverity === 'Critical' ? 45 : 68;
    const rec = `Inspect ${selectedComponent} immediately at ${currentLocation.nearestServiceCenters[0].name} (${currentLocation.nearestServiceCenters[0].distanceKm} km away).`;

    try {
      const res = await sendRealNotification({
        toEmail: recipientEmail,
        toPhone: recipientPhone,
        componentName: selectedComponent,
        severity: selectedSeverity,
        healthScore: healthVal,
        message: customMessage,
        recommendation: rec,
        customSmtp: smtpHost ? { host: smtpHost, port: Number(smtpPort), user: smtpUser, pass: smtpPass } : undefined,
      });

      if (res.success && res.dispatch?.emailSent) {
        setDispatchResult(res.dispatch);

        const newRecord: DispatchedEmailRecord = {
          id: `email_${Date.now()}`,
          toEmail: recipientEmail,
          toPhone: recipientPhone,
          subject: `[${selectedSeverity.toUpperCase()}] Vehicle Maintenance Alert: ${selectedComponent}`,
          componentName: selectedComponent,
          severity: selectedSeverity,
          healthScore: healthVal,
          message: customMessage,
          recommendation: rec,
          timestamp: new Date().toLocaleTimeString(),
          previewUrl: res.dispatch.previewUrl,
          gmailComposeUrl: res.dispatch.gmailComposeUrl,
          isTestAccount: false,
          location: currentLocation,
          nearestServiceCenter: currentLocation.nearestServiceCenters[0],
        };

        setSentMailbox((prev) => [newRecord, ...prev]);
        setPreviewEmail(newRecord);
      } else {
        setDispatchError(res.error || res.dispatch?.message || 'Failed to send notification');
      }
    } catch (err: any) {
      setDispatchError(err.message || 'Error connecting to email/SMS server');
    } finally {
      setIsSending(false);
    }
  };

  // Helper to open Gmail Compose Web Window directly
  const openDirectGmailCompose = () => {
    const subject = encodeURIComponent(`[${selectedSeverity.toUpperCase()}] Vehicle Maintenance Alert: ${selectedComponent}`);
    const body = encodeURIComponent(
      `🚨 VEHICLE MAINTENANCE ALERT: ${selectedComponent}\n\n` +
      `Severity: ${selectedSeverity}\n` +
      `Alert Message: ${customMessage}\n\n` +
      `📍 CURRENT VEHICLE LOCATION:\n` +
      `${currentLocation.address} (GPS: ${currentLocation.latitude}, ${currentLocation.longitude})\n` +
      `Map Link: ${currentLocation.googleMapsUrl}\n\n` +
      `🛠️ NEAREST AUTHORIZED SERVICE CENTER:\n` +
      `1. ${currentLocation.nearestServiceCenters[0].name} (${currentLocation.nearestServiceCenters[0].distanceKm} km away)\n` +
      `   Address: ${currentLocation.nearestServiceCenters[0].address}\n` +
      `   Phone: ${currentLocation.nearestServiceCenters[0].phone}\n` +
      `   Directions: ${currentLocation.nearestServiceCenters[0].googleMapsUrl}\n\n` +
      `🔧 Recommended Action:\nInspect ${selectedComponent} immediately.\n\n` +
      `-- Sent from Vehicle AI Diagnostic System`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Strip */}
      <div className="bg-[#111820] border border-slate-800/80 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-600/20 rounded-xl border border-red-500/30 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Emergency Diagnostic Alert & Communication Center</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Automated Email & GPS Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated notifications with real-time GPS location telemetry & nearest service centers.
            </p>
          </div>
        </div>

        {/* Silence Toast Popup Control */}
        {onSilenceToastAlerts && (
          <button
            onClick={onSilenceToastAlerts}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              isToastMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isToastMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-emerald-400" />}
            <span>{isToastMuted ? 'Popup Banners: Silenced' : 'Silence Popup Banners'}</span>
          </button>
        )}
      </div>

      {/* Automatic email delivery status */}
      <div className="p-4 bg-indigo-950/70 border border-indigo-500/40 rounded-2xl text-xs space-y-2 text-indigo-200 shadow-xl">
        <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
          <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>Automatic Email Alerts</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          When a Warning, Critical, or Danger status appears, the server emails <strong>{recipientEmail}</strong> automatically — no Gmail compose click required. Configure Gmail SMTP below (host <code className="text-indigo-300">smtp.gmail.com</code> + 16-character App Password) for reliable inbox delivery.
        </p>
      </div>

      {/* GPS Location & Nearest Service Center Live Card */}
      <div className="bg-[#111820] border border-slate-800/80 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Vehicle Current GPS Location & Emergency Service Centers</span>
              </h3>
              <p className="text-xs text-slate-400">{currentLocation.address}</p>
            </div>
          </div>
          <a
            href={currentLocation.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl border border-indigo-500/30 text-xs font-bold transition-all"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Open Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Service Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentLocation.nearestServiceCenters.map((sc, index) => (
            <div
              key={sc.id}
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                index === 0
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-100 shadow-md shadow-indigo-900/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-white text-xs flex items-center space-x-1">
                  <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{sc.name}</span>
                </span>
                <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 shrink-0">
                  {sc.distanceKm} km away
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2">{sc.address}</p>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                <span className="text-emerald-400 font-mono font-bold flex items-center space-x-1">
                  <PhoneCall className="w-3 h-3" />
                  <span>{sc.phone}</span>
                </span>
                <span className="text-amber-400 font-bold flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{sc.rating}</span>
                </span>
              </div>

              <a
                href={sc.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[11px] font-bold transition-all mt-1"
              >
                <Navigation className="w-3 h-3 text-indigo-400" />
                <span>Navigate Directions</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Real Email & SMS Dispatcher Form */}
        <div className="lg:col-span-6 bg-[#111820] border border-slate-800/80 rounded-lg p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <span>Real Email & SMS Dispatch Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Send live HTML diagnostic reports with Location & Service Centers directly to driver inbox.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSmtpSettings(!showSmtpSettings)}
              className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 transition-all flex items-center space-x-1.5 text-xs font-bold"
              title="Configure Custom SMTP Server"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>{showSmtpSettings ? 'Hide Settings' : 'Gmail / Custom SMTP Settings'}</span>
            </button>
          </div>

          {/* Optional Custom SMTP Accordion */}
          {showSmtpSettings && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-500/30 text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center space-x-1.5 text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                  <span>Send Direct to Gmail Inbox Setup</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Port 587 (TLS)</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                To receive emails in your real Gmail inbox directly from server background, enter <code className="text-indigo-300">smtp.gmail.com</code> and a 16-character <strong>Gmail App Password</strong> (Google Account &gt; Security &gt; App Passwords).
              </p>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-400">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Port</label>
                  <input
                    type="text"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Gmail Address</label>
                  <input
                    type="text"
                    placeholder="shettyvignesh91@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">16-char App Password</label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSendRealNotification} className="space-y-4 text-xs">
            
            {/* Target Email & Phone Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Recipient Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="shettyvignesh91@gmail.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center space-x-1">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recipient Phone Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="+1 (555) 019-2831"
                />
              </div>
            </div>

            {/* Component & Severity Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Fault Component</label>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Engine Coolant Overheat">Engine Coolant Overheat (&gt;110°C)</option>
                  <option value="Brake Pads Friction">Brake Pads Friction Loss (&lt;20% Thickness)</option>
                  <option value="Battery Power Loss">Battery Power Loss (&lt;11.2 Volt)</option>
                  <option value="Tyres Tread Wear">Tyres Tread Depleted (&lt;2mm)</option>
                  <option value="Engine Oil Viscosity">Engine Oil Contaminated</option>
                  <option value="Timing Belt Tension">Timing Belt Slack / Stress</option>
                  <option value="Air Intake Filter">Air Intake Filter Clogged</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alert Severity Level</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="Danger" className="text-red-400 font-bold">DANGER (Immediate Action Required)</option>
                  <option value="Critical" className="text-orange-400 font-bold">CRITICAL (Service within 100km)</option>
                  <option value="Warning" className="text-amber-400 font-bold">WARNING (Routine Check Needed)</option>
                </select>
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Alert Message</label>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            {/* Submit Dispatch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Dispatch Diagnostic Email Report</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={openDirectGmailCompose}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-white" />
                <span>Send Direct via Gmail Web App</span>
              </button>
            </div>
          </form>

          {/* Error Message */}
          {dispatchError && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          {/* Success Dispatch Results & Live Email Preview Card */}
          {dispatchResult && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Alert email sent to {recipientEmail}</span>
              </div>

              <p className="text-slate-200">{dispatchResult.message}</p>
            </div>
          )}

        </div>

        {/* Right Column: In-App Received Email Inbox & Live Alert History Log */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Dispatched Emails Inbox Log */}
          <div className="bg-[#111820] border border-slate-800/80 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Inbox className="w-4 h-4 text-indigo-400" />
                <span>Sent Alert Emails ({sentMailbox.length})</span>
              </h3>
              <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Auto + Manual Dispatch
              </span>
            </div>

            {sentMailbox.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No diagnostic emails sent yet. Use the form on the left to dispatch an email report!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sentMailbox.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-bold text-white">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>To: {mail.toEmail}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-slate-900 font-mono text-indigo-300">
                          {mail.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{mail.timestamp}</span>
                    </div>

                    <p className="text-slate-300 font-mono text-[11px] truncate">{mail.subject}</p>

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => setPreviewEmail(mail)}
                        className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-bold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read Full Email HTML Body</span>
                      </button>

                      {mail.previewUrl && (
                        <a
                          href={mail.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-bold text-[11px]"
                        >
                          <span>Open in Ethereal Sandbox</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-Time Diagnostic Alert History Log */}
          <div className="bg-[#111820] border border-slate-800/80 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Real-Time Diagnostic Alerts Audit Trail ({alerts.length})</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live Polling 2Hz
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                <span>No active critical alerts. Vehicle telemetry nominal.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {alerts.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      item.severity === 'Danger'
                        ? 'bg-red-950/30 border-red-500/40 text-red-200'
                        : item.severity === 'Critical'
                        ? 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item.severity === 'Danger' ? (
                          <Flame className="w-4 h-4 text-red-400 shrink-0" />
                        ) : item.severity === 'Critical' ? (
                          <AlertOctagon className="w-4 h-4 text-orange-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-bold text-white">{item.component_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-900 border border-slate-700">
                          {item.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-[11px]">{item.message}</p>

                    {item.nearestServiceCenter && (
                      <div className="text-[10px] text-indigo-300 flex items-center space-x-1 font-mono pt-1">
                        <Wrench className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>Nearest Center: <strong>{item.nearestServiceCenter.name}</strong> ({item.nearestServiceCenter.distanceKm} km)</span>
                      </div>
                    )}

                    <div className="text-[10px] text-indigo-300 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span>💡 {item.recommendation}</span>
                      <button
                        onClick={() => {
                          setSelectedComponent(item.component_name);
                          setSelectedSeverity(item.severity);
                          setCustomMessage(item.message);
                        }}
                        className="text-indigo-400 underline hover:text-indigo-300 font-bold"
                      >
                        Resend Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* HTML Email Modal Reader */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111820] border border-slate-800/80 rounded-xl w-full max-w-2xl p-6 relative my-8 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{previewEmail.subject}</h3>
                  <p className="text-xs text-slate-400">Recipient: {previewEmail.toEmail} • {previewEmail.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Rendered Card */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                    🚨 VEHICLE MAINTENANCE DIAGNOSTIC REPORT
                  </span>
                  <span className="text-xs text-slate-300 font-bold">{previewEmail.componentName}</span>
                </div>
                <span className="px-2.5 py-1 bg-red-950 text-red-300 rounded-full text-xs font-bold font-mono border border-red-800">
                  {previewEmail.severity} ({previewEmail.healthScore}% Health)
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {previewEmail.message}
              </p>

              {/* Location Card inside Email preview */}
              {previewEmail.location && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <div className="font-bold text-indigo-300 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>Vehicle Location:</span>
                  </div>
                  <p className="text-slate-300">{previewEmail.location.address}</p>
                  <a
                    href={previewEmail.location.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline font-bold text-[11px] inline-block pt-1"
                  >
                    🔗 View on Google Maps
                  </a>
                </div>
              )}

              {/* Nearest Service Center inside Email preview */}
              {previewEmail.nearestServiceCenter && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-xs text-indigo-200 space-y-1">
                  <div className="font-bold text-white flex items-center space-x-1">
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nearest Service Center:</span>
                  </div>
                  <div className="font-bold text-indigo-300">{previewEmail.nearestServiceCenter.name} ({previewEmail.nearestServiceCenter.distanceKm} km away)</div>
                  <div className="text-slate-300">{previewEmail.nearestServiceCenter.address}</div>
                  <div className="text-emerald-400 font-mono font-bold pt-1">📞 {previewEmail.nearestServiceCenter.phone}</div>
                </div>
              )}

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-indigo-200 font-mono">
                <strong>🔧 Recommended Action:</strong><br/>
                {previewEmail.recommendation}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {previewEmail.previewUrl && (
                  <a
                    href={previewEmail.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    <span>Open in Ethereal Sandbox</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {previewEmail.gmailComposeUrl && (
                  <a
                    href={previewEmail.gmailComposeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    <span>Send via Gmail</span>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


