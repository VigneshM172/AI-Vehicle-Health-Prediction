import {
  OBDSensorData,
  DerivedContextData,
  ModelInputFeatures,
  SimulationScenario,
  RoadType,
  BrakingStyle,
} from '../src/types.js';

export class FeatureAdapterDataProcessor {
  /**
   * Validates incoming OBD-II sensor values against physical realistic ranges.
   */
  public static validateSensorData(data: OBDSensorData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof data.rpm !== 'number' || data.rpm < 0 || data.rpm > 10000) {
      errors.push(`Invalid RPM value: ${data.rpm} (must be between 0 and 10000)`);
    }

    if (typeof data.speed !== 'number' || data.speed < 0 || data.speed > 250) {
      errors.push(`Invalid Speed value: ${data.speed} (must be between 0 and 250 km/h)`);
    }

    if (typeof data.engine_temp !== 'number' || data.engine_temp < -20 || data.engine_temp > 150) {
      errors.push(`Invalid Engine Temp value: ${data.engine_temp} (must be between -20 and 150 °C)`);
    }

    if (typeof data.engine_load !== 'number' || data.engine_load < 0 || data.engine_load > 100) {
      errors.push(`Invalid Engine Load value: ${data.engine_load} (must be between 0% and 100%)`);
    }

    if (typeof data.battery_voltage !== 'number' || data.battery_voltage < 8 || data.battery_voltage > 18) {
      errors.push(`Invalid Battery Voltage value: ${data.battery_voltage} (must be between 8V and 18V)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Derives context parameters (km_driven, road_type, braking_style, component_age)
   * which are NOT directly streamed over standard OBD-II PID bus.
   */
  public static deriveContextFeatures(
    sensor: OBDSensorData,
    scenario: SimulationScenario,
    totalReadings: number
  ): DerivedContextData {
    // 1. Estimate cumulative km driven based on reading count and speed
    const baseKm = 42500;
    const addedKm = (totalReadings * (sensor.speed > 0 ? sensor.speed : 40)) / 3600;
    const kmDriven = Math.round((baseKm + addedKm) * 10) / 10;

    // 2. Derive Road Type from speed & engine load patterns
    let roadType: RoadType = 'City';
    if (sensor.speed > 80) {
      roadType = 'Highway';
    } else if (sensor.engine_load > 75 && sensor.speed < 40) {
      roadType = scenario === 'DANGER' ? 'Rough' : 'Offroad';
    } else if (scenario === 'WARNING' && sensor.speed < 30) {
      roadType = 'Rough';
    }

    // 3. Derive Braking Style from throttle & scenario conditions
    let brakingStyle: BrakingStyle = 'Gentle';
    if (scenario === 'DANGER' || (sensor.throttle_position < 10 && sensor.speed > 60)) {
      brakingStyle = 'Sudden';
    } else if (scenario === 'WARNING' || sensor.engine_load > 70) {
      brakingStyle = 'Aggressive';
    } else if (sensor.speed > 40) {
      brakingStyle = 'Moderate';
    }

    // 4. Derive component age (months) according to scenario and mileage
    let componentAgeMonths = 14;
    if (scenario === 'WARNING') {
      componentAgeMonths = 28;
    } else if (scenario === 'DANGER') {
      componentAgeMonths = 42;
    }

    return {
      km_driven: kmDriven,
      road_type: roadType,
      braking_style: brakingStyle,
      load: Math.round(sensor.engine_load * 1.2), // Vehicle total payload factor
      component_age: componentAgeMonths,
    };
  }

  /**
   * Feature Adapter Layer: converts categorical variables into numerical codes
   * required by the Random Forest model.
   */
  public static adaptFeaturesToModelInput(
    sensor: OBDSensorData,
    context: DerivedContextData
  ): ModelInputFeatures {
    const roadTypeCodeMap: Record<RoadType, number> = {
      Highway: 0,
      City: 1,
      Offroad: 2,
      Rough: 3,
    };

    const brakingStyleCodeMap: Record<BrakingStyle, number> = {
      Gentle: 0,
      Moderate: 1,
      Aggressive: 2,
      Sudden: 3,
    };

    return {
      km_driven: context.km_driven,
      road_type_code: roadTypeCodeMap[context.road_type] ?? 1,
      braking_style_code: brakingStyleCodeMap[context.braking_style] ?? 0,
      load: context.load,
      engine_temp: sensor.engine_temp,
      rpm: sensor.rpm,
      battery_voltage: sensor.battery_voltage,
      component_age: context.component_age,
    };
  }
}
