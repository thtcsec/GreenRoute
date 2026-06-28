import { NextResponse, NextRequest } from 'next/server';
import { Route, HeatZone, FloodRisk, CoolStop, WeatherData, ClimateReport } from '@/types';
import { calculateClimateScore, haversine, shouldRecommendBalanced, TIME_THRESHOLD_MINS } from '@/lib/climate';
import clientPromise from '@/lib/mongodb';
import coolstopsData from '@/data/coolstops.json';
import heatZonesData from '@/data/heat_zones.json';
import floodRisksData from '@/data/flood_risks.json';
import trafficZonesData from '@/data/traffic_zones.json';
import routesData from '@/data/routes.json';

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
  const url = `https://router.project-osrm.org/route/v1/bike/${coordsStr}?overview=full&geometries=geojson&alternatives=${alternatives ? 'true' : 'false'}`;
  
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
    coordinates: r.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]),
    distance: r.distance / 1000, // Convert meters to kilometers
    duration: r.duration / 60, // Convert seconds to minutes
  }));
}

// ─── OSRM Table API & TSP (Path) ────────────────────────────────────────────
async function fetchOSRMTable(waypoints: [number, number][]): Promise<{ durations: number[][], distances: number[][] } | null> {
  const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
  const url = `https://router.project-osrm.org/table/v1/bike/${coordsStr}?annotations=distance,duration`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'GreenRoute/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok') return null;
    return { durations: data.durations, distances: data.distances };
  } catch (e) {
    return null;
  }
}

function pathNearestNeighbor(matrix: number[][], start = 0, end: number): number[] {
  const visited = new Set([start, end]);
  const route = [start];
  let current = start;

  while (visited.size < matrix.length) {
    let nearest = -1;
    let minDist = Infinity;

    for (let i = 0; i < matrix.length; i++) {
      if (!visited.has(i) && matrix[current][i] < minDist) {
        minDist = matrix[current][i];
        nearest = i;
      }
    }
    if (nearest !== -1) {
      visited.add(nearest);
      route.push(nearest);
      current = nearest;
    } else {
      break;
    }
  }
  route.push(end);
  return route;
}

function pathTwoOpt(route: number[], matrix: number[][]): number[] {
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) { 
      for (let j = i + 1; j < route.length - 1; j++) { 
        
        // Tính tổng chi phí ĐOẠN ĐƯỜNG HIỆN TẠI (trước khi swap)
        let before = matrix[route[i-1]][route[i]] + matrix[route[j]][route[j+1]];
        for (let k = i; k < j; k++) {
          before += matrix[route[k]][route[k+1]];
        }
        
        // Tính tổng chi phí ĐOẠN ĐƯỜNG MỚI (sau khi đảo ngược)
        // Lưu ý: với đồ thị có hướng (bất đối xứng), chiều đi sẽ bị đảo ngược!
        let after = matrix[route[i-1]][route[j]] + matrix[route[i]][route[j+1]];
        for (let k = j; k > i; k--) {
          after += matrix[route[k]][route[k-1]];
        }
        
        if (after < before - 1e-10) {
          const subArray = route.slice(i, j + 1).reverse();
          route.splice(i, j - i + 1, ...subArray);
          improved = true;
        }
      }
    }
  }
  return route;
}

function dedupeRoutes(routes: OsrmRoute[]): OsrmRoute[] {
  const unique: OsrmRoute[] = [];
  for (const r of routes) {
    if (!unique.some(u => Math.abs(u.distance - r.distance) < 0.2 && Math.abs(u.duration - r.duration) < 1)) {
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
    return distToLine < 0.01; // ~1.1km corridor width
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
  
  if (corridorStops.length > 0) {
    // Lấy top 4 CoolStops tốt nhất trong hành lang (có thể dùng nhiều hơn nếu muốn)
    const topStops = corridorStops.slice(0, 4);
    const waypoints: [number, number][] = [origin, ...topStops.map(s => [s.lat, s.lng] as [number, number]), destination];
    
    // Gọi Table API để tính ma trận khoảng cách
    const table = await fetchOSRMTable(waypoints);
    if (table) {
      // Tìm thứ tự tối ưu bằng TSP Path
      const initialRoute = pathNearestNeighbor(table.distances, 0, waypoints.length - 1);
      const optimalRouteIdxs = pathTwoOpt(initialRoute, table.distances);
      
      const optimalWaypoints = optimalRouteIdxs.map(idx => waypoints[idx]);
      
      try {
        const viaCool = await fetchOSRM(optimalWaypoints, 0);
        candidates.push(...viaCool);
      } catch {}
    } else {
      // Fallback: nếu Table API lỗi, nối thẳng tất cả theo thứ tự corridor
      try {
        const viaCool = await fetchOSRM(waypoints, 0);
        candidates.push(...viaCool);
      } catch {}
    }
  }

  const avoidPoint = findHeatAvoidanceWaypoint(origin, destination, heatZones);
  if (avoidPoint) {
    try {
      const viaAvoid = await fetchOSRM([origin, avoidPoint, destination], 0);
      candidates.push(...viaAvoid);
    } catch {}
  }

  const unique = dedupeRoutes(candidates);
  if (unique.length === 0) return [];
  const shortest = Math.min(...unique.map(r => r.distance));
  return unique.filter(r => r.distance <= shortest * 1.5);
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

  let dbRoutes: any[] = [];
  let dbHeat: any[] = [];
  let dbFlood: any[] = [];
  let dbCool: any[] = [];
  let dbReports: any[] = [];
  let dbTraffic: any[] = [];

  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    // Fetch data from MongoDB
    [dbRoutes, dbHeat, dbFlood, dbCool, dbReports, dbTraffic] = await Promise.all([
      db.collection('routes').find({}).toArray(),
      db.collection('heat_zones').find({}).toArray(),
      db.collection('flood_risks').find({}).toArray(),
      db.collection('coolstops').find({}).toArray(),
      db.collection('reports').find({}).sort({ timestamp: -1 }).limit(50).toArray(), // Recent reports
      db.collection('traffic_zones').find({}).toArray()
    ]);
  } catch (dbErr) {
    console.warn("MongoDB connection failed in routes API, using local JSON fallbacks:", dbErr);
    dbRoutes = routesData;
    dbHeat = heatZonesData as HeatZone[];
    dbFlood = floodRisksData as FloodRisk[];
    dbCool = coolstopsData as CoolStop[];
    dbReports = [];
    dbTraffic = trafficZonesData;
  }

  try {
    // Fetch Weather Data
    let weatherData: WeatherData | null = null;
    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=10.877&longitude=106.802&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=Asia%2FBangkok`);
      if (weatherRes.ok) {
        const d = await weatherRes.json();
        const current = d.current;
        weatherData = {
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          uvIndex: 8, // estimated
          weatherCondition: 'Trời nắng',
          rainVolume: current.precipitation,
          windSpeed: current.wind_speed_10m,
          icon: 'Sun',
          alertLevel: current.apparent_temperature >= 38 ? 'high' : 'low',
          precipProbability: d.hourly.precipitation_probability[new Date().getHours()] || 0,
          climateMode: current.precipitation > 0 ? 'rain' : (current.apparent_temperature >= 35 ? 'heat' : 'normal')
        };
      }
    } catch (e) {}

    const fallbackRoutes = dbRoutes.map(d => { const { _id, ...rest } = d; return rest as Route; });
    const heatZones = dbHeat.map(d => { const { _id, ...rest } = d; return rest as HeatZone; });
    const floodRisks = dbFlood.map(d => { const { _id, ...rest } = d; return rest as FloodRisk; });
    const coolstops = dbCool.map(d => { const { _id, ...rest } = d; return rest as CoolStop; });
    const reports = dbReports.map(d => { const { _id, ...rest } = d; return rest as ClimateReport; });
    const trafficZones = dbTraffic.map(d => { const { _id, ...rest } = d; return rest as any; });

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
        { coordinates: interpolateRoute([origin, destination]), distance: dist, duration: baseTime },
        { coordinates: interpolateRoute([origin, [midLat + 0.005, midLng], destination]), distance: dist * 1.1, duration: baseTime * 1.1 },
        { coordinates: interpolateRoute([origin, [midLat, midLng - 0.005], destination]), distance: dist * 1.2, duration: baseTime * 1.2 },
      ];
    }

    if (osrmResults.length < 3 && osrmResults.length > 0) {
      const baseRoute = osrmResults[0];
      const len = baseRoute.coordinates.length;
      
      // Alternative 2: Offset north
      const alt2Coords = baseRoute.coordinates.map((c, i) => {
        if (i === 0 || i === len - 1) return c;
        const ratio = Math.sin((i / (len - 1)) * Math.PI);
        return [c[0] + 0.004 * ratio, c[1] + 0.002 * ratio] as [number, number];
      });

      // Alternative 3: Offset south
      const alt3Coords = baseRoute.coordinates.map((c, i) => {
        if (i === 0 || i === len - 1) return c;
        const ratio = Math.sin((i / (len - 1)) * Math.PI);
        return [c[0] - 0.004 * ratio, c[1] - 0.002 * ratio] as [number, number];
      });

      if (osrmResults.length === 1) {
        osrmResults.push(
          { coordinates: alt2Coords, distance: baseRoute.distance * 1.15, duration: baseRoute.duration * 1.15 },
          { coordinates: alt3Coords, distance: baseRoute.distance * 1.3, duration: baseRoute.duration * 1.35 }
        );
      } else if (osrmResults.length === 2) {
        osrmResults.push(
          { coordinates: alt3Coords, distance: baseRoute.distance * 1.25, duration: baseRoute.duration * 1.3 }
        );
      }
    }

    const scoredRoutes: ScoredRoute[] = osrmResults.map((osrm, index) => {
      const result = calculateClimateScore(
        osrm.coordinates, 
        heatZones, 
        floodRisks, 
        coolstops, 
        trafficZones, // Passed traffic zones
        osrm.duration, 
        osrm.distance, 
        weatherData,
        reports
      );
      
      const durationWithTraffic = result.totalDuration;

      return { 
        ...osrm, 
        ...result, 
        index,
        duration: durationWithTraffic 
      };
    });

    const byDuration = [...scoredRoutes].sort((a, b) => a.duration - b.duration);
    const byScore = [...scoredRoutes].sort((a, b) => b.score - a.score);

    const assigned = new Set<number>();
    const routeConfigs: { idx: number; id: string; name: string; color: string; isRecommended: boolean; status: string; }[] = [];

    const fastest = byDuration[0];
    assigned.add(fastest.index);
    
    // Tuyến Cân Bằng: Tìm tuyến có Điểm Khí Hậu TỐT HƠN tuyến nhanh nhất,
    // và thời gian tăng thêm ÍT NHẤT (hoặc nằm trong ngưỡng chấp nhận được).
    const validBalanced = scoredRoutes
      .filter(r => r.index !== fastest.index && r.score > fastest.score && r.duration <= fastest.duration + 5)
      .sort((a, b) => {
        const efficiencyA = (a.score - fastest.score) / Math.max(a.duration - fastest.duration, 0.1);
        const efficiencyB = (b.score - fastest.score) / Math.max(b.duration - fastest.duration, 0.1);
        return efficiencyB - efficiencyA;
      });
      
    // Nếu không có tuyến nào tốt hơn trong giới hạn thời gian, chọn tuyến khác bất kỳ (không phải fastest) để đảm bảo trực quan
    const balancedEntry = validBalanced.length > 0 
      ? validBalanced[0] 
      : (scoredRoutes.find(r => r.index !== fastest.index) ?? fastest);
    assigned.add(balancedEntry.index);
    
    // Tuyến Mát Nhất: Tuyến có điểm khí hậu cao nhất
    // Ưu tiên chọn tuyến chưa được gán cho 2 lựa chọn trên để đa dạng trực quan trên bản đồ
    let coolestEntry = byScore.find(r => !assigned.has(r.index)) ?? byScore[0];

    const recommendBalanced = shouldRecommendBalanced(
      { time: fastest.duration, climateScore: fastest.score }, 
      { time: balancedEntry.duration, climateScore: balancedEntry.score }
    );
    
    routeConfigs.push({
      idx: fastest.index, id: 'route-fastest', name: 'Tuyến Nhanh Nhất', color: '#ef4444', isRecommended: !recommendBalanced,
      status: fastest.heatRisk === 'High' 
        ? `Nhanh nhất nhưng đi qua vùng nắng nóng cực đoan (${Math.round(fastest.heatRatio * 100)}% tuyến). Climate Score: ${fastest.score}/100.` 
        : `Nhanh nhất (${Math.round(fastest.duration)} phút) với Điểm Khí Hậu đạt ${fastest.score}/100.`,
    });

    const deltaTime = Math.round(balancedEntry.duration - fastest.duration);
    
    routeConfigs.push({
      idx: balancedEntry.index, id: 'route-balanced', name: 'Tuyến Cân Bằng', color: '#22c55e', isRecommended: recommendBalanced,
      status: balancedEntry.index === fastest.index 
        ? `Tuyến Nhanh Nhất cũng chính là lựa chọn cân bằng nhất lúc này.` 
        : (recommendBalanced ? `Đổi thêm ${deltaTime} phút để né vùng nguy hiểm, rất đáng! Điểm khí hậu: ${balancedEntry.score}/100.` : `Tuyến này đi lâu hơn (thêm ${deltaTime} phút), không đề xuất.`),
    });

    const shadePct = Math.round(coolestEntry.shadeRatio * 100);
    routeConfigs.push({
      idx: coolestEntry.index, id: 'route-coolest', name: 'Tuyến Mát Nhất', color: '#3b82f6', isRecommended: false,
      status: coolestEntry.index === fastest.index 
        ? `Tuyến này vừa nhanh nhất vừa mát nhất.` 
        : (shadePct >= 20 ? `Tuyến mát nhất với ${shadePct}% đoạn gần CoolStop. Climate Score: ${coolestEntry.score}/100.` : `An toàn nhất nhưng tốn nhiều thời gian. Climate Score: ${coolestEntry.score}/100.`),
    });

    const routes: Route[] = routeConfigs.map(config => {
      const scored = scoredRoutes[config.idx];
      return {
        id: config.id, name: config.name, time: Math.round(scored.duration), distance: +scored.distance.toFixed(1),
        heatRisk: scored.heatRisk, floodRisk: scored.floodRisk, trafficCongestion: scored.trafficCongestion,
        climateScore: scored.score, isRecommended: config.isRecommended, recommendationStatus: config.status,
        color: config.color, coordinates: scored.coordinates, estimatedEarning: Math.round(scored.distance * 12000), fuelCost: Math.round(scored.distance * 2000),
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
