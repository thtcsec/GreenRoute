import { NextResponse, NextRequest } from 'next/server';
import routesData from '@/data/routes.json';
import { Route } from '@/types';

// In-memory store (chỉ dùng cho hackathon/MVP)
let routesList = [...routesData] as Route[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recommendedStr = searchParams.get('recommended');

  let result = [...routesList];

  // Lọc tuyến đường khuyên dùng
  if (recommendedStr === 'true') {
    result = result.filter(route => route.isRecommended === true);
  } else if (recommendedStr === 'false') {
    result = result.filter(route => route.isRecommended === false);
  }

  return NextResponse.json(result);
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
      coordinates: body.coordinates
    };

    routesList.push(newRoute);

    return NextResponse.json(newRoute, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
