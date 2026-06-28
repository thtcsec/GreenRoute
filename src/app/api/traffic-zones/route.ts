import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import trafficData from '@/data/traffic_zones.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    const docs = await db.collection('traffic_zones').find({}).toArray();

    if (docs.length === 0) {
      return NextResponse.json(trafficData);
    }

    const trafficZones = docs.map(({ _id, ...rest }) => rest);
    return NextResponse.json(trafficZones);
  } catch (error) {
    console.error('MongoDB traffic_zones error, using JSON fallback:', error);
    return NextResponse.json(trafficData);
  }
}
