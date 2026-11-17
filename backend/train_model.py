"""
Vehicle Health Prediction System - Random Forest Model Training Script
College Project: BTech CSE Final Year
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# 1. Feature Definition & Categorical Mappings
FEATURE_COLUMNS = [
    'km_driven',
    'road_type_code',     # 0: Highway, 1: City, 2: Offroad, 3: Rough
    'braking_style_code', # 0: Gentle, 1: Moderate, 2: Aggressive, 3: Sudden
    'load',
    'engine_temp',
    'rpm',
    'battery_voltage',
    'component_age'
]

TARGET_COLUMN = 'overall_risk_level' # 0: Good, 1: Warning, 2: Critical, 3: Danger

def generate_synthetic_training_data(n_samples=2000):
    """Generates synthetic dataset mirroring vehicle physics and sensor correlations."""
    np.random.seed(42)
    
    km_driven = np.random.uniform(5000, 100000, n_samples)
    road_type_code = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.4, 0.4, 0.1, 0.1])
    braking_style_code = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.5, 0.3, 0.15, 0.05])
    load = np.random.uniform(10, 95, n_samples)
    engine_temp = np.random.uniform(70, 125, n_samples)
    rpm = np.random.uniform(1000, 6000, n_samples)
    battery_voltage = np.random.uniform(10.5, 14.5, n_samples)
    component_age = np.random.uniform(2, 60, n_samples)

    risk_scores = (
        (engine_temp - 85) * 0.4 +
        (6000 - rpm) * -0.01 +
        (14.0 - battery_voltage) * 15 +
        (km_driven / 1000) * 0.3 +
        braking_style_code * 8 +
        road_type_code * 6 +
        (load / 10) * 2 +
        component_age * 0.8
    )

    targets = []
    for score in risk_scores:
        if score > 80:
            targets.append(3) # Danger
        elif score > 50:
            targets.append(2) # Critical
        elif score > 25:
            targets.append(1) # Warning
        else:
            targets.append(0) # Good

    df = pd.DataFrame({
        'km_driven': km_driven,
        'road_type_code': road_type_code,
        'braking_style_code': braking_style_code,
        'load': load,
        'engine_temp': engine_temp,
        'rpm': rpm,
        'battery_voltage': battery_voltage,
        'component_age': component_age,
        'overall_risk_level': targets
    })
    
    return df

def train_and_export():
    print("Generating training dataset...")
    df = generate_synthetic_training_data(2500)
    
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Classifier (100 Decision Trees)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        random_state=42
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete! Test Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred, target_names=['Good', 'Warning', 'Critical', 'Danger']))

    os.makedirs('ml_models', exist_ok=True)
    model_path = 'ml_models/vehicle_health_model.pkl'
    joblib.dump(clf, model_path)
    print(f"Model successfully saved to {model_path}")

if __name__ == '__main__':
    train_and_export()
