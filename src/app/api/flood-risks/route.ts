import { NextResponse } from 'next/server';
import floodRisks from '@/data/flood_risks.json';

export async function GET() {
  return NextResponse.json(floodRisks);
}
