import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { obdSimulatorInstance } from './backend/obd_simulator.js';
import { FeatureAdapterDataProcessor } from './backend/data_processor.js';
import { rfModelEngine } from './backend/random_forest_model.js';
import { alertServiceInstance } from './backend/alert_service.js';
import { dispatchRealNotification, isSmtpConfigured } from './backend/notification_dispatch.js';
import { locationServiceInstance } from './backend/location_service.js';

import {
  OBDSensorData,
  VehicleHealthPrediction,
  CSVDataRow,
  SimulationScenario,
} from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------
// IN-MEMORY STATE
// ----------------------------------------------------

const predictionHistoryBuffer: VehicleHealthPrediction[] = [];

const AUTO_EMAIL_COOLDOWN_MS = 45000;

let lastAutoDispatchKey = '';
let lastAutoDispatchTime = 0;
let autoDispatchInFlight = false;

let userRecipientEmail =
  process.env.ALERT_RECIPIENT_EMAIL?.trim() || 'shettyvignesh91@gmail.com';

let activeCustomSmtp: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
} | null = null;

const autoDispatchedEmailsHistory: any[] = [];

function recordDispatchHistory(entry: Record<string, unknown>) {
  autoDispatchedEmailsHistory.unshift({
    id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...entry,
  });
  if (autoDispatchedEmailsHistory.length > 50) {
    autoDispatchedEmailsHistory.pop();
  }
}

async function tryAutoDispatchEmail(
  prediction: VehicleHealthPrediction,
  sensorData: OBDSensorData,
  scenario?: SimulationScenario
) {
  // Only process if explicitly DANGER scenario or no scenario provided (for backward compatibility)
  if (scenario && scenario !== 'DANGER') {
    return;
  }

  const anomalyComponents = prediction.components.filter((c) => c.risk_level >= 3); // Only DANGER level (risk_level 3)
  if (anomalyComponents.length === 0 || autoDispatchInFlight) {
    return;
  }

  autoDispatchInFlight = true;

  // Process each anomalous component
  for (const anomalyComp of anomalyComponents) {
    const severity: 'Danger' = 'Danger'; // Only DANGER level components are filtered

    const dispatchKey = `${anomalyComp.name}:${severity}`;
    const now = Date.now();
    if (dispatchKey === lastAutoDispatchKey && now - lastAutoDispatchTime < AUTO_EMAIL_COOLDOWN_MS) {
      continue; // Skip if this specific alert was sent recently
    }

    lastAutoDispatchKey = dispatchKey;
    lastAutoDispatchTime = now;

    const location = prediction.location || locationServiceInstance.getCurrentVehicleLocation();

    console.log(
      `[AUTO-MAILING TRIGGERED] ${anomalyComp.name} (${severity}) → ${userRecipientEmail}`
    );

    try {
      const res = await dispatchRealNotification({
        toEmail: userRecipientEmail,
        toPhone: process.env.ALERT_RECIPIENT_PHONE,
        componentName: anomalyComp.name,
        severity,
        healthScore: anomalyComp.health,
        message:
          `${anomalyComp.name} reached ${severity.toUpperCase()} status ` +
          `(${anomalyComp.health}% health, ${anomalyComp.wear}% wear). ` +
          `${anomalyComp.status_message}`,
        recommendation: anomalyComp.recommendation,
        location,
        sensorSnapshot: {
          engine_temp: sensorData.engine_temp,
          battery_voltage: sensorData.battery_voltage,
          rpm: sensorData.rpm,
          speed: sensorData.speed,
        },
        customSmtp: activeCustomSmtp || undefined,
      });

      if (res.emailSent) {
        console.log(`[AUTO-MAILING SUCCESS] Email delivered to ${userRecipientEmail}`);
      } else {
        console.error(`[AUTO-MAILING FAILED] ${res.message}`);
      }

      recordDispatchHistory({
        toEmail: userRecipientEmail,
        subject: `[${severity.toUpperCase()}] Vehicle Maintenance Alert: ${anomalyComp.name}`,
        componentName: anomalyComp.name,
        severity,
        healthScore: anomalyComp.health,
        message: `${anomalyComp.name} reached ${severity.toUpperCase()} status (${anomalyComp.health}% health).`,
        recommendation: anomalyComp.recommendation,
        timestamp: new Date().toLocaleTimeString(),
        previewUrl: res.previewUrl,
        gmailComposeUrl: res.gmailComposeUrl,
        isTestAccount: false,
        emailSent: res.emailSent,
        deliveryMessage: res.message,
        location,
        nearestServiceCenter: location.nearestServiceCenters[0],
      });
    } catch (err) {
      console.error(`Auto email dispatch error for ${anomalyComp.name}:`, err);
    }
  }
  autoDispatchInFlight = false;
}

// ----------------------------------------------------
// HELPER: CREATE SENSOR DATA
// ----------------------------------------------------

function createSensorData(
  body: any = {},
  defaults: Partial<OBDSensorData> = {}
): OBDSensorData {
  return {
    timestamp: new Date().toISOString(),

    rpm: Number(body.rpm ?? defaults.rpm ?? 2400),

    speed: Number(body.speed ?? defaults.speed ?? 50),

    engine_temp: Number(
      body.engine_temp ??
      defaults.engine_temp ??
      88
    ),

    engine_load: Number(
      body.engine_load ??
      defaults.engine_load ??
      body.load ??
      defaults.engine_load ??
      40
    ),

    throttle_position: Number(
      body.throttle_position ??
      defaults.throttle_position ??
      30
    ),

    battery_voltage: Number(
      body.battery_voltage ??
      defaults.battery_voltage ??
      14.1
    ),

    // ------------------------------------------------
    // ML FEATURES
    // ------------------------------------------------

    km_driven: Number(
      body.km_driven ??
      defaults.km_driven ??
      30000
    ),

    road_type_code: Number(
      body.road_type_code ??
      defaults.road_type_code ??
      1
    ),

    braking_style_code: Number(
      body.braking_style_code ??
      defaults.braking_style_code ??
      0
    ),

    component_age: Number(
      body.component_age ??
      defaults.component_age ??
      10
    ),
  };
}

// ----------------------------------------------------
// HELPER: ADD PREDICTION TO HISTORY
// ----------------------------------------------------

function addPredictionToHistory(
  prediction: VehicleHealthPrediction
) {
  predictionHistoryBuffer.unshift(prediction);

  if (predictionHistoryBuffer.length > 100) {
    predictionHistoryBuffer.pop();
  }
}

// ----------------------------------------------------
// SIMULATOR CALLBACK
// ----------------------------------------------------

obdSimulatorInstance.registerCallback(
  (sensorData, scenario, count) => {

    try {
      // Derive context from the current simulator reading
      const context =
        FeatureAdapterDataProcessor.deriveContextFeatures(
          sensorData,
          scenario,
          count
        );

      // Convert simulator data into the existing TypeScript
      // Random Forest input format
      const modelInput =
        FeatureAdapterDataProcessor.adaptFeaturesToModelInput(
          sensorData,
          context
        );

      // Existing TypeScript RF engine
      const prediction =
        rfModelEngine.predict(
          modelInput,
          sensorData,
          context
        );

      // Attach vehicle location
      const location =
        locationServiceInstance.getCurrentVehicleLocation();

      prediction.location = location;

      // Store prediction
      addPredictionToHistory(prediction);

      // Evaluate alerts
      alertServiceInstance.evaluatePrediction(prediction);

      // Only auto-dispatch emails in DANGER scenario
      if (scenario === 'DANGER') {
        void tryAutoDispatchEmail(prediction, sensorData, scenario);
      }

    } catch (error) {

      console.error(
        'Simulator prediction error:',
        error
      );
    }
  }
);

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 1. Health check

app.get(
  '/api/health',
  (req: Request, res: Response) => {

    res.json({
      status: 'ok',

      system:
        'Vehicle Health Prediction & Real-Time OBD Simulator',

      time:
        new Date().toISOString(),

      version: '2.1.0',
    });
  }
);

// ----------------------------------------------------
// 2. LIVE OBD DATA
// ----------------------------------------------------

app.get(
  '/api/obd/live',
  (req: Request, res: Response) => {

    try {

      const status =
        obdSimulatorInstance.getStatus();

      const sensorData =
        obdSimulatorInstance
          .getCurrentDataSnapshot();

      const context =
        FeatureAdapterDataProcessor
          .deriveContextFeatures(
            sensorData,
            status.scenario,
            status.readingsCount
          );

      const modelInput =
        FeatureAdapterDataProcessor
          .adaptFeaturesToModelInput(
            sensorData,
            context
          );

      const prediction =
        rfModelEngine.predict(
          modelInput,
          sensorData,
          context
        );

      prediction.location =
        locationServiceInstance
          .getCurrentVehicleLocation();

      res.json({
        success: true,
        status,
        sensorData,
        modelInput,
        prediction,
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error:
          err.message ||
          'Error fetching live OBD data',
      });
    }
  }
);

// ----------------------------------------------------
// 3. SIMULATOR CONTROL
// ----------------------------------------------------

app.post(
  '/api/obd/simulator/control',
  (req: Request, res: Response) => {

    try {

      const {
        action,
        scenario,
        speed,
      } = req.body;

      if (action === 'start') {
        obdSimulatorInstance.start();

      } else if (action === 'stop') {
        obdSimulatorInstance.stop();

      } else if (action === 'pause') {
        obdSimulatorInstance.pause();

      } else if (action === 'resume') {
        obdSimulatorInstance.resume();

      } else if (action === 'reset') {
        obdSimulatorInstance.reset();
      }

      if (
        scenario &&
        ['NORMAL', 'WARNING', 'DANGER']
          .includes(scenario)
      ) {

        obdSimulatorInstance.setScenario(
          scenario as SimulationScenario
        );
      }

      if (
        speed !== undefined &&
        typeof speed === 'number'
      ) {

        obdSimulatorInstance.setSpeed(speed);
      }

      res.json({
        success: true,

        message:
          `Simulator updated with action: ` +
          `${action || 'settings_update'}`,

        status:
          obdSimulatorInstance.getStatus(),
      });

    } catch (err: any) {

      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ----------------------------------------------------
// 4. SIMULATOR STATUS
// ----------------------------------------------------

app.get(
  '/api/obd/simulator/status',
  (req: Request, res: Response) => {

    res.json({
      success: true,

      status:
        obdSimulatorInstance.getStatus(),
    });
  }
);

// ----------------------------------------------------
// 5. SINGLE INPUT PREDICTION
// ----------------------------------------------------

app.post(
  '/api/predict',
  (req: Request, res: Response) => {

    try {

      const body = req.body;

      const sensorData =
        createSensorData(body);

      const validation =
        FeatureAdapterDataProcessor
          .validateSensorData(sensorData);

      if (!validation.valid) {

        return res.status(400).json({
          success: false,
          errors: validation.errors,
        });
      }

      const scenario:
        SimulationScenario =
        body.scenario &&
        ['NORMAL', 'WARNING', 'DANGER']
          .includes(body.scenario)
          ? body.scenario
          : 'NORMAL';

      const context =
        FeatureAdapterDataProcessor
          .deriveContextFeatures(
            sensorData,
            scenario,
            1
          );

      // Explicit context overrides
      if (
        body.km_driven !== undefined
      ) {

        context.km_driven =
          Number(body.km_driven);
      }

      if (body.road_type) {
        context.road_type =
          body.road_type;
      }

      if (body.braking_style) {
        context.braking_style =
          body.braking_style;
      }

      if (
        body.load !== undefined
      ) {

        context.load =
          Number(body.load);
      }

      if (
        body.component_age !== undefined
      ) {

        context.component_age =
          Number(body.component_age);
      }

      const modelInput =
        FeatureAdapterDataProcessor
          .adaptFeaturesToModelInput(
            sensorData,
            context
          );

      const prediction =
        rfModelEngine.predict(
          modelInput,
          sensorData,
          context
        );

      prediction.location =
        locationServiceInstance
          .getCurrentVehicleLocation();

      addPredictionToHistory(prediction);

      alertServiceInstance.evaluatePrediction(prediction);

      // Only auto-dispatch emails in DANGER scenario
      if (scenario === 'DANGER') {
        void tryAutoDispatchEmail(prediction, sensorData, scenario);
      }

      res.json({
        success: true,

        sensorData,

        modelInput,

        prediction,
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ----------------------------------------------------
// 6. CSV BATCH INFERENCE
// ----------------------------------------------------

app.post(
  '/api/predict/csv',
  (req: Request, res: Response) => {

    try {

      const {
        rows,
      } = req.body as {
        rows: CSVDataRow[];
      };

      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {

        return res.status(400).json({
          success: false,

          error:
            'Invalid CSV rows array provided.',
        });
      }

      const batchResults:
        VehicleHealthPrediction[] =
        rows.map((row, index) => {

          const sensorData =
            createSensorData(
              {
                rpm: row.rpm,
                speed: row.speed,
                engine_temp: row.engine_temp,
                load: row.load,
                throttle_position:
                  row.throttle_position,
                battery_voltage:
                  row.battery_voltage,

                km_driven:
                  row.km_driven,

                component_age:
                  row.component_age,
              },

              {
                rpm: 2200,
                speed: 55,
                engine_temp: 88,
                engine_load: row.load ?? 40,
                throttle_position: 25,
                battery_voltage: 14.0,

                km_driven:
                  row.km_driven ?? 25000,

                component_age:
                  row.component_age ?? 18,
              }
            );

          const context = {

            km_driven:
              Number(
                row.km_driven ?? 25000
              ),

            road_type:
              (row.road_type as any) ||
              'City',

            braking_style:
              (row.braking_style as any) ||
              'Moderate',

            load:
              Number(
                row.load ?? 40
              ),

            component_age:
              Number(
                row.component_age ?? 18
              ),
          };

          const modelInput =
            FeatureAdapterDataProcessor
              .adaptFeaturesToModelInput(
                sensorData,
                context
              );

          const prediction =
            rfModelEngine.predict(
              modelInput,
              sensorData,
              context
            );

          prediction.location =
            locationServiceInstance
              .getCurrentVehicleLocation();

          return prediction;
        });

      res.json({
        success: true,

        count:
          batchResults.length,

        predictions:
          batchResults,
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ----------------------------------------------------
// 7. SAMPLE CSV
// ----------------------------------------------------

app.get(
  '/api/dataset/sample-csv',
  (req: Request, res: Response) => {

    const sampleCSV =
`km_driven,road_type,braking_style,load,engine_temp,rpm,battery_voltage,component_age,speed,throttle_position
15000,Highway,Gentle,25,86,2100,14.2,10,65,25
22000,City,Moderate,40,90,2600,14.0,14,45,35
38000,City,Aggressive,60,99,3800,12.3,26,72,60
52000,Rough,Sudden,85,115,5200,11.1,40,110,88
12000,Highway,Gentle,20,84,1950,14.3,8,70,22
45000,Offroad,Aggressive,75,108,4400,11.9,32,85,75
29000,City,Moderate,35,89,2400,13.9,18,50,30
65000,Rough,Sudden,90,121,5800,10.6,48,125,95`;

    res.setHeader(
      'Content-Type',
      'text/csv'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sample_vehicle_telemetry.csv"'
    );

    res.send(sampleCSV);
  }
);

// ----------------------------------------------------
// 8. PREDICTION HISTORY
// ----------------------------------------------------

app.get(
  '/api/history',
  (req: Request, res: Response) => {

    res.json({
      success: true,

      history:
        predictionHistoryBuffer,
    });
  }
);

// ----------------------------------------------------
// 9. CLEAR HISTORY
// ----------------------------------------------------

app.delete(
  '/api/history',
  (req: Request, res: Response) => {

    predictionHistoryBuffer.length = 0;

    res.json({
      success: true,

      message:
        'Prediction history cleared',
    });
  }
);

// ----------------------------------------------------
// 10. ALERTS
// ----------------------------------------------------

app.get(
  '/api/alerts',
  (req: Request, res: Response) => {

    res.json({
      success: true,

      alerts:
        alertServiceInstance
          .getAlertsHistory(),
    });
  }
);

// ----------------------------------------------------
// 10B. EMAIL SETTINGS
// ----------------------------------------------------

app.get(
  '/api/settings/email',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      recipientEmail: userRecipientEmail,
      smtpConfigured: isSmtpConfigured(activeCustomSmtp || undefined),
      customSmtp: activeCustomSmtp ? {
        host: activeCustomSmtp.host,
        port: activeCustomSmtp.port,
        user: activeCustomSmtp.user,
        // Don't send the password back for security
      } : null,
    });
  }
);

app.post(
  '/api/settings/email',
  (req: Request, res: Response) => {

    const {
      email,
      customSmtp,
    } = req.body;

    if (
      email &&
      typeof email === 'string'
    ) {

      userRecipientEmail =
        email.trim();
    }

    // Only update SMTP if customSmtp is explicitly provided (not undefined)
    if (customSmtp !== undefined) {
      if (customSmtp?.host && customSmtp?.user) {
        // If password is provided, use it; otherwise keep existing password
        const existingPass = activeCustomSmtp?.pass || '';
        activeCustomSmtp = {
          host: String(customSmtp.host).trim(),
          port: Number(customSmtp.port || 587),
          user: String(customSmtp.user).trim(),
          pass: customSmtp?.pass ? String(customSmtp.pass) : existingPass,
        };
      } else if (customSmtp === null) {
        activeCustomSmtp = null;
      }
    }

    res.json({
      success: true,

      recipientEmail:
        userRecipientEmail,

      smtpConfigured:
        isSmtpConfigured(activeCustomSmtp || undefined),

      hasCustomSmtp:
        !!activeCustomSmtp,
    });
  }
);

// ----------------------------------------------------
// 10C. DISPATCH HISTORY
// ----------------------------------------------------

app.get(
  '/api/alerts/dispatched-history',
  (req: Request, res: Response) => {

    res.json({
      success: true,

      history:
        autoDispatchedEmailsHistory,
    });
  }
);

// ----------------------------------------------------
// 11. REAL EMAIL / SMS
// ----------------------------------------------------

app.post(
  '/api/alerts/send-real',
  async (req: Request, res: Response) => {

    try {

      const {
        toEmail,
        toPhone,
        componentName,
        severity,
        healthScore,
        message,
        recommendation,
        customSmtp,
      } = req.body;

      const sensorData =
        obdSimulatorInstance
          .getCurrentDataSnapshot();

      const dispatchRes =
        await dispatchRealNotification({

          toEmail:
            toEmail ||
            userRecipientEmail,

          toPhone:
            toPhone ||
            process.env.ALERT_RECIPIENT_PHONE,

          componentName:
            componentName ||
            'Engine',

          severity:
            severity ||
            'Danger',

          healthScore:
            healthScore ?? 35,

          message:
            message ||
            `Critical wear or temperature ` +
            `anomaly detected on ` +
            `${componentName || 'Engine'}.`,

          recommendation:
            recommendation ||
            'Schedule immediate vehicle ' +
            'diagnostic inspection.',

          sensorSnapshot: {

            engine_temp:
              sensorData.engine_temp,

            battery_voltage:
              sensorData.battery_voltage,

            rpm:
              sensorData.rpm,

            speed:
              sensorData.speed,
          },

          customSmtp: customSmtp || activeCustomSmtp || undefined,
        });

      const deliveredTo = toEmail || userRecipientEmail;

      alertServiceInstance
        .simulateManualDispatch(
          componentName ||
            'Engine Overheat',

          toEmail
            ? 'Email'
            : 'SMS',

          deliveredTo ||
            toPhone ||
            userRecipientEmail
        );

      recordDispatchHistory({
        toEmail: deliveredTo,
        toPhone,
        subject: `[${(severity || 'Danger').toString().toUpperCase()}] Vehicle Maintenance Alert: ${componentName || 'Engine'}`,
        componentName: componentName || 'Engine',
        severity: severity || 'Danger',
        healthScore: healthScore ?? 35,
        message: message || '',
        recommendation: recommendation || '',
        timestamp: new Date().toLocaleTimeString(),
        previewUrl: dispatchRes.previewUrl,
        gmailComposeUrl: dispatchRes.gmailComposeUrl,
        isTestAccount: false,
        emailSent: dispatchRes.emailSent,
        deliveryMessage: dispatchRes.message,
      });

      res.json({
        success: dispatchRes.success,
        dispatch: dispatchRes,
        error: dispatchRes.success ? undefined : dispatchRes.message,
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ----------------------------------------------------
// 12. MANUAL DEMO ALERT
// ----------------------------------------------------

app.post(
  '/api/alerts/demo-send',
  async (req: Request, res: Response) => {

    const {
      componentName,
      channel,
      recipient,
    } = req.body;

    const alert =
      alertServiceInstance
        .simulateManualDispatch(
          componentName ||
            'Engine Overheat',

          channel ||
            'SMS',

          recipient ||
            '+1 (555) 019-2831'
        );

    let realDispatchRes = null;

    const emailRecipient =
      recipient && recipient.includes('@')
        ? recipient
        : userRecipientEmail;

    {
      const sensorData =
        obdSimulatorInstance
          .getCurrentDataSnapshot();

      realDispatchRes =
        await dispatchRealNotification({

          toEmail: emailRecipient,

          toPhone:
            recipient &&
            !recipient.includes('@')
              ? recipient
              : process.env.ALERT_RECIPIENT_PHONE,

          componentName:
            componentName ||
            'Engine Overheat',

          severity:
            'Critical',

          healthScore:
            38,

          message:
            alert.message,

          recommendation:
            alert.recommendation,

          sensorSnapshot: {

            engine_temp:
              sensorData.engine_temp,

            battery_voltage:
              sensorData.battery_voltage,

            rpm:
              sensorData.rpm,

            speed:
              sensorData.speed,
          },

          customSmtp: activeCustomSmtp || undefined,
        });

      recordDispatchHistory({
        toEmail: emailRecipient,
        subject: `[CRITICAL] Vehicle Maintenance Alert: ${componentName || 'Engine Overheat'}`,
        componentName: componentName || 'Engine Overheat',
        severity: 'Critical',
        healthScore: 38,
        message: alert.message,
        recommendation: alert.recommendation,
        timestamp: new Date().toLocaleTimeString(),
        previewUrl: realDispatchRes.previewUrl,
        gmailComposeUrl: realDispatchRes.gmailComposeUrl,
        isTestAccount: false,
        emailSent: realDispatchRes.emailSent,
        deliveryMessage: realDispatchRes.message,
      });
    }

    res.json({

      success: !!realDispatchRes?.emailSent,

      message:
        realDispatchRes?.message ||
        'Demo alert dispatched',

      alert,

      dispatch:
        realDispatchRes,
    });
  }
);

// ----------------------------------------------------
// VITE / STATIC FILE SERVING
// ----------------------------------------------------

async function startServer() {

  if (
    process.env.NODE_ENV !==
    'production'
  ) {

    const vite =
      await createViteServer({

        server: {
          middlewareMode: true,
        },

        appType: 'spa',
      });

    app.use(vite.middlewares);

  } else {

    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(distPath)
    );

    app.get(
      '*',
      (req: Request, res: Response) => {

        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {

      console.log(
        `🚗 Vehicle Health Server running on ` +
        `http://0.0.0.0:${PORT}`
      );
    }
  );
}

startServer();