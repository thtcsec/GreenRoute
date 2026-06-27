/**
 * GreenRoute — Climate Scoring Engine
 * 
 * Công thức cốt lõi tính điểm khí hậu (Climate Score) cho mỗi tuyến đường,
 * dựa trên vùng nắng nóng, vùng ngập, tắc nghẽn giao thông, và trạm mát.
 * 
 * Score = 100 - HeatPenalty - FloodPenalty - TrafficPenalty + ShadeBonus
 * Kẹp trong khoảng [0, 100]
 */

import { HeatZone, FloodRisk, CoolStop } from '@/types';

// ─── Haversine Distance (meters) ────────────────────────────────────────────
// Công thức tính khoảng cách giữa 2 điểm trên bề mặt Trái Đất (hình cầu)
// d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)×cos(lat₂)×sin²(Δlng/2)))
export function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6_371_000; // Bán kính Trái Đất (mét)
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

// ─── Climate Score Algorithm ────────────────────────────────────────────────
// Trọng số mặc định cho bài toán shipper Thủ Đức
const HEAT_WEIGHT = 5;    // Mỗi % tuyến nắng → trừ 5 × ratio điểm
const FLOOD_WEIGHT = 8;   // Mỗi % tuyến ngập → trừ 8 × ratio điểm 
const TRAFFIC_WEIGHT = 2; // Mỗi phút kẹt thêm → trừ 2 điểm
const SHADE_WEIGHT = 3;   // Mỗi % tuyến gần CoolStop → cộng 3 × ratio điểm
const SAMPLE_INTERVAL = 5; // Lấy mẫu mỗi 5 điểm trên polyline (tối ưu hiệu năng)

export interface ClimateScoreResult {
  score: number;           // 0-100
  heatRisk: 'High' | 'Medium' | 'Low' | 'Very Low';
  floodRisk: 'High' | 'Medium' | 'Low';
  trafficCongestion: 'Heavy' | 'Moderate' | 'Light' | 'Clear';
  heatRatio: number;       // 0.0 - 1.0
  floodRatio: number;      // 0.0 - 1.0
  shadeRatio: number;      // 0.0 - 1.0
  trafficDelay: number;    // phút
}

export function calculateClimateScore(
  routeCoords: [number, number][],
  heatZones: HeatZone[],
  floodRisks: FloodRisk[],
  coolstops: CoolStop[],
  osrmDurationMin: number,  // Thời gian thực tế từ OSRM (phút)
  distanceKm: number        // Khoảng cách tuyến (km)
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

  let heatCount = 0;
  let floodCount = 0;
  let shadeCount = 0;
  let sampledPoints = 0;

  // Lấy mẫu điểm trên tuyến đường (không check toàn bộ → quá chậm)
  for (let i = 0; i < routeCoords.length; i += SAMPLE_INTERVAL) {
    const point = routeCoords[i];
    sampledPoints++;

    // Kiểm tra tuyến cắt qua vùng nắng nóng
    for (const zone of heatZones) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        heatCount++;
        break; // Chỉ đếm 1 lần/điểm mẫu
      }
    }

    // Kiểm tra tuyến cắt qua vùng ngập
    for (const zone of floodRisks) {
      if (haversine(point, [zone.lat, zone.lng]) < zone.radius) {
        floodCount++;
        break;
      }
    }

    // Kiểm tra tuyến gần trạm mát CoolStop (bán kính 200m)
    for (const stop of coolstops) {
      if (haversine(point, [stop.lat, stop.lng]) < 200) {
        shadeCount++;
        break;
      }
    }
  }

  const totalSamples = Math.max(sampledPoints, 1);
  const heatRatio = heatCount / totalSamples;
  const floodRatio = floodCount / totalSamples;
  const shadeRatio = shadeCount / totalSamples;

  // Thời gian di chuyển lý tưởng (tốc độ trung bình xe máy nội đô ~25km/h)
  const idealDuration = (distanceKm / 25) * 60;
  const trafficDelay = Math.max(0, osrmDurationMin - idealDuration);

  // Công thức chấm điểm
  const rawScore = 100
    - (heatRatio * 100 * HEAT_WEIGHT / 10)
    - (floodRatio * 100 * FLOOD_WEIGHT / 10)
    - (trafficDelay * TRAFFIC_WEIGHT)
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

// ─── Label Helpers ──────────────────────────────────────────────────────────
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

// ─── Route Ranking ──────────────────────────────────────────────────────────
// Xếp loại tuyến đường dựa trên strategy:
//   Fastest  = min(duration)
//   Balanced = max(climateScore / duration)  → trade-off tốt nhất
//   Coolest  = max(climateScore)
export function rankRouteStrategy(
  climateScore: number,
  durationMin: number
): { strategy: 'fastest' | 'balanced' | 'coolest'; label: string; color: string } {
  // Sẽ được gọi sau khi đã sort, strategy được gán bên ngoài
  // Hàm này chỉ gán label & color
  const efficiency = climateScore / Math.max(durationMin, 1);
  if (efficiency > 8) {
    return { strategy: 'balanced', label: 'Tuyến Cân Bằng (Balanced Route)', color: '#22c55e' };
  }
  if (climateScore > 80) {
    return { strategy: 'coolest', label: 'Tuyến Mát Nhất (Coolest Route)', color: '#3b82f6' };
  }
  return { strategy: 'fastest', label: 'Tuyến Nhanh Nhất (Fastest Route)', color: '#ef4444' };
}
