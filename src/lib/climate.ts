/**
 * GreenRoute — Climate Scoring Engine
 *
 * Formula:
 * climate_penalty (0-10) = (heat * 0.40) + (flood * 0.30) + (shade_lack * 0.20) + (stop_risk * 0.10)
 * Climate Score = Math.round((1 - climate_penalty / 10) * 100)
 */

import { HeatZone, FloodRisk, CoolStop, WeatherData, ClimateReport, TrafficZone } from '@/types';

// ─── Haversine Distance (meters) ────────────────────────────────────────────
export function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(
    Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)
  );
  return R * c;
}

// ─── Sampling ───────────────────────────────────────────────────────────────
const SAMPLE_INTERVAL = 5;
const COOLSTOP_SHADE_RADIUS = 200; // meters

export function getSampleIndices(length: number, interval = SAMPLE_INTERVAL): number[] {
  if (length <= 0) return [];
  const indices = new Set<number>([0, length - 1]);
  for (let i = 0; i < length; i += interval) {
    indices.add(i);
  }
  return [...indices].sort((a, b) => a - b);
}

// ─── Zone severity weights ──────────────────────────────────────────────────
const HEAT_RISK_MULT: Record<HeatZone['riskLevel'], number> = {
  High: 1.0,
  'Medium-High': 0.85,
  Medium: 0.65,
  Low: 0.4,
};

const FLOOD_RISK_MULT: Record<FloodRisk['riskLevel'], number> = {
  Extreme: 1.0,
  High: 0.85,
  Medium: 0.6,
  Low: 0.35,
};

function heatSeverity(zone: HeatZone): number {
  const indexFactor = Math.min(1, Math.max(0, (zone.heatIndex - 32) / 15));
  return indexFactor * (HEAT_RISK_MULT[zone.riskLevel] ?? 0.7);
}

function floodSeverity(zone: FloodRisk): number {
  const depthFactor = Math.min(1, zone.waterDepth / 50);
  return depthFactor * (FLOOD_RISK_MULT[zone.riskLevel] ?? 0.7);
}

// ─── Climate Score Algorithm ────────────────────────────────────────────────
const WEIGHTS = {
  heat: 0.40,
  flood: 0.30,
  shade_lack: 0.20,
  stop_risk: 0.10
};

export interface ClimateScoreResult {
  score: number;
  heatRisk: 'High' | 'Medium' | 'Low' | 'Very Low';
  floodRisk: 'High' | 'Medium' | 'Low';
  trafficCongestion: 'Heavy' | 'Moderate' | 'Light' | 'Clear';
  heatRatio: number;
  floodRatio: number;
  shadeRatio: number;
  trafficDelay: number;
  totalDuration: number;
}

export function calculateClimateScore(
  routeCoords: [number, number][],
  heatZones: HeatZone[] = [],
  floodRisks: FloodRisk[] = [],
  coolstops: CoolStop[] = [],
  trafficZones: TrafficZone[] = [],
  osrmDurationMin: number = 0,
  distanceKm: number = 0,
  weatherData?: WeatherData | null,
  reports?: ClimateReport[] | null
): ClimateScoreResult {
  // Phòng thủ: ép kiểu mảng để tránh crash khi caller truyền undefined/null/non-array
  const safeHeat = Array.isArray(heatZones) ? heatZones : [];
  const safeFlood = Array.isArray(floodRisks) ? floodRisks : [];
  const safeCool = Array.isArray(coolstops) ? coolstops : [];
  const safeTraffic = Array.isArray(trafficZones) ? trafficZones : [];
  const safeReports = Array.isArray(reports) ? reports : [];

  if (!routeCoords || routeCoords.length === 0) {
    return {
      score: 50,
      heatRisk: 'Medium',
      floodRisk: 'Low',
      trafficCongestion: 'Light',
      heatRatio: 0,
      floodRatio: 0,
      shadeRatio: 0,
      trafficDelay: 0,
      totalDuration: osrmDurationMin,
    };
  }

  let heatExposure = 0;
  let floodExposure = 0;
  let shadeCount = 0;
  let totalStopDistances = 0;
  
  const intersectedTrafficZones = new Set<string>();

  const sampleIndices = getSampleIndices(routeCoords.length);
  const totalSamples = sampleIndices.length;

  for (const idx of sampleIndices) {
    const point = routeCoords[idx];

    // Heat
    let pointHeat = 0;
    for (const zone of safeHeat) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        pointHeat = Math.max(pointHeat, heatSeverity(zone));
      }
    }
    
    // Flood
    let pointFlood = 0;
    for (const zone of safeFlood) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        pointFlood = Math.max(pointFlood, floodSeverity(zone));
      }
    }
    
    // Traffic
    for (const zone of safeTraffic) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        intersectedTrafficZones.add(zone.id);
      }
    }

    // Community Reports feedback loop (300m radius)
    if (safeReports.length > 0) {
      let reportHeatBoost = 0;
      let reportFloodBoost = 0;
      for (const report of safeReports) {
        if (haversine(point, [report.lat, report.lng]) < 300) {
          if (report.type === 'Too hot' || report.type === 'No shade') {
            reportHeatBoost += 10;
          } else if (report.type === 'Flooded') {
            reportFloodBoost += 10;
          }
        }
      }
      pointHeat += reportHeatBoost;
      pointFlood += reportFloodBoost;
    }

    heatExposure += Math.min(1, pointHeat);
    floodExposure += Math.min(1, pointFlood);

    // Shade & Stop Risk
    let minStopDistance = Infinity;
    for (const stop of safeCool) {
      const dist = haversine(point, [stop.lat, stop.lng]);
      if (dist < minStopDistance) {
        minStopDistance = dist;
      }
      if (dist < COOLSTOP_SHADE_RADIUS) {
        shadeCount++;
      }
    }
    // Khi không có CoolStop nào, tránh để Infinity lan vào phép tính trung bình
    if (!Number.isFinite(minStopDistance)) {
      minStopDistance = 1000; // coi như rất xa => stop risk cao
    }
    
    // Add report penalty to stop distance if "Khó dừng đỗ" or "Đón trả không an toàn" is reported nearby
    if (safeReports.length > 0) {
      for (const report of safeReports) {
        if (haversine(point, [report.lat, report.lng]) < 300) {
          if (report.type === 'Hard to stop' || report.type === 'Unsafe pickup/drop-off') {
            minStopDistance += 200; // Increase effective distance
          }
        }
      }
    }
    totalStopDistances += minStopDistance;
  }

  let heatRatio = heatExposure / totalSamples;
  let floodRatio = floodExposure / totalSamples;
  const shadeRatio = Math.min(1, shadeCount / totalSamples); // capped at 1
  
  // Weather Boosters
  if (weatherData) {
    if (weatherData.feelsLike >= 38 || weatherData.climateMode === 'heat') {
      heatRatio = Math.min(1, heatRatio * 1.2);
    }
    if (weatherData.rainVolume > 5 || weatherData.precipProbability > 60 || weatherData.climateMode === 'rain') {
      floodRatio = Math.min(1, floodRatio * 1.2);
    }
  }

  // Calculate Sub-Scores (0-10 scale)
  const heatScore = heatRatio * 10;
  const floodScore = floodRatio * 10;
  const shadeLackScore = (1 - shadeRatio) * 10;
  
  const avgStopDist = totalStopDistances / totalSamples;
  // Stop risk logic: >500m -> high risk (10), <100m -> low risk (0)
  const stopRiskScore = Math.min(10, Math.max(0, (avgStopDist - 100) / 40)); 

  // Core Formula
  const climate_penalty = 
    (heatScore * WEIGHTS.heat) + 
    (floodScore * WEIGHTS.flood) + 
    (shadeLackScore * WEIGHTS.shade_lack) + 
    (stopRiskScore * WEIGHTS.stop_risk);

  const rawScore = (1 - climate_penalty / 10) * 100;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Add traffic delay based on intersected zones
  let trafficDelayMin = 0;
  for (const zoneId of intersectedTrafficZones) {
    const zone = safeTraffic.find(z => z.id === zoneId);
    if (zone && Number.isFinite(zone.delayMin)) trafficDelayMin += zone.delayMin;
  }
  
  // Tổng thời gian bao gồm cả kẹt xe
  const totalDuration = osrmDurationMin + trafficDelayMin;

  return {
    score,
    heatRisk: getHeatRisk(heatRatio),
    floodRisk: getFloodRisk(floodRatio),
    trafficCongestion: getTrafficLevel(trafficDelayMin),
    heatRatio,
    floodRatio,
    shadeRatio,
    trafficDelay: trafficDelayMin,
    totalDuration,
  };
}

// ─── Route Decision Logic ──────────────────────────────────────────────────
export const TIME_THRESHOLD_MINS = 5;

export function shouldRecommendBalanced(fastest: { time: number, climateScore: number }, balanced: { time: number, climateScore: number }): boolean {
  return balanced.time <= fastest.time + TIME_THRESHOLD_MINS && balanced.climateScore > fastest.climateScore;
}

function getHeatRisk(ratio: number): 'High' | 'Medium' | 'Low' | 'Very Low' {
  if (ratio > 0.5) return 'High';
  if (ratio > 0.25) return 'Medium';
  if (ratio > 0.1) return 'Low';
  return 'Very Low';
}

function getFloodRisk(ratio: number): 'High' | 'Medium' | 'Low' {
  if (ratio > 0.3) return 'High';
  if (ratio > 0.1) return 'Medium';
  return 'Low';
}

function getTrafficLevel(delayMin: number): 'Heavy' | 'Moderate' | 'Light' | 'Clear' {
  if (delayMin > 5) return 'Heavy';
  if (delayMin > 3) return 'Moderate';
  if (delayMin > 1) return 'Light';
  return 'Clear';
}
