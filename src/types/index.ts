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
  climateScore: number; // Scale 1-100
  isRecommended: boolean;
  recommendationStatus: string;
  color: string; // hex color for drawing
  coordinates: [number, number][]; // [lat, lng] array
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
  type: 'Too hot' | 'No shade' | 'Flooded' | 'Hard to stop' | 'Unsafe pickup/drop-off';
  lat: number;
  lng: number;
  note?: string;
  timestamp: string;
}
