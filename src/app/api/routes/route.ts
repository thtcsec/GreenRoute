import { NextResponse, NextRequest } from 'next/server';
import { Route, HeatZone, FloodRisk, CoolStop } from '@/types';
import { calculateClimateScore, haversine } from '@/lib/climate';
import clientPromise from '@/lib/mongodb';

type OsrmRoute = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
};

// ─── OSRM Helper ────────────────────────────────────────────────────────────
async function fetchOSRM(
  waypoints: [number, number][],
  alternatives = 0
): Promise<OsrmRoute[]> {
  const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=${alternatives ? 'true' : 'false'}`;
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GreenRoute-Hackathon/1.0' },
    next: { revalidate: 3600 }
  });
  
  if (!res.ok) throw new Error('OSRM API failed');
  const data = await res.json();
  
  if (data.code !== 'Ok' || !data.routes) throw new Error('No routes found');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.routes.map((r: any) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coordinates: r.geometry.coordinates.map((c: any) => [c[1], c[0]]),
    distance: r.distance,
    duration: r.duration / 60,
  }));
}

function dedupeRoutes(routes: OsrmRoute[]): OsrmRoute[] {
  const unique: OsrmRoute[] = [];
  for (const r of routes) {
    if (!unique.some(u => Math.abs(u.distance - r.distance) < 50 && Math.abs(u.duration - r.duration) < 1)) {
      unique.push(r);
    }
  }
  return unique;
}

function findCorridorCoolStops(
  origin: [number, number],
  destination: [number, number],
  coolstops: CoolStop[]
): CoolStop[] {
  const dLat = destination[0] - origin[0];
  const dLng = destination[1] - origin[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
  const uLat = dLat / len;
  const uLng = dLng / len;

  return coolstops.filter(stop => {
    const vLat = stop.lat - origin[0];
    const vLng = stop.lng - origin[1];
    const proj = vLat * uLat + vLng * uLng;
    if (proj < 0 || proj > len) return false;
    const perpLat = vLat - proj * uLat;
    const perpLng = vLng - proj * uLng;
    const distToLine = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
    return distToLine < 0.01;
  }).slice(0, 2);
}

function findHeatAvoidanceWaypoint(
  origin: [number, number],
  destination: [number, number],
  heatZones: HeatZone[]
): [number, number] | null {
  const threatening = heatZones
    .map(zone => {
      const dist = haversine(origin, [zone.lat, zone.lng]);
      return { zone, dist };
    })
    .filter(z => z.dist < 5000 && z.zone.heatIndex >= 38)
    .sort((a, b) => a.dist - b.dist);

  if (threatening.length === 0) return null;

  const { zone } = threatening[0];
  const dLat = destination[0] - origin[0];
  const dLng = destination[1] - origin[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

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

async function generateRouteCandidates(
  origin: [number, number],
  destination: [number, number],
  coolstops: CoolStop[],
  heatZones: HeatZone[]
): Promise<OsrmRoute[]> {
  const candidates: OsrmRoute[] = [];

  try {
    const direct = await fetchOSRM([origin, destination], 3);
    candidates.push(...direct);
  } catch {}

  const corridorStops = findCorridorCoolStops(origin, destination, coolstops);
  for (const stop of corridorStops) {
    try {
      const viaCool = await fetchOSRM([origin, [stop.lat, stop.lng], destination], 0);
      candidates.push(...viaCool);
    } catch {}
  }

  const avoidPoint = findHeatAvoidanceWaypoint(origin, destination, heatZones);
  if (avoidPoint) {
    try {
      const viaAvoid = await fetchOSRM([origin, avoidPoint, destination], 0);
      candidates.push(...viaAvoid);
    } catch {}
  }

  return dedupeRoutes(candidates);
}

type ScoredRoute = OsrmRoute & ReturnType<typeof calculateClimateScore> & { index: number };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const originLat = searchParams.get('originLat');
  const originLng = searchParams.get('originLng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');

  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    // Fetch data from MongoDB
    const [dbRoutes, dbHeat, dbFlood, dbCool] = await Promise.all([
      db.collection('routes').find({}).toArray(),
      db.collection('heat_zones').find({}).toArray(),
      db.collection('flood_risks').find({}).toArray(),
      db.collection('coolstops').find({}).toArray()
    ]);

    const fallbackRoutes = dbRoutes.map(d => { const { _id, ...rest } = d; return rest as Route; });
    const heatZones = dbHeat.map(d => { const { _id, ...rest } = d; return rest as HeatZone; });
    const floodRisks = dbFlood.map(d => { const { _id, ...rest } = d; return rest as FloodRisk; });
    const coolstops = dbCool.map(d => { const { _id, ...rest } = d; return rest as CoolStop; });

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json(fallbackRoutes);
    }

    const origin: [number, number] = [parseFloat(originLat), parseFloat(originLng)];
    const destination: [number, number] = [parseFloat(destLat), parseFloat(destLng)];

    let osrmResults = (await generateRouteCandidates(origin, destination, coolstops, heatZones)).slice(0, 6);

    if (osrmResults.length === 0) {
      console.warn("OSRM fetch failed entirely, generating synthetic routes");
      const dist = haversine(origin, destination) / 1000;
      const baseTime = (dist / 40) * 60;
      const midLat = (origin[0] + destination[0]) / 2;
      const midLng = (origin[1] + destination[1]) / 2;
      osrmResults = [
        { coordinates: [origin, destination], distance: dist, duration: baseTime },
        { coordinates: [origin, [midLat + 0.005, midLng], destination], distance: dist * 1.1, duration: baseTime * 1.1 },
        { coordinates: [origin, [midLat, midLng - 0.005], destination], distance: dist * 1.2, duration: baseTime * 1.2 }
      ];
    }

    const scoredRoutes: ScoredRoute[] = osrmResults.map((osrm, index) => {
      const result = calculateClimateScore(osrm.coordinates, heatZones, floodRisks, coolstops, osrm.duration, osrm.distance);
      return { ...osrm, ...result, index };
    });

    const byDuration = [...scoredRoutes].sort((a, b) => a.duration - b.duration);
    const byScore = [...scoredRoutes].sort((a, b) => b.score - a.score);
    const byEfficiency = [...scoredRoutes].sort((a, b) => (b.score / Math.max(b.duration, 1)) - (a.score / Math.max(a.duration, 1)));

    const assigned = new Set<number>();
    const routeConfigs: { idx: number; id: string; name: string; color: string; isRecommended: boolean; status: string; }[] = [];

    const fastest = byDuration[0];
    assigned.add(fastest.index);
    routeConfigs.push({
      idx: fastest.index, id: 'route-fastest', name: 'Tuyến Nhanh Nhất', color: '#ef4444', isRecommended: false,
      status: fastest.heatRisk === 'High' ? `Nhanh nhất nhưng đi qua vùng nắng nóng cực đoan (${Math.round(fastest.heatRatio * 100)}% tuyến). Climate Score: ${fastest.score}/100.` : `Nhanh nhất (${Math.round(fastest.duration)} phút) nhưng ít bóng râm hơn. Climate Score: ${fastest.score}/100.`,
    });

    const balancedEntry = byEfficiency.find(e => !assigned.has(e.index)) ?? byEfficiency[0];
    assigned.add(balancedEntry.index);
    routeConfigs.push({
      idx: balancedEntry.index, id: 'route-balanced', name: 'Tuyến Cân Bằng', color: '#22c55e', isRecommended: true,
      status: `Khuyên dùng! Cân bằng tối ưu giữa thời gian và sức khỏe tài xế. Climate Score: ${balancedEntry.score}/100.`,
    });

    const coolestEntry = byScore.find(e => !assigned.has(e.index)) ?? byScore[0];
    assigned.add(coolestEntry.index);
    const shadePct = Math.round(coolestEntry.shadeRatio * 100);
    routeConfigs.push({
      idx: coolestEntry.index, id: 'route-coolest', name: 'Tuyến Mát Nhất', color: '#3b82f6', isRecommended: false,
      status: shadePct >= 20 ? `Tuyến mát nhất với ${shadePct}% đoạn gần CoolStop. Climate Score: ${coolestEntry.score}/100.` : `Ít tiếp xúc nắng/ngập nhất trong các lựa chọn. Climate Score: ${coolestEntry.score}/100.`,
    });

    const routes: Route[] = routeConfigs.map(config => {
      const scored = scoredRoutes[config.idx];
      return {
        id: config.id, name: config.name, time: Math.round(scored.duration), distance: +scored.distance.toFixed(1),
        heatRisk: scored.heatRisk, floodRisk: scored.floodRisk, trafficCongestion: scored.trafficCongestion,
        climateScore: scored.score, isRecommended: config.isRecommended, recommendationStatus: config.status,
        color: config.color, coordinates: scored.coordinates, estimatedEarning: 25000, fuelCost: Math.round(scored.distance * 2000),
      };
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error('Lỗi nghiêm trọng khi sinh tuyến đường:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('grab_undp');
    await db.collection('routes').insertOne(body);
    const { _id, ...rest } = body;
    return NextResponse.json(rest as Route, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
