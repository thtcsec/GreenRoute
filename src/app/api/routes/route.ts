import { NextResponse, NextRequest } from 'next/server';
import { Route, HeatZone, FloodRisk, CoolStop } from '@/types';
import { calculateClimateScore, haversine } from '@/lib/climate';
import heatZonesData from '@/data/heat_zones.json';
import floodRisksData from '@/data/flood_risks.json';
import coolstopsData from '@/data/coolstops.json';
import routesData from '@/data/routes.json';

const heatZones = heatZonesData as HeatZone[];
const floodRisks = floodRisksData as FloodRisk[];
const coolstops = coolstopsData as CoolStop[];
const fallbackRoutes = routesData as Route[];

// ─── OSRM Helper ────────────────────────────────────────────────────────────
// Gọi OSRM Project API (miễn phí, không cần key)
async function fetchOSRM(
  coords: [number, number][],    // Mảng [lat, lng]
  alternatives: number = 1
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }[]> {
  const waypointStr = coords.map(c => `${c[1]},${c[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${waypointStr}?overview=full&geometries=geojson&alternatives=${alternatives}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('OSRM trả về 0 tuyến đường');
  }

  return data.routes.map((r: { geometry: { coordinates: number[][] }; distance: number; duration: number }) => ({
    coordinates: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
    distance: r.distance / 1000,     // km
    duration: r.duration / 60,       // phút
  }));
}

// ─── Tìm CoolStop nằm giữa 2 điểm để tạo waypoint cho tuyến "Coolest" ────
function findMidwayCoolStop(
  origin: [number, number],
  destination: [number, number]
): CoolStop | null {
  const midLat = (origin[0] + destination[0]) / 2;
  const midLng = (origin[1] + destination[1]) / 2;
  const midPoint: [number, number] = [midLat, midLng];

  // Lọc CoolStop trong phạm vi hợp lý (< 2km từ trung điểm)
  const nearby = coolstops.filter(s => haversine(midPoint, [s.lat, s.lng]) < 2000);
  if (nearby.length === 0) return null;

  // Chọn CoolStop có shadeScore cao nhất trong vùng
  nearby.sort((a, b) => b.shadeScore - a.shadeScore);
  return nearby[0];
}

// ─── GET: Sinh 3 tuyến đường thông minh ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const originLat = searchParams.get('originLat');
  const originLng = searchParams.get('originLng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');

  // Nếu không có tọa độ → trả về dữ liệu tĩnh fallback
  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(fallbackRoutes);
  }

  const origin: [number, number] = [parseFloat(originLat), parseFloat(originLng)];
  const destination: [number, number] = [parseFloat(destLat), parseFloat(destLng)];

  try {
    // ── Bước 1: Gọi OSRM với alternatives=3 để lấy nhiều tuyến ────────
    let osrmResults = await fetchOSRM([origin, destination], 3);

    // ── Bước 2: Nếu OSRM chỉ trả 1-2 tuyến, tạo thêm tuyến qua CoolStop ─
    if (osrmResults.length < 3) {
      const coolStop = findMidwayCoolStop(origin, destination);
      if (coolStop) {
        try {
          const coolRoute = await fetchOSRM(
            [origin, [coolStop.lat, coolStop.lng], destination],
            1
          );
          if (coolRoute.length > 0) {
            // Chỉ thêm nếu tuyến mới khác biệt đáng kể (>10% khoảng cách)
            const existingDistances = osrmResults.map(r => r.distance);
            const newDist = coolRoute[0].distance;
            const isDifferent = existingDistances.every(d => Math.abs(d - newDist) / d > 0.1);
            if (isDifferent) {
              osrmResults.push(coolRoute[0]);
            }
          }
        } catch {
          // Không thể tạo tuyến qua CoolStop, bỏ qua
        }
      }
    }

    // Giới hạn tối đa 3 tuyến
    osrmResults = osrmResults.slice(0, 3);

    // ── Bước 3: Tính Climate Score cho mỗi tuyến ──────────────────────
    const scoredRoutes = osrmResults.map((osrm, index) => {
      const result = calculateClimateScore(
        osrm.coordinates,
        heatZones,
        floodRisks,
        coolstops,
        osrm.duration,
        osrm.distance
      );
      return { ...osrm, ...result, index };
    });

    // ── Bước 4: Xếp loại Fastest / Balanced / Coolest ─────────────────
    // Sort theo duration tăng dần
    const byDuration = [...scoredRoutes].sort((a, b) => a.duration - b.duration);
    // Sort theo climateScore giảm dần
    const byScore = [...scoredRoutes].sort((a, b) => b.score - a.score);
    // Sort theo efficiency = score / duration giảm dần
    const byEfficiency = [...scoredRoutes].sort(
      (a, b) => (b.score / Math.max(b.duration, 1)) - (a.score / Math.max(a.duration, 1))
    );

    // Gán chiến lược: ưu tiên không trùng lặp
    const assigned = new Set<number>();
    const routeConfigs: { idx: number; id: string; name: string; color: string; isRecommended: boolean; status: string }[] = [];

    // Fastest = tuyến nhanh nhất
    const fastestIdx = byDuration[0].index;
    assigned.add(fastestIdx);
    routeConfigs.push({
      idx: fastestIdx,
      id: 'route-fastest',
      name: 'Tuyến Nhanh Nhất',
      color: '#ef4444',
      isRecommended: false,
      status: `Nhanh nhất nhưng đi qua ${byDuration[0].heatRisk === 'High' ? 'vùng nắng nóng cực đoan' : 'khu vực ít bóng mát'}. Climate Score: ${byDuration[0].score}/100.`
    });

    // Balanced = hiệu quả nhất (score/time), không trùng fastest
    const balancedEntry = byEfficiency.find(e => !assigned.has(e.index)) || byEfficiency[0];
    assigned.add(balancedEntry.index);
    routeConfigs.push({
      idx: balancedEntry.index,
      id: 'route-balanced',
      name: 'Tuyến Cân Bằng',
      color: '#22c55e',
      isRecommended: true,
      status: `Khuyên dùng! Cân bằng tối ưu giữa thời gian và sức khỏe tài xế. Climate Score: ${balancedEntry.score}/100.`
    });

    // Coolest = điểm khí hậu cao nhất, không trùng
    const coolestEntry = byScore.find(e => !assigned.has(e.index)) || byScore[0];
    assigned.add(coolestEntry.index);
    routeConfigs.push({
      idx: coolestEntry.index,
      id: 'route-coolest',
      name: 'Tuyến Mát Nhất',
      color: '#3b82f6',
      isRecommended: false,
      status: `Tuyến đường mát mẻ nhất, ${coolestEntry.shadeRatio > 0.3 ? 'nhiều bóng râm' : 'ít tiếp xúc nắng'}. Climate Score: ${coolestEntry.score}/100.`
    });

    // ── Bước 5: Build response format chuẩn ───────────────────────────
    const routes: Route[] = routeConfigs.map(config => {
      const scored = scoredRoutes[config.idx];
      return {
        id: config.id,
        name: config.name,
        time: Math.round(scored.duration),
        distance: +scored.distance.toFixed(1),
        heatRisk: scored.heatRisk,
        floodRisk: scored.floodRisk,
        trafficCongestion: scored.trafficCongestion,
        climateScore: scored.score,
        isRecommended: config.isRecommended,
        recommendationStatus: config.status,
        color: config.color,
        coordinates: scored.coordinates,
        estimatedEarning: 25000,
        fuelCost: Math.round(scored.distance * 2000), // ~2000 VNĐ/km
      };
    });

    return NextResponse.json(routes);

  } catch (error) {
    console.error('Lỗi khi sinh tuyến đường OSRM:', error);
    // Fallback: trả dữ liệu tĩnh nếu OSRM fail
    return NextResponse.json(fallbackRoutes);
  }
}

// ─── POST: Vẫn giữ để tương thích ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.coordinates || !body.time || !body.distance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name: body.name,
      time: body.time,
      distance: body.distance,
      heatRisk: body.heatRisk || 'Medium',
      floodRisk: body.floodRisk || 'Low',
      trafficCongestion: body.trafficCongestion || 'Light',
      climateScore: body.climateScore || 50,
      isRecommended: body.isRecommended || false,
      recommendationStatus: body.recommendationStatus || '',
      color: body.color || '#94a3b8',
      coordinates: body.coordinates,
    };

    return NextResponse.json(newRoute, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
