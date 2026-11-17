import { AlertNotification, VehicleHealthPrediction } from '../src/types.js';
import { locationServiceInstance } from './location_service.js';

export class AlertService {
  private alertsHistory: AlertNotification[] = [];

  public evaluatePrediction(prediction: VehicleHealthPrediction): AlertNotification[] {
    const newAlerts: AlertNotification[] = [];
    const location = locationServiceInstance.getCurrentVehicleLocation();

    for (const comp of prediction.components) {
      if (comp.risk_level >= 1) { // Warning, Critical, or Danger
        let severity: 'Warning' | 'Critical' | 'Danger' = 'Warning';
        if (comp.risk_level === 3) severity = 'Danger';
        else if (comp.risk_level === 2) severity = 'Critical';

        // Check if similar alert already triggered recently to prevent spam
        const existingRecent = this.alertsHistory.find(
          (a) => a.component_name === comp.name && a.severity === severity && (Date.now() - new Date(a.timestamp).getTime()) < 30000
        );

        if (!existingRecent) {
          const alert: AlertNotification = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            severity,
            component_name: comp.name,
            message: `${comp.name} reached ${severity.toUpperCase()} status (${comp.health}% health, ${comp.wear}% wear). ${comp.status_message}`,
            recommendation: comp.recommendation,
            channel: severity === 'Danger' ? 'SMS & Email (Auto-Dispatched)' : 'Dashboard & Email (Auto-Dispatched)',
            delivered: true,
            location,
            nearestServiceCenter: location.nearestServiceCenters[0],
          };

          this.alertsHistory.unshift(alert);
          if (this.alertsHistory.length > 50) {
            this.alertsHistory.pop();
          }
          newAlerts.push(alert);
        }
      }
    }

    return newAlerts;
  }

  public getAlertsHistory(): AlertNotification[] {
    return this.alertsHistory;
  }

  public clearAlertsHistory() {
    this.alertsHistory = [];
  }

  public simulateManualDispatch(componentName: string, channel: 'SMS' | 'Email', recipient: string): AlertNotification {
    const location = locationServiceInstance.getCurrentVehicleLocation();
    const manualAlert: AlertNotification = {
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'Critical',
      component_name: componentName,
      message: `DEMO ALERT SENT via ${channel} to ${recipient}: Maintenance required for ${componentName}.`,
      recommendation: `Inspect ${componentName} at ${location.nearestServiceCenters[0].name} (${location.nearestServiceCenters[0].distanceKm} km away).`,
      channel: `${channel} (Demo Mode)`,
      delivered: true,
      location,
      nearestServiceCenter: location.nearestServiceCenters[0],
    };
    this.alertsHistory.unshift(manualAlert);
    return manualAlert;
  }
}

export const alertServiceInstance = new AlertService();

