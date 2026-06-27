import { NextResponse } from 'next/server';
import heatZones from '@/data/heat_zones.json';

export async function GET() {
  return NextResponse.json(heatZones);
}
