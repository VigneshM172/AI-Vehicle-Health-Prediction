import {
  OBDSensorData,
  SimulationScenario,
  SimulatorStatus
} from '../src/types.js';

export class OBDSimulator {
  private isRunning: boolean = true;
  private isPaused: boolean = false;
  private scenario: SimulationScenario = 'NORMAL';
  private speedMultiplier: number = 1;
  private readingsCount: number = 0;
  private timer: NodeJS.Timeout | null = null;

  // Internal state tracking for smooth physics transitions
  private currentRPM: number = 2200;
  private currentSpeed: number = 48;
  private currentEngineTemp: number = 86;
  private currentEngineLoad: number = 38;
  private currentThrottle: number = 25;
  private currentBatteryVoltage: number = 14.1;

  // Additional features required by the ML model
  private currentKmDriven: number = 30000;
  private roadTypeCode: number = 1;
  private brakingStyleCode: number = 0;
  private componentAge: number = 10;

  private onDataCallback?: (
    data: OBDSensorData,
    scenario: SimulationScenario,
    count: number
  ) => void;

  constructor() {
    this.startLoop();
  }

  public registerCallback(
    cb: (
      data: OBDSensorData,
      scenario: SimulationScenario,
      count: number
    ) => void
  ) {
    this.onDataCallback = cb;
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;

    if (!this.timer) {
      this.startLoop();
    }
  }

  public stop() {
    this.isRunning = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;

    if (!this.isRunning) {
      this.start();
    }
  }

  public setScenario(newScenario: SimulationScenario) {
    this.scenario = newScenario;
  }

  public setSpeed(speed: number) {
    if ([0.5, 1, 2, 5].includes(speed)) {
      this.speedMultiplier = speed;

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        this.startLoop();
      }
    }
  }

  public reset() {
    this.readingsCount = 0;
    this.scenario = 'NORMAL';

    this.currentRPM = 2200;
    this.currentSpeed = 48;
    this.currentEngineTemp = 86;
    this.currentEngineLoad = 38;
    this.currentThrottle = 25;
    this.currentBatteryVoltage = 14.1;

    // Reset ML features
    this.currentKmDriven = 30000;
    this.roadTypeCode = 1;
    this.brakingStyleCode = 0;
    this.componentAge = 10;
  }

  public getStatus(): SimulatorStatus {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      scenario: this.scenario,
      speed: this.speedMultiplier,
      readingsCount: this.readingsCount,
      lastUpdated: new Date().toISOString(),
    };
  }

  public getCurrentDataSnapshot(): OBDSensorData {
    return {
      timestamp: new Date().toISOString(),

      // Existing OBD-style values
      rpm: Math.round(this.currentRPM),

      speed: Math.round(this.currentSpeed),

      engine_temp:
        Math.round(this.currentEngineTemp * 10) / 10,

      engine_load:
        Math.round(this.currentEngineLoad * 10) / 10,

      throttle_position:
        Math.round(this.currentThrottle * 10) / 10,

      battery_voltage:
        Math.round(this.currentBatteryVoltage * 100) / 100,

      // Additional ML features
      km_driven: Math.round(this.currentKmDriven),

      road_type_code: this.roadTypeCode,

      braking_style_code: this.brakingStyleCode,

      component_age: this.componentAge,
    } as OBDSensorData;
  }

  private startLoop() {
    const intervalMs = Math.round(2000 / this.speedMultiplier);

    this.timer = setInterval(() => {
      if (this.isRunning && !this.isPaused) {
        this.updateStatePhysics();

        this.readingsCount++;

        const snapshot = this.getCurrentDataSnapshot();

        if (this.onDataCallback) {
          this.onDataCallback(
            snapshot,
            this.scenario,
            this.readingsCount
          );
        }
      }
    }, intervalMs);
  }

  /**
   * Physics & State Simulation Engine
   *
   * Smooth, continuous updates according to active scenario.
   */
  private updateStatePhysics() {
    const noise = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    if (this.scenario === 'NORMAL') {
      // Normal driving conditions
      const targetRPM = noise(1800, 2800);
      const targetSpeed = noise(40, 75);
      const targetTemp = noise(86, 92);
      const targetLoad = noise(30, 48);
      const targetThrottle = noise(20, 38);
      const targetVoltage = noise(13.9, 14.3);

      this.currentRPM +=
        (targetRPM - this.currentRPM) * 0.25;

      this.currentSpeed +=
        (targetSpeed - this.currentSpeed) * 0.20;

      this.currentEngineTemp +=
        (targetTemp - this.currentEngineTemp) * 0.10;

      this.currentEngineLoad +=
        (targetLoad - this.currentEngineLoad) * 0.25;

      this.currentThrottle +=
        (targetThrottle - this.currentThrottle) * 0.25;

      this.currentBatteryVoltage +=
        (targetVoltage - this.currentBatteryVoltage) * 0.15;

      // ML feature values
      this.roadTypeCode = 1;       // City
      this.brakingStyleCode = 0;   // Gentle

    } else if (this.scenario === 'WARNING') {
      // Elevated temperature, moderate strain, battery degradation signal
      const targetRPM = noise(3200, 4100);
      const targetSpeed = noise(75, 95);
      const targetTemp = noise(98, 105);
      const targetLoad = noise(68, 82);
      const targetThrottle = noise(55, 70);
      const targetVoltage = noise(12.0, 12.5);

      this.currentRPM +=
        (targetRPM - this.currentRPM) * 0.30;

      this.currentSpeed +=
        (targetSpeed - this.currentSpeed) * 0.25;

      this.currentEngineTemp +=
        (targetTemp - this.currentEngineTemp) * 0.15;

      this.currentEngineLoad +=
        (targetLoad - this.currentEngineLoad) * 0.30;

      this.currentThrottle +=
        (targetThrottle - this.currentThrottle) * 0.30;

      this.currentBatteryVoltage +=
        (targetVoltage - this.currentBatteryVoltage) * 0.20;

      // ML feature values
      this.roadTypeCode = 1;       // City
      this.brakingStyleCode = 1;   // Moderate

    } else if (this.scenario === 'DANGER') {
      // Critical fault scenario:
      // Overheating, low battery voltage, extreme engine load
      const targetRPM = noise(4600, 5600);
      const targetSpeed = noise(105, 130);
      const targetTemp = noise(112, 122);
      const targetLoad = noise(88, 98);
      const targetThrottle = noise(80, 95);
      const targetVoltage = noise(10.8, 11.4);

      this.currentRPM +=
        (targetRPM - this.currentRPM) * 0.35;

      this.currentSpeed +=
        (targetSpeed - this.currentSpeed) * 0.30;

      this.currentEngineTemp +=
        (targetTemp - this.currentEngineTemp) * 0.20;

      this.currentEngineLoad +=
        (targetLoad - this.currentEngineLoad) * 0.35;

      this.currentThrottle +=
        (targetThrottle - this.currentThrottle) * 0.35;

      this.currentBatteryVoltage +=
        (targetVoltage - this.currentBatteryVoltage) * 0.25;

      // ML feature values
      this.roadTypeCode = 3;       // Rough
      this.brakingStyleCode = 3;   // Sudden
    }

    /*
     * Simulated mileage progression.
     *
     * This does NOT represent real vehicle mileage.
     * It is only for the real-time demonstration.
     */
    const distancePerReading =
      (Math.max(this.currentSpeed, 0) / 3600) *
      (2 / this.speedMultiplier);

    this.currentKmDriven += distancePerReading;

    /*
     * Keep the component age stable during the simulation.
     * It represents the current age of vehicle components.
     */
    this.componentAge = 10;
  }
}

export const obdSimulatorInstance = new OBDSimulator();