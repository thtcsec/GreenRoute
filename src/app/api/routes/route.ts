import { NextResponse } from 'next/server';
import routes from '@/data/routes.json';

export async function GET() {
  return NextResponse.json(routes);
}
