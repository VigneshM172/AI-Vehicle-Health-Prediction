import nodemailer from 'nodemailer';
import { locationServiceInstance } from './location_service.js';
import { VehicleLocation } from '../src/types.js';

export interface EmailSmsDispatchPayload {
  toEmail: string;
  toPhone?: string;
  componentName: string;
  severity: 'Warning' | 'Critical' | 'Danger';
  healthScore: number;
  message: string;
  recommendation: string;
  location?: VehicleLocation;
  sensorSnapshot?: {
    engine_temp: number;
    battery_voltage: number;
    rpm: number;
    speed: number;
  };
  customSmtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
  };
}

export interface DispatchResult {
  success: boolean;
  emailSent: boolean;
  smsSent: boolean;
  message: string;
  previewUrl?: string | false;
  gmailComposeUrl?: string;
  timestamp: string;
  details?: any;
}

interface SmtpAuth {
  host: string;
  port: number;
  user: string;
  pass: string;
}

function normalizeAppPassword(pass: string): string {
  return pass.replace(/\s+/g, '');
}

function isCompleteSmtp(smtp?: EmailSmsDispatchPayload['customSmtp']): smtp is SmtpAuth {
  return Boolean(smtp?.host?.trim() && smtp?.user?.trim() && smtp?.pass?.trim());
}

function resolveSmtp(customSmtp?: EmailSmsDispatchPayload['customSmtp']): SmtpAuth | null {
  if (isCompleteSmtp(customSmtp)) {
    return {
      host: customSmtp.host.trim(),
      port: Number(customSmtp.port || 587),
      user: customSmtp.user.trim(),
      pass: normalizeAppPassword(customSmtp.pass),
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST.trim(),
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER.trim(),
      pass: normalizeAppPassword(process.env.SMTP_PASS),
    };
  }

  return null;
}

function createTransporter(smtp: SmtpAuth): nodemailer.Transporter {
  const isGmail = /gmail|google/i.test(smtp.host) || /@gmail\.com$/i.test(smtp.user);

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    requireTLS: smtp.port === 587,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}

async function sendViaFormSubmit(
  toEmail: string,
  subject: string,
  textBody: string
): Promise<{ ok: boolean; info: string }> {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: 'Vehicle AI Alert System',
        email: toEmail,
        _subject: subject,
        message: textBody,
        _template: 'box',
        _captcha: false,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (response.ok && (body.success === 'true' || body.success === true)) {
      return { ok: true, info: 'Delivered via FormSubmit mail gateway' };
    }

    return {
      ok: false,
      info: body.message || `FormSubmit returned HTTP ${response.status}`,
    };
  } catch (err: any) {
    return { ok: false, info: err.message || 'FormSubmit request failed' };
  }
}

function buildEmailBodies(payload: EmailSmsDispatchPayload) {
  const loc = payload.location || locationServiceInstance.getCurrentVehicleLocation();
  const nearestSc = loc.nearestServiceCenters[0];
  const {
    componentName,
    severity,
    healthScore,
    message,
    recommendation,
    sensorSnapshot,
  } = payload;

  const serviceCenterHtml = loc.nearestServiceCenters
    .map(
      (sc, idx) => `
      <div style="background: #0f172a; padding: 12px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 14px;">#${idx + 1} ${sc.name}</strong>
          <span style="background: #0284c7; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${sc.distanceKm} km away</span>
        </div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">📍 ${sc.address}</div>
        <div style="font-size: 12px; color: #a855f7; margin-top: 2px;">📞 Phone: ${sc.phone} | ⭐ ${sc.rating}/5</div>
        <div style="font-size: 11px; color: #34d399; margin-top: 2px;">🔧 Specialty: ${sc.specialty}</div>
        <div style="margin-top: 8px;">
          <a href="${sc.googleMapsUrl}" target="_blank" style="display: inline-block; padding: 6px 12px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold;">📍 Navigate via Google Maps</a>
        </div>
      </div>
    `
    )
    .join('');

  const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 620px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; }
          .header { border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
          .title { color: #f43f5e; font-size: 20px; font-weight: bold; margin: 0; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; background: #9f1239; color: #fecdd3; margin-top: 8px; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #818cf8; letter-spacing: 0.5px; margin: 16px 0 8px 0; }
          .location-box { background: #0f172a; padding: 14px; border-radius: 10px; border: 1px solid #334155; margin: 12px 0; }
          .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
          .metric-card { background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155; }
          .metric-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
          .metric-val { font-size: 16px; font-weight: bold; color: #38bdf8; margin-top: 4px; }
          .recommendation { background: #1e1b4b; border-left: 4px solid #6366f1; padding: 12px; border-radius: 6px; font-size: 13px; color: #c7d2fe; margin-top: 16px; }
          .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="title">🚨 VEHICLE MAINTENANCE ALERT: ${componentName.toUpperCase()}</h2>
            <div class="badge">SEVERITY: ${severity.toUpperCase()}</div>
          </div>

          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.5;">
            ${message}
          </p>

          <div class="section-title">📍 Current Vehicle Location</div>
          <div class="location-box">
            <strong style="color: #ffffff; font-size: 13px;">${loc.address}</strong>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">GPS Coordinates: ${loc.latitude}, ${loc.longitude}</div>
            <div style="margin-top: 8px;">
              <a href="${loc.googleMapsUrl}" target="_blank" style="color: #38bdf8; font-size: 12px; font-weight: bold;">🔗 Open Live Vehicle Location on Google Maps</a>
            </div>
          </div>

          <div class="section-title">📊 Live OBD-II Telemetry Snapshot</div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Component Health Score</div>
              <div class="metric-val" style="color: ${healthScore < 40 ? '#f43f5e' : '#f59e0b'};">${healthScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Engine Coolant Temp</div>
              <div class="metric-val">${sensorSnapshot?.engine_temp ?? 'N/A'} °C</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Battery Voltage</div>
              <div class="metric-val">${sensorSnapshot?.battery_voltage ?? 'N/A'} V</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Engine RPM / Speed</div>
              <div class="metric-val">${sensorSnapshot?.rpm ?? 'N/A'} RPM (${sensorSnapshot?.speed ?? 'N/A'} km/h)</div>
            </div>
          </div>

          <div class="recommendation">
            <strong>🔧 Recommended Diagnostic Action:</strong><br/>
            ${recommendation}
          </div>

          <div class="section-title">🛠️ Nearest Authorized Service Centers & Emergency Towing</div>
          ${serviceCenterHtml}

          <div class="footer">
            Vehicle Health Prediction & AI Predictive Maintenance System • Random Forest ML Model<br/>
            Automated Diagnostic Alert System
          </div>
        </div>
      </body>
      </html>
    `;

  const textBody =
    `VEHICLE MAINTENANCE ALERT: ${componentName} - ${severity}.\n` +
    `Health: ${healthScore}%\n` +
    `Message: ${message}\n` +
    `Location: ${loc.address}\n` +
    `Nearest Service Center: ${nearestSc.name} (${nearestSc.distanceKm} km away) - Phone: ${nearestSc.phone}\n` +
    `Action: ${recommendation}`;

  const mailSubject = `[${severity.toUpperCase()}] Vehicle Maintenance Alert: ${componentName} - Location & Service Center Attached`;

  return { loc, nearestSc, htmlBody, textBody, mailSubject };
}

export function isSmtpConfigured(customSmtp?: EmailSmsDispatchPayload['customSmtp']): boolean {
  return resolveSmtp(customSmtp) !== null;
}

/**
 * Sends a real alert email to the recipient.
 * Priority: custom SMTP → .env SMTP → FormSubmit gateway (no inbox compose click required).
 */
export async function dispatchRealNotification(payload: EmailSmsDispatchPayload): Promise<DispatchResult> {
  const { toEmail, toPhone, customSmtp } = payload;
  const { loc, nearestSc, htmlBody, textBody, mailSubject } = buildEmailBodies(payload);

  let emailSent = false;
  let deliveryChannel = 'none';
  let messageId = `msg_${Date.now()}`;
  let lastError = '';

  try {
    const smtp = resolveSmtp(customSmtp);

    if (smtp) {
      try {
        const transporter = createTransporter(smtp);
        const info = await transporter.sendMail({
          from: `"Vehicle AI Alert System" <${smtp.user}>`,
          to: toEmail,
          subject: mailSubject,
          text: textBody,
          html: htmlBody,
        });
        messageId = info.messageId || messageId;
        emailSent = true;
        deliveryChannel = `SMTP (${smtp.host})`;
      } catch (sendErr: any) {
        lastError = sendErr?.message || String(sendErr);
        console.warn('SMTP sendMail failed, trying FormSubmit fallback:', lastError);
      }
    }

    if (!emailSent) {
      const gateway = await sendViaFormSubmit(toEmail, mailSubject, textBody);
      if (gateway.ok) {
        emailSent = true;
        deliveryChannel = gateway.info;
      } else {
        lastError = lastError ? `${lastError}; ${gateway.info}` : gateway.info;
      }
    }

    const emailBodyEncoded = encodeURIComponent(
      `🚨 VEHICLE MAINTENANCE ALERT: ${payload.componentName}\n\n` +
        `Severity: ${payload.severity}\n` +
        `Health Score: ${payload.healthScore}%\n` +
        `Alert Message: ${payload.message}\n\n` +
        `📍 CURRENT VEHICLE LOCATION:\n` +
        `${loc.address} (GPS: ${loc.latitude}, ${loc.longitude})\n` +
        `Map Link: ${loc.googleMapsUrl}\n\n` +
        `🛠️ NEAREST AUTHORIZED SERVICE CENTER:\n` +
        `1. ${nearestSc.name} (${nearestSc.distanceKm} km away)\n` +
        `   Address: ${nearestSc.address}\n` +
        `   Phone: ${nearestSc.phone}\n` +
        `   Map Directions: ${nearestSc.googleMapsUrl}\n\n` +
        `🔧 Recommended Action:\n${payload.recommendation}\n\n` +
        `-- Sent from Vehicle AI Diagnostic Predictive Maintenance System`
    );

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(mailSubject)}&body=${emailBodyEncoded}`;

    let smsSent = false;
    let smsDetails = '';

    if (toPhone) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  'Basic ' +
                  Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: toPhone,
                From: process.env.TWILIO_PHONE_NUMBER,
                Body: `🚨 VEHICLE ALERT [${payload.severity}]: ${payload.componentName} health ${payload.healthScore}%. Location: ${loc.address}. Nearest Service: ${nearestSc.name} (${nearestSc.phone})`,
              }),
            }
          );
          if (response.ok) {
            smsSent = true;
            smsDetails = `Twilio SMS dispatched to ${toPhone}`;
          } else {
            smsDetails = `Twilio API returned status ${response.status}`;
          }
        } catch (err: any) {
          smsDetails = `Twilio SMS error: ${err.message}`;
        }
      } else {
        smsDetails = `SMS skipped (Twilio not configured) for ${toPhone}`;
      }
    }

    if (!emailSent) {
      return {
        success: false,
        emailSent: false,
        smsSent,
        message:
          `Failed to deliver email to ${toEmail}. ${lastError || 'No SMTP credentials.'} ` +
          `Add SMTP_HOST / SMTP_USER / SMTP_PASS in .env (Gmail App Password) or Alert Center SMTP settings.`,
        gmailComposeUrl,
        timestamp: new Date().toISOString(),
        details: {
          messageId,
          recipientEmail: toEmail,
          recipientPhone: toPhone,
          isTestAccount: false,
          smtpConfigured: Boolean(smtp),
          location: loc,
          nearestServiceCenter: nearestSc,
          smsDetails,
        },
      };
    }

    return {
      success: true,
      emailSent: true,
      smsSent,
      message: `Alert email sent automatically to ${toEmail} via ${deliveryChannel}. ${smsDetails}`.trim(),
      gmailComposeUrl,
      timestamp: new Date().toISOString(),
      details: {
        messageId,
        recipientEmail: toEmail,
        recipientPhone: toPhone,
        isTestAccount: false,
        deliveryChannel,
        smtpConfigured: Boolean(smtp),
        location: loc,
        nearestServiceCenter: nearestSc,
        smsDetails,
      },
    };
  } catch (err: any) {
    console.error('Error dispatching notification:', err);
    return {
      success: false,
      emailSent: false,
      smsSent: false,
      message: `Failed to dispatch email: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}
