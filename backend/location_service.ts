import { VehicleLocation, ServiceCenter } from '../src/types.js';

// Route waypoints simulating a vehicle moving along the Bengaluru Outer Ring Road / Indiranagar corridor
const BENGALURU_WAYPOINTS = [
  { lat: 12.9716, lng: 77.5946, address: 'Outer Ring Road (NH 44), KM 18.2 Marker, Bengaluru, KA 560103' },
  { lat: 12.9732, lng: 77.5968, address: 'Outer Ring Road (NH 44), KM 18.8 Marker, Bengaluru, KA 560103' },
  { lat: 12.9750, lng: 77.5992, address: 'Old Airport Road, Near Domlur Flyover, Bengaluru, KA 560071' },
  { lat: 12.9768, lng: 77.6018, address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038' },
  { lat: 12.9785, lng: 77.6045, address: 'Indiranagar 100ft Road Corridor, Bengaluru, KA 560038' },
  { lat: 12.9802, lng: 77.6078, address: 'HAL Airport Junction, Marathahalli Highway, Bengaluru, KA 560037' },
  { lat: 12.9760, lng: 77.6112, address: 'Outer Ring Road, Bellandur Flyover Junction, Bengaluru, KA 560103' },
  { lat: 12.9718, lng: 77.6025, address: 'Silk Board Flyover Interchange, Outer Ring Rd, Bengaluru, KA 560068' },
];

export class LocationService {
  private stepIndex = 0;

  /**
   * Returns current dynamic vehicle location snapshot with realistic telemetry GPS
   */
  public getCurrentVehicleLocation(): VehicleLocation {
    // Advance waypoint on each poll
    const wp = BENGALURU_WAYPOINTS[this.stepIndex];
    this.stepIndex = (this.stepIndex + 1) % BENGALURU_WAYPOINTS.length;

    // Add small time jitter so coordinates update continuously
    const jitter = ((Date.now() % 1000) - 500) / 1000000;
    const lat = +(wp.lat + jitter).toFixed(6);
    const lng = +(wp.lng + jitter).toFixed(6);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    // Calculate dynamic distances to service centers based on current position
    const dist1 = +(1.2 + (this.stepIndex * 0.25)).toFixed(1);
    const dist2 = +(2.8 - (this.stepIndex * 0.2)).toFixed(1);
    const dist3 = +(3.5 + (this.stepIndex * 0.15)).toFixed(1);

    const nearestServiceCenters: ServiceCenter[] = [
      {
        id: 'sc_1',
        name: 'Bosch Car Service - Indiranagar',
        address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
        distanceKm: Math.max(0.3, dist1),
        phone: '+91 98765 43210',
        rating: 4.8,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Indiranagar+Bengaluru',
        isOpen24x7: true,
        specialty: 'Engine Diagnostics, Thermal Coolant & ECU Calibration',
      },
      {
        id: 'sc_2',
        name: 'Multi-Brand Authorized Auto Care - Domlur',
        address: 'Old Airport Rd, Near Domlur Flyover, Bengaluru, KA 560071',
        distanceKm: Math.max(0.4, dist2),
        phone: '+91 80 2520 1122',
        rating: 4.6,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Multi+Brand+AutoCare+Domlur+Bengaluru',
        isOpen24x7: false,
        specialty: 'Brake Disc Replacement, Suspension & Fluid Flush',
      },
      {
        id: 'sc_3',
        name: 'Authorized Auto Care & Rapid Service - Koramangala',
        address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru, KA 560034',
        distanceKm: Math.max(0.6, dist3),
        phone: '+91 80 4110 5500',
        rating: 4.9,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Authorized+AutoCare+Koramangala+Bengaluru',
        isOpen24x7: true,
        specialty: 'Battery Diagnostic, Electrical & Fast Express Service',
      },
    ];

    // Keep service centers sorted by closest distance
    nearestServiceCenters.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      latitude: lat,
      longitude: lng,
      address: wp.address,
      city: 'Bengaluru',
      state: 'Karnataka',
      googleMapsUrl,
      nearestServiceCenters,
    };
  }
}

export const locationServiceInstance = new LocationService();
