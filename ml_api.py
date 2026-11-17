from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "ml_models",
    "vehicle_health_model.pkl"
)

model = joblib.load(MODEL_PATH)

FEATURE_COLUMNS = [
    "km_driven",
    "road_type_code",
    "braking_style_code",
    "load",
    "engine_temp",
    "rpm",
    "battery_voltage",
    "component_age"
]

RISK_LABELS = {
    0: "Good",
    1: "Warning",
    2: "Critical",
    3: "Danger"
}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "vehicle_health_model.pkl",
        "features": len(FEATURE_COLUMNS)
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        values = [
            data["km_driven"],
            data["road_type_code"],
            data["braking_style_code"],
            data["load"],
            data["engine_temp"],
            data["rpm"],
            data["battery_voltage"],
            data["component_age"]
        ]

        prediction = int(model.predict([values])[0])

        probabilities = model.predict_proba([values])[0]

        return jsonify({
            "prediction": prediction,
            "label": RISK_LABELS[prediction],
            "probabilities": {
                RISK_LABELS[i]: round(float(probabilities[i]), 4)
                for i in range(len(probabilities))
            }
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 400


if __name__ == "__main__":
    print("🚗 Vehicle Health ML API")
    print("📦 Model loaded:", MODEL_PATH)
    print("🌐 Running on http://127.0.0.1:5000")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )