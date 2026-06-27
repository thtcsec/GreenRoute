import { NextResponse } from 'next/server';
import coolstops from '@/data/coolstops.json';

export async function GET() {
  return NextResponse.json(coolstops);
}
