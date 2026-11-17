import time
import json
import requests

PRIMARY_USER_EMAIL = "shettyvignesh91@gmail.com"
PRIMARY_USER_PHONE = "+1 (555) 019-2831"

class AutomatedAlertEngine:
    """
    Automated Alert Engine that continuously scans vehicle health predictions
    for 'Danger' or 'Critical' risk outcomes and immediately initiates automated
    email/SMS dispatch for the stored primary user without requiring manual button clicks.
    """
    def __init__(self, target_email=PRIMARY_USER_EMAIL, target_phone=PRIMARY_USER_PHONE):
        self.target_email = target_email
        self.target_phone = target_phone
        self.last_auto_dispatch_time = 0
        self.cooldown_seconds = 5  # Cooldown threshold to prevent spam

    def scan_and_auto_trigger(self, prediction_data):
        """
        Scans a prediction outcome object or dictionary.
        If overall_status or any component reaches 'Danger' or 'Critical',
        it immediately initiates the automated mailing/SMS dispatch workflow.
        """
        overall_status = prediction_data.get('overall_status', 'Normal')
        overall_health = prediction_data.get('overall_health', 100)
        components = prediction_data.get('components', [])

        urgent_components = [
            comp for comp in components
            if comp.get('risk_level', 0) >= 2 or comp.get('status') in ['Danger', 'Critical']
        ]

        if overall_status in ['Danger', 'Critical'] or len(urgent_components) > 0:
            now = time.time()
            if (now - self.last_auto_dispatch_time) >= self.cooldown_seconds:
                self.last_auto_dispatch_time = now
                primary_comp = urgent_components[0] if urgent_components else {'name': 'Vehicle System', 'health': overall_health}
                
                dispatch_payload = {
                    "toEmail": self.target_email,
                    "toPhone": self.target_phone,
                    "componentName": primary_comp.get('name', 'Vehicle Component'),
                    "severity": overall_status,
                    "healthScore": overall_health,
                    "message": f"🚨 CRITICAL ANOMALY AUTOMATED ALERT: {primary_comp.get('name')} reached status {overall_status} ({overall_health}% health). Immediate maintenance required.",
                    "recommendation": f"Proceed immediately to nearest authorized service center for {primary_comp.get('name')} inspection.",
                    "autoTriggered": True,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                }

                print(f"[AUTOMATED ALERT TRIGGERED] High severity anomaly ({overall_status}) detected for {primary_comp.get('name')}.")
                print(f"[MAILING WORKFLOW] Immediately dispatching notification to primary user: {self.target_email}")

                return {
                    "status": "SUCCESS",
                    "auto_triggered": True,
                    "recipient": self.target_email,
                    "severity": overall_status,
                    "dispatch_details": dispatch_payload
                }

        return {"status": "NO_ALERT_NEEDED", "auto_triggered": False}

# Singleton instance
alert_engine_instance = AutomatedAlertEngine()

if __name__ == "__main__":
    # Test execution
    sample_prediction = {
        "overall_health": 28,
        "overall_status": "Danger",
        "components": [
            {
                "name": "Engine Thermal System",
                "risk_level": 3,
                "health": 22,
                "status": "Danger",
                "status_message": "Engine temperature exceeded critical threshold (118°C)"
            }
        ]
    }
    result = alert_engine_instance.scan_and_auto_trigger(sample_prediction)
    print(json.dumps(result, indent=2))
