import { NextResponse, NextRequest } from 'next/server';
import floodRisksData from '@/data/flood_risks.json';
import { FloodRisk } from '@/types';

// In-memory store (chỉ dùng cho hackathon/MVP)
let floodRisks = [...floodRisksData] as FloodRisk[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const riskLevel = searchParams.get('riskLevel');

  let result = [...floodRisks];

  // Lọc theo mức độ rủi ro nếu có
  if (riskLevel) {
    result = result.filter(risk => risk.riskLevel === riskLevel);
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

    const newRisk: FloodRisk = {
      id: `fr-${Date.now()}`,
      name: body.name,
      lat: body.lat,
      lng: body.lng,
      radius: body.radius || 100,
      riskLevel: body.riskLevel || 'Medium',
      waterDepth: body.waterDepth || 10,
      description: body.description || ''
    };

    floodRisks.push(newRisk);

    return NextResponse.json(newRisk, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
