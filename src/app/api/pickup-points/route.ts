import { NextResponse } from 'next/server';
import pickupPoints from '@/data/pickup_points.json';

export async function GET() {
  return NextResponse.json(pickupPoints);
}
