import { NextResponse, NextRequest } from 'next/server';
import coolstopsData from '@/data/coolstops.json';
import { CoolStop } from '@/types';

// In-memory store (chỉ dùng cho hackathon/MVP)
let coolstops = [...coolstopsData] as CoolStop[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  let result = [...coolstops];

  // Nếu có tọa độ, có thể tính khoảng cách (nếu cần filter)
  if (latStr && lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    // Sort by distance (simplified distance calculation)
    result.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2));
      const distB = Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2));
      return distA - distB;
    });
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

    const newStop: CoolStop = {
      id: `cs-${Date.now()}`,
      name: body.name,
      lat: body.lat,
      lng: body.lng,
      distance: body.distance || 0,
      shadeScore: body.shadeScore || 5,
      rainCover: body.rainCover || false,
      curbSafety: body.curbSafety || 'Medium',
      accessibility: body.accessibility || 'Medium',
      description: body.description || '',
      amenities: body.amenities || []
    };

    coolstops.push(newStop);

    return NextResponse.json(newStop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
