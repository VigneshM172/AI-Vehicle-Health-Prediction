import React, { useEffect, useState } from 'react';
import { Mail, KeyRound, FileSpreadsheet, Settings, AlertCircle } from 'lucide-react';
import { updateEmailSettings, fetchEmailSettings } from '../services/apiService';
import { DashboardCard, SectionHeader } from './ui/DashboardCard';

interface SettingsPanelProps {
  onOpenCsvModal: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onOpenCsvModal }) => {
  const [recipientEmail, setRecipientEmail] = useState('shettyvignesh91@gmail.com');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  // Load current settings on mount
  useEffect(() => {
    fetchEmailSettings()
      .then((data) => {
        setRecipientEmail(data.recipientEmail || 'shettyvignesh91@gmail.com');
        setSmtpConfigured(data.smtpConfigured || false);
        if (data.customSmtp) {
          setSmtpHost(data.customSmtp.host || '');
          setSmtpPort(data.customSmtp.port?.toString() || '587');
          setSmtpUser(data.customSmtp.user || '');
          // Password is not returned for security
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load email settings:', err);
        setLoading(false);
      });
  }, []);

  // Debounced update function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only send SMTP update if all fields are filled, or if explicitly clearing
      let smtpUpdate;
      if (smtpHost && smtpUser && smtpPass) {
        smtpUpdate = { host: smtpHost, port: Number(smtpPort), user: smtpUser, pass: smtpPass };
      } else if (!smtpHost && !smtpUser && !smtpPass) {
        smtpUpdate = null; // Clear SMTP
      } else {
        smtpUpdate = undefined; // Don't update SMTP settings (partial info)
      }

      updateEmailSettings(recipientEmail, smtpUpdate)
        .then(() => {
          setSaved(true);
          setError('');
          setTimeout(() => setSaved(false), 2000);
        })
        .catch((err) => {
          setError('Failed to save settings: ' + err.message);
          console.error('Failed to sync email settings:', err);
        });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [recipientEmail, smtpHost, smtpPort, smtpUser, smtpPass]);

  return (
    <div className="space-y-6 max-w-3xl">
      <DashboardCard>
        <SectionHeader
          title="CSV Batch Testing"
          description="Upload historical telemetry datasets to run batch Random Forest ML inference."
          icon={<FileSpreadsheet className="w-4 h-4" />}
        />
        <p className="text-sm text-slate-400 mb-4">
          Process CSV files containing vehicle telemetry records and evaluate batch predictions with export and alert capabilities.
        </p>
        <button type="button" onClick={onOpenCsvModal} className="btn-primary">
          <FileSpreadsheet className="w-4 h-4" />
          Open CSV Batch Tester
        </button>
      </DashboardCard>

      <DashboardCard>
        <SectionHeader
          title="Email & SMTP Configuration"
          description="Configure recipient email and optional Gmail SMTP for automated inbox delivery."
          icon={<Settings className="w-4 h-4" />}
        />

        <div className="space-y-4">
          <div>
            <label htmlFor="settings-email" className="block text-xs font-medium text-slate-400 mb-1.5">
              Default Recipient Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="input-field font-mono"
              placeholder="shettyvignesh91@gmail.com"
            />
          </div>

          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <KeyRound className="w-4 h-4 text-blue-400" />
                Gmail / Custom SMTP (Optional)
              </div>
              {smtpConfigured && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  Configured
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter <code className="text-slate-400">smtp.gmail.com</code> and a 16-character Gmail App Password for direct inbox delivery.
              {smtpUser && !smtpPass && (
                <span className="text-amber-400 ml-2">Password cleared for security - re-enter to update SMTP settings</span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="smtp-host" className="block text-[11px] text-slate-500 mb-1">SMTP Host</label>
                <input
                  id="smtp-host"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="smtp-port" className="block text-[11px] text-slate-500 mb-1">Port</label>
                <input
                  id="smtp-port"
                  type="text"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="smtp-user" className="block text-[11px] text-slate-500 mb-1">Gmail Address</label>
                <input
                  id="smtp-user"
                  type="text"
                  placeholder="your@gmail.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="smtp-pass" className="block text-[11px] text-slate-500 mb-1">App Password</label>
                <input
                  id="smtp-pass"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {saved && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Settings synced with server
            </p>
          )}
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
          {loading && (
            <p className="text-xs text-slate-500">Loading settings...</p>
          )}
        </div>
      </DashboardCard>
    </div>
  );
};
