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

type OsrmRoute = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
};

// ─── OSRM Helper ────────────────────────────────────────────────────────────
async function fetchOSRM(
  coords: [number, number][],
  alternatives: number = 1
): Promise<OsrmRoute[]> {
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
    distance: r.distance / 1000,
    duration: r.duration / 60,
  }));
}

// ─── Route deduplication ────────────────────────────────────────────────────
function routesAreSimilar(a: OsrmRoute, b: OsrmRoute): boolean {
  const distDiff = Math.abs(a.distance - b.distance) / Math.max(a.distance, 0.1);
  if (distDiff > 0.12) return false;

  const midA = a.coordinates[Math.floor(a.coordinates.length / 2)] ?? a.coordinates[0];
  const midB = b.coordinates[Math.floor(b.coordinates.length / 2)] ?? b.coordinates[0];
  return haversine(midA, midB) < 200;
}

function dedupeRoutes(routes: OsrmRoute[]): OsrmRoute[] {
  const unique: OsrmRoute[] = [];
  for (const route of routes) {
    if (!unique.some(u => routesAreSimilar(u, route))) {
      unique.push(route);
    }
  }
  return unique;
}

// ─── CoolStop waypoints ─────────────────────────────────────────────────────
function findCorridorCoolStops(
  origin: [number, number],
  destination: [number, number],
  limit = 4
): CoolStop[] {
  const minLat = Math.min(origin[0], destination[0]) - 0.008;
  const maxLat = Math.max(origin[0], destination[0]) + 0.008;
  const minLng = Math.min(origin[1], destination[1]) - 0.008;
  const maxLng = Math.max(origin[1], destination[1]) + 0.008;

  return coolstops
    .filter(s => s.lat >= minLat && s.lat <= maxLat && s.lng >= minLng && s.lng <= maxLng)
    .sort((a, b) => b.shadeScore - a.shadeScore)
    .slice(0, limit);
}

// ─── Heat-avoidance detour waypoint ─────────────────────────────────────────
function findHeatAvoidanceWaypoint(
  origin: [number, number],
  destination: [number, number]
): [number, number] | null {
  const midLat = (origin[0] + destination[0]) / 2;
  const midLng = (origin[1] + destination[1]) / 2;
  const midPoint: [number, number] = [midLat, midLng];

  const threatening = heatZones
    .map(zone => ({
      zone,
      dist: haversine(midPoint, [zone.lat, zone.lng]),
      severity: zone.heatIndex * (zone.riskLevel === 'High' ? 1.2 : 1),
    }))
    .filter(z => z.dist < z.zone.radius + 400)
    .sort((a, b) => b.severity - a.severity);

  if (threatening.length === 0) return null;

  const { zone } = threatening[0];
  const dLat = destination[0] - origin[0];
  const dLng = destination[1] - origin[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

  // Vuông góc với hướng O→D, lệch ~350m để tránh tâm vùng nóng
  const offsetDeg = 350 / 111_000;
  const perpLat = (-dLng / len) * offsetDeg;
  const perpLng = (dLat / len) * offsetDeg;

  const candidateA: [number, number] = [zone.lat + perpLat, zone.lng + perpLng];
  const candidateB: [number, number] = [zone.lat - perpLat, zone.lng - perpLng];

  const scoreA = heatZones.reduce(
    (sum, z) => sum + (haversine(candidateA, [z.lat, z.lng]) < z.radius ? z.heatIndex : 0),
    0
  );
  const scoreB = heatZones.reduce(
    (sum, z) => sum + (haversine(candidateB, [z.lat, z.lng]) < z.radius ? z.heatIndex : 0),
    0
  );

  return scoreA <= scoreB ? candidateA : candidateB;
}

// ─── Generate diverse route candidates ──────────────────────────────────────
async function generateRouteCandidates(
  origin: [number, number],
  destination: [number, number]
): Promise<OsrmRoute[]> {
  const candidates: OsrmRoute[] = [];

  try {
    const direct = await fetchOSRM([origin, destination], 3);
    candidates.push(...direct);
  } catch {
    // OSRM direct call failed
  }

  const corridorStops = findCorridorCoolStops(origin, destination);
  for (const stop of corridorStops) {
    try {
      const viaCool = await fetchOSRM([origin, [stop.lat, stop.lng], destination], 0);
      candidates.push(...viaCool);
    } catch {
      // Skip failed waypoint
    }
  }

  const avoidPoint = findHeatAvoidanceWaypoint(origin, destination);
  if (avoidPoint) {
    try {
      const viaAvoid = await fetchOSRM([origin, avoidPoint, destination], 0);
      candidates.push(...viaAvoid);
    } catch {
      // Skip failed detour
    }
  }

  return dedupeRoutes(candidates);
}

type ScoredRoute = OsrmRoute & ReturnType<typeof calculateClimateScore> & { index: number };

/** Nội suy điểm dọc tuyến để tránh polyline 2–3 điểm (đường zigzag) */
function interpolateRoute(
  points: [number, number][],
  stepsPerSegment = 16
): [number, number][] {
  if (points.length < 2) return points;
  const result: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      result.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// ─── GET: Sinh 3 tuyến đường thông minh ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const originLat = searchParams.get('originLat');
  const originLng = searchParams.get('originLng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(fallbackRoutes);
  }

  const origin: [number, number] = [parseFloat(originLat), parseFloat(originLng)];
  const destination: [number, number] = [parseFloat(destLat), parseFloat(destLng)];

  try {
    let osrmResults = (await generateRouteCandidates(origin, destination)).slice(0, 6);

    if (osrmResults.length === 0) {
      const dist = haversine(origin, destination) / 1000;
      const baseTime = (dist / 40) * 60;
      const midLat = (origin[0] + destination[0]) / 2;
      const midLng = (origin[1] + destination[1]) / 2;

      osrmResults = [
        { coordinates: interpolateRoute([origin, destination]), distance: dist, duration: baseTime },
        { coordinates: interpolateRoute([origin, [midLat + 0.005, midLng], destination]), distance: dist * 1.1, duration: baseTime * 1.1 },
        { coordinates: interpolateRoute([origin, [midLat, midLng - 0.005], destination]), distance: dist * 1.2, duration: baseTime * 1.2 },
      ];
    }

    const scoredRoutes: ScoredRoute[] = osrmResults.map((osrm, index) => {
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

    const byDuration = [...scoredRoutes].sort((a, b) => a.duration - b.duration);
    const byScore = [...scoredRoutes].sort((a, b) => b.score - a.score);
    const byEfficiency = [...scoredRoutes].sort(
      (a, b) => (b.score / Math.max(b.duration, 1)) - (a.score / Math.max(a.duration, 1))
    );

    const assigned = new Set<number>();
    const routeConfigs: {
      idx: number;
      id: string;
      name: string;
      color: string;
      isRecommended: boolean;
      status: string;
    }[] = [];

    const fastest = byDuration[0];
    assigned.add(fastest.index);
    routeConfigs.push({
      idx: fastest.index,
      id: 'route-fastest',
      name: 'Tuyến Nhanh Nhất',
      color: '#ef4444',
      isRecommended: false,
      status: fastest.heatRisk === 'High'
        ? `Nhanh nhất nhưng đi qua vùng nắng nóng cực đoan (${Math.round(fastest.heatRatio * 100)}% tuyến). Climate Score: ${fastest.score}/100.`
        : `Nhanh nhất (${Math.round(fastest.duration)} phút) nhưng ít bóng râm hơn. Climate Score: ${fastest.score}/100.`,
    });

    const balancedEntry = byEfficiency.find(e => !assigned.has(e.index)) ?? byEfficiency[0];
    assigned.add(balancedEntry.index);
    routeConfigs.push({
      idx: balancedEntry.index,
      id: 'route-balanced',
      name: 'Tuyến Cân Bằng',
      color: '#22c55e',
      isRecommended: true,
      status: `Khuyên dùng! Cân bằng tối ưu giữa thời gian và sức khỏe tài xế. Climate Score: ${balancedEntry.score}/100.`,
    });

    const coolestEntry = byScore.find(e => !assigned.has(e.index)) ?? byScore[0];
    assigned.add(coolestEntry.index);
    const shadePct = Math.round(coolestEntry.shadeRatio * 100);
    routeConfigs.push({
      idx: coolestEntry.index,
      id: 'route-coolest',
      name: 'Tuyến Mát Nhất',
      color: '#3b82f6',
      isRecommended: false,
      status: shadePct >= 20
        ? `Tuyến mát nhất với ${shadePct}% đoạn gần CoolStop. Climate Score: ${coolestEntry.score}/100.`
        : `Ít tiếp xúc nắng/ngập nhất trong các lựa chọn. Climate Score: ${coolestEntry.score}/100.`,
    });

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
        fuelCost: Math.round(scored.distance * 2000),
      };
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error('Lỗi khi sinh tuyến đường OSRM:', error);
    return NextResponse.json(fallbackRoutes);
  }
}

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
