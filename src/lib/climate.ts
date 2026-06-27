/**
 * GreenRoute — Climate Scoring Engine
 *
 * Score = 100 - HeatPenalty - FloodPenalty - TrafficPenalty - SunExposurePenalty + ShadeBonus
 * Clamped to [0, 100]
 */

import { HeatZone, FloodRisk, CoolStop } from '@/types';

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
const COOLSTOP_SHADE_RADIUS = 200; // mét

/** Luôn lấy mẫu điểm đầu/cuối để không bỏ sót vùng nguy hiểm ở hai đầu tuyến */
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
const HEAT_WEIGHT = 5;
const FLOOD_WEIGHT = 8;
const TRAFFIC_WEIGHT = 2;
const SHADE_WEIGHT = 3;
const SUN_EXPOSURE_WEIGHT = 12; // Phạt thêm khi nắng gắt mà không có bóng râm

export interface ClimateScoreResult {
  score: number;
  heatRisk: 'High' | 'Medium' | 'Low' | 'Very Low';
  floodRisk: 'High' | 'Medium' | 'Low';
  trafficCongestion: 'Heavy' | 'Moderate' | 'Light' | 'Clear';
  heatRatio: number;
  floodRatio: number;
  shadeRatio: number;
  trafficDelay: number;
}

export function calculateClimateScore(
  routeCoords: [number, number][],
  heatZones: HeatZone[],
  floodRisks: FloodRisk[],
  coolstops: CoolStop[],
  osrmDurationMin: number,
  distanceKm: number
): ClimateScoreResult {
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
    };
  }

  let heatExposure = 0;
  let floodExposure = 0;
  let shadeCount = 0;
  const sampleIndices = getSampleIndices(routeCoords.length);
  const totalSamples = sampleIndices.length;

  for (const idx of sampleIndices) {
    const point = routeCoords[idx];

    let pointHeat = 0;
    for (const zone of heatZones) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        pointHeat = Math.max(pointHeat, heatSeverity(zone));
      }
    }
    heatExposure += pointHeat;

    let pointFlood = 0;
    for (const zone of floodRisks) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        pointFlood = Math.max(pointFlood, floodSeverity(zone));
      }
    }
    floodExposure += pointFlood;

    for (const stop of coolstops) {
      if (haversine(point, [stop.lat, stop.lng]) < COOLSTOP_SHADE_RADIUS) {
        shadeCount++;
        break;
      }
    }
  }

  const heatRatio = heatExposure / totalSamples;
  const floodRatio = floodExposure / totalSamples;
  const shadeRatio = shadeCount / totalSamples;

  const idealDuration = (distanceKm / 25) * 60;
  const trafficDelay = Math.max(0, osrmDurationMin - idealDuration);

  // Phạt nắng nóng không bóng râm: heat cao + shade thấp
  const sunExposurePenalty =
    heatRatio > 0.25 && shadeRatio < 0.15
      ? (heatRatio - 0.25) * SUN_EXPOSURE_WEIGHT * 10
      : 0;

  const rawScore = 100
    - (heatRatio * 100 * HEAT_WEIGHT / 10)
    - (floodRatio * 100 * FLOOD_WEIGHT / 10)
    - (trafficDelay * TRAFFIC_WEIGHT)
    - sunExposurePenalty
    + (shadeRatio * 100 * SHADE_WEIGHT / 10);

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    score,
    heatRisk: getHeatRisk(heatRatio),
    floodRisk: getFloodRisk(floodRatio),
    trafficCongestion: getTrafficLevel(trafficDelay),
    heatRatio,
    floodRatio,
    shadeRatio,
    trafficDelay,
  };
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

export function rankRouteStrategy(
  climateScore: number,
  durationMin: number
): { strategy: 'fastest' | 'balanced' | 'coolest'; label: string; color: string } {
  const efficiency = climateScore / Math.max(durationMin, 1);
  if (efficiency > 8) {
    return { strategy: 'balanced', label: 'Tuyến Cân Bằng (Balanced Route)', color: '#22c55e' };
  }
  if (climateScore > 80) {
    return { strategy: 'coolest', label: 'Tuyến Mát Nhất (Coolest Route)', color: '#3b82f6' };
  }
  return { strategy: 'fastest', label: 'Tuyến Nhanh Nhất (Fastest Route)', color: '#ef4444' };
}
