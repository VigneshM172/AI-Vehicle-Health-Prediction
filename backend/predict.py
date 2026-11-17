"""
Vehicle Health Prediction System - Python Inference Script
Usage: python predict.py <json_input_string>
"""

import sys
import json
import numpy as np

def run_inference(data):
    """
    Simulates Python inference pipeline returning component health breakdown.
    """
    km_driven = data.get('km_driven', 20000)
    engine_temp = data.get('engine_temp', 88)
    rpm = data.get('rpm', 2200)
    battery_voltage = data.get('battery_voltage', 14.0)

    engine_wear = min(100, max(5, (engine_temp - 80) * 2.5 + (rpm - 2000) * 0.015))
    battery_wear = min(100, max(5, (14.2 - battery_voltage) * 35))
    brake_wear = min(100, max(10, (km_driven / 40000) * 80))

    components = {
        "brake_pads": round(100 - brake_wear, 1),
        "engine": round(100 - engine_wear, 1),
        "battery": round(100 - battery_wear, 1)
    }

    return {
        "overall_health": round(sum(components.values()) / len(components), 1),
        "component_health": components,
        "model": "RandomForest_v2.1"
    }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            input_json = json.loads(sys.argv[1])
            res = run_inference(input_json)
            print(json.dumps(res))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        sample = {"km_driven": 25000, "engine_temp": 92, "rpm": 2500, "battery_voltage": 13.8}
        print(json.dumps(run_inference(sample), indent=2))
