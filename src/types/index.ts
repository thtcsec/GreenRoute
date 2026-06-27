export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface TripInput {
  origin: Location | null;
  destination: Location | null;
}

export interface CoolStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  shadeScore: number; // Scale 1-10
  rainCover: boolean;
  curbSafety: 'High' | 'Medium' | 'Low';
  accessibility: 'High' | 'Medium' | 'Low';
  description: string;
  amenities: string[];
  operatingHours?: string; // e.g. "24/7" or "06:00-22:00"
  type?: 'Cooling Station' | 'Shaded Rest Area' | 'Air-conditioned Shelter';
  capacity?: number;
  status?: 'Available' | 'Crowded' | 'Full';
}

export interface HeatZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  riskLevel: 'High' | 'Medium-High' | 'Medium' | 'Low';
  heatIndex: number; // in °C
  description: string;
}

export interface FloodRisk {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  riskLevel: 'Extreme' | 'High' | 'Medium' | 'Low';
  waterDepth: number; // in cm
  description: string;
}

export interface Route {
  id: string;
  name: string;
  time: number; // in minutes
  distance: number; // in km
  heatRisk: 'High' | 'Medium' | 'Low' | 'Very Low';
  floodRisk: 'High' | 'Medium' | 'Low';
  trafficCongestion: 'Heavy' | 'Moderate' | 'Light' | 'Clear';
  climateScore: number; // Scale 1-100
  isRecommended: boolean;
  recommendationStatus: string;
  color: string; // hex color for drawing
  coordinates: [number, number][]; // [lat, lng] array
  estimatedEarning?: number; // VNĐ
  fuelCost?: number; // VNĐ
}

export interface PickupPoints {
  defaultPoint: {
    name: string;
    lat: number;
    lng: number;
    riskLevel: 'High' | 'Medium' | 'Low';
    reason: string;
  };
  suggestedPoint: {
    name: string;
    lat: number;
    lng: number;
    riskLevel: 'High' | 'Medium' | 'Low';
    reason: string;
  };
}

export interface ClimateReport {
  id: string;
  type: 'Too hot' | 'No shade' | 'Flooded' | 'Hard to stop' | 'Unsafe pickup/drop-off' | 'Traffic jam';
  lat: number;
  lng: number;
  note?: string;
  timestamp: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  uvIndex: number;
  weatherCondition: string;
  rainVolume: number;
  windSpeed: number;
  icon: string;
  alertLevel: 'extreme' | 'high' | 'moderate' | 'low';
  precipProbability: number;
  climateMode: 'rain' | 'heat' | 'normal';
}

export interface FloodForecastData {
  source: 'google-flood-api' | 'static';
  status: string;
  polygons?: { lat: number; lng: number }[][];
  gauges?: { id: string; name: string; waterLevel: number; lat: number; lng: number }[];
}
