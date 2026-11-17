# Vehicle Health Prediction and Predictive Maintenance System

A full-stack, AI-powered **Vehicle Health Monitoring and Predictive Maintenance System** built as a final-year BTech CSE college project.

The system continuously processes vehicle operating data via a real-time **OBD-II simulator**, feeds normalized sensor metrics into a **Random Forest Machine Learning model**, predicts mechanical wear across **7 major vehicle components**, calculates an **overall vehicle health score (0–100%)**, and triggers real-time maintenance alerts over an interactive web dashboard.

---

## 🚗 Project Overview

Modern vehicles emit vast telemetry streams over their onboard OBD-II buses. This project provides a complete predictive maintenance platform capable of:
1. **Real-time OBD-II Data Simulation**: Generates realistic physics-correlated sensor streams (RPM, Speed, Engine Coolant Temp, Engine Load, Throttle Position, Battery Voltage).
2. **Feature Adapter & Data Processing Layer**: Converts raw OBD PID telemetry into normalized ML feature vectors while deriving contextual parameters (`km_driven`, `road_type`, `braking_style`, `component_age`).
3. **Random Forest Machine Learning Engine**: An ensemble of 10 decision trees predicting health %, wear %, risk levels, and Estimated Remaining Useful Life (RUL) across 7 vehicle component nodes.
4. **Interactive Real-time React Dashboard**: Displays live gauges, central overall health gauge, component health cards, Recharts time-series telemetry charts, and simulation controls (Normal, Warning, Fault/Danger).
5. **Multi-Channel Alert & History System**: Detects Warning/Critical/Danger thresholds, logs prediction history, and provides a demo SMS/Email alert dispatcher.
6. **CSV Batch Testing Mode**: Enables testing historical vehicle telemetry datasets.

---

## 🏗️ System Architecture

```
                       VEHICLE HEALTH SYSTEM ARCHITECTURE

                                  DATA SOURCE
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
               OBD SIMULATOR                       CSV TEST MODE
               (Real-time 2Hz)                    (Batch Datasets)
                      │                                 │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                             DATA PROCESSOR LAYER
                            Validation & Normalization
                                       │
                                       ▼
                            FEATURE ADAPTER LAYER
             Maps OBD PIDs + Derives Contextual Inputs (km, road, braking)
                                       │
                                       ▼
                           RANDOM FOREST ML MODEL
                         10 Decision Trees Ensemble
                                       │
                                       ▼
                             COMPONENT PREDICTIONS
            (Brake Pads, Tyres, Engine, Battery, Oil, Chain/Belt, Filter)
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                  Component Health             Overall Health
                    (0 - 100%)                   (Weighted Sum)
                         │                           │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                            EXPRESS REST API SERVER
                                       │
                                       ▼
                             REACT REAL-TIME DASHBOARD
                  (Telemetry Gauges, Live Charts, Alerts, History)
```

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Motion, Lucide Icons
* **Backend**: Express.js (Node.js/TypeScript), REST API architecture
* **Machine Learning Engine**: Python (scikit-learn Random Forest model training script `train_model.py`), Node/TypeScript Random Forest decision tree ensemble engine
* **Datasets**: Simulated OBD-II telemetry streams, `sample_vehicle_telemetry.csv`

---

## ⚙️ Component Weights Formula

Overall vehicle health is calculated using the weighted sum of component health indices:

$$\text{Overall Health} = 0.25 \times \text{BrakePads} + 0.20 \times \text{Tyres} + 0.20 \times \text{Engine} + 0.15 \times \text{Battery} + 0.10 \times \text{EngineOil} + 0.07 \times \text{ChainBelt} + 0.03 \times \text{AirFilter}$$

### Component Nodes & Weighting

| Component | Weight | Unit | Typical Wear Factors |
| :--- | :--- | :--- | :--- |
| **Brake Pads** | 25% | km | Braking style, stop-and-go cycle, load |
| **Tyres** | 20% | km | Speed, road type (Rough/Offroad), load |
| **Engine** | 20% | km | Coolant temperature, RPM redline, load |
| **Battery** | 15% | days | Voltage regulation (10.5V - 14.8V), age |
| **Engine Oil** | 10% | km | Temperature shear, high RPM drag, mileage |
| **Chain / Belt** | 7% | km | Tension, road vibration, throttle strain |
| **Air Filter** | 3% | km | Offroad dust index, component age |

---

## 📊 Risk Classification Levels

* **Level 0 (Good)**: Healthy component operating within nominal parameters.
* **Level 1 (Warning)**: Moderate wear observed. Schedule routine inspection.
* **Level 2 (Critical)**: High degradation detected. Service required within 200 km.
* **Level 3 (Danger)**: Critical fault or sensor anomaly. Immediate service required.

---

## 🔌 API Endpoints

* `GET /api/obd/live`: Retrieves live simulated OBD telemetry + derived context + Random Forest health prediction.
* `POST /api/obd/simulator/control`: Controls simulator status (`start`, `stop`, `pause`, `resume`, `reset`, scenario: `NORMAL`/`WARNING`/`DANGER`, speed: `0.5x`-`5x`).
* `GET /api/obd/simulator/status`: Gets current simulator status & reading count.
* `POST /api/predict`: Runs custom single-point ML prediction on user parameters.
* `POST /api/predict/csv`: Runs batch ML inference on uploaded CSV dataset rows.
* `GET /api/dataset/sample-csv`: Returns downloadable sample telemetry CSV template.
* `GET /api/history`: Gets prediction history logs.
* `POST /api/alerts/demo-send`: Simulates manual SMS/Email maintenance alert dispatch.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Running in Development Mode
```bash
npm run dev
```
Access the application on `http://localhost:3000`.

### 3. Python ML Model Training (Optional Reference)
To retrain or export the Python Random Forest model:
```bash
python3 backend/train_model.py
```

---

## 🎬 College Examiner Demonstration Sequence

1. Launch application and verify **"OBD SIMULATOR - DEMO MODE"** header status.
2. Click **Start Simulation** to begin live 2Hz sensor telemetry.
3. Observe healthy vehicle status (**88% Overall Health**, Normal status).
4. Click **Warning Mode** scenario button and observe temperature rise (~102°C) and battery drop (~12.2V).
5. Click **Fault / Danger Mode** scenario button to trigger critical engine overheat (&gt;112°C) and low battery (&lt;11.2V).
6. Observe overall vehicle health score dropping below 40% and real-time alert ticker generation.
7. Test the **SMS & Email Alert Dispatcher** by clicking **Send Alert**.
8. Switch to **CSV Test Mode** tab, upload or run batch inference on `sample_vehicle_telemetry.csv`.
9. Click **Architecture** button in the header to review technical data flow diagrams during viva defense.
