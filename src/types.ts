export type RiskLevel = 0 | 1 | 2 | 3;
// 0: Good, 1: Warning, 2: Critical, 3: Danger

export type RiskLabel =
  | 'Good'
  | 'Warning'
  | 'Critical'
  | 'Danger';

export type SimulationScenario =
  | 'NORMAL'
  | 'WARNING'
  | 'DANGER';

export type RoadType =
  | 'Highway'
  | 'City'
  | 'Offroad'
  | 'Rough';

export type BrakingStyle =
  | 'Gentle'
  | 'Moderate'
  | 'Aggressive'
  | 'Sudden';


/* =========================================================
   OBD SENSOR DATA
   ========================================================= */

export interface OBDSensorData {
  timestamp: string;

  // Original OBD-style sensor values
  rpm: number;
  speed: number;
  engine_temp: number;
  engine_load: number;
  throttle_position: number;
  battery_voltage: number;

  // Additional values required by the ML model
  km_driven: number;

  // 0: Highway
  // 1: City
  // 2: Offroad
  // 3: Rough
  road_type_code: number;

  // 0: Gentle
  // 1: Moderate
  // 2: Aggressive
  // 3: Sudden
  braking_style_code: number;

  // Component age in months
  component_age: number;
}


/* =========================================================
   DERIVED CONTEXT DATA
   ========================================================= */

export interface DerivedContextData {
  km_driven: number;

  road_type: RoadType;

  braking_style: BrakingStyle;

  load: number;

  component_age: number;
}


/* =========================================================
   RANDOM FOREST MODEL INPUT
   =========================================================
   
   IMPORTANT:
   The order of these features MUST match the
   Python Random Forest training script.
   
   Python model expects:

   1. km_driven
   2. road_type_code
   3. braking_style_code
   4. load
   5. engine_temp
   6. rpm
   7. battery_voltage
   8. component_age
   ========================================================= */

export interface ModelInputFeatures {
  km_driven: number;

  road_type_code: number;

  braking_style_code: number;

  load: number;

  engine_temp: number;

  rpm: number;

  battery_voltage: number;

  component_age: number;
}


/* =========================================================
   COMPONENT HEALTH
   ========================================================= */

export interface ComponentHealth {
  id: string;

  name: string;

  weight: number;

  health: number;

  wear: number;

  risk_level: RiskLevel;

  risk_label: RiskLabel;

  remaining_life: number;

  remaining_life_unit: 'km' | 'days';

  status_message: string;

  recommendation: string;
}


/* =========================================================
   SERVICE CENTER
   ========================================================= */

export interface ServiceCenter {
  id: string;

  name: string;

  address: string;

  distanceKm: number;

  phone: string;

  rating: number;

  googleMapsUrl: string;

  isOpen24x7: boolean;

  specialty: string;
}


/* =========================================================
   VEHICLE LOCATION
   ========================================================= */

export interface VehicleLocation {
  latitude: number;

  longitude: number;

  address: string;

  city: string;

  state: string;

  googleMapsUrl: string;

  nearestServiceCenters: ServiceCenter[];
}


/* =========================================================
   VEHICLE HEALTH PREDICTION
   ========================================================= */

export interface VehicleHealthPrediction {
  timestamp: string;

  overall_health: number;

  overall_risk: RiskLevel;

  overall_status: RiskLabel;

  highest_risk_component: string;

  components: ComponentHealth[];

  sensor_data: OBDSensorData;

  derived_context: DerivedContextData;

  location?: VehicleLocation;

  ml_meta: {
    model_name: string;

    algorithm: string;

    tree_count: number;

    confidence: number;

    inference_time_ms: number;
  };
}


/* =========================================================
   ALERT NOTIFICATION
   ========================================================= */

export interface AlertNotification {
  id: string;

  timestamp: string;

  severity:
    | 'Warning'
    | 'Critical'
    | 'Danger';

  component_name: string;

  message: string;

  recommendation: string;

  channel: string;

  delivered: boolean;

  location?: VehicleLocation;

  nearestServiceCenter?: ServiceCenter;
}


/* =========================================================
   OBD SIMULATOR STATUS
   ========================================================= */

export interface SimulatorStatus {
  isRunning: boolean;

  isPaused: boolean;

  scenario: SimulationScenario;

  speed: number;

  readingsCount: number;

  lastUpdated: string;
}


/* =========================================================
   CSV DATA
   ========================================================= */

export interface CSVDataRow {
  km_driven: number;

  road_type: string;

  braking_style: string;

  load: number;

  engine_temp: number;

  rpm: number;

  battery_voltage: number;

  component_age: number;

  speed?: number;

  throttle_position?: number;
}