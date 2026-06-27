import { NextResponse, NextRequest } from 'next/server';
import heatZonesData from '@/data/heat_zones.json';
import { HeatZone } from '@/types';

// In-memory store (chỉ dùng cho hackathon/MVP)
let heatZones = [...heatZonesData] as HeatZone[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const riskLevel = searchParams.get('riskLevel');

  let result = [...heatZones];

  // Lọc theo mức độ rủi ro nếu có
  if (riskLevel) {
    result = result.filter(zone => zone.riskLevel === riskLevel);
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation cơ bản
    if (!body.name || !body.lat || !body.lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newZone: HeatZone = {
      id: `hz-${Date.now()}`,
      name: body.name,
      lat: body.lat,
      lng: body.lng,
      radius: body.radius || 100,
      riskLevel: body.riskLevel || 'Medium',
      heatIndex: body.heatIndex || 35,
      description: body.description || ''
    };

    heatZones.push(newZone);

    return NextResponse.json(newZone, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
