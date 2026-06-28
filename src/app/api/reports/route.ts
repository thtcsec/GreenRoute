import { NextResponse, NextRequest } from 'next/server';
import { ClimateReport } from '@/types';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    // Fetch reports and sort by timestamp descending
    const docs = await db.collection('reports').find({}).sort({ timestamp: -1 }).toArray();
    const result = docs.map(doc => {
      const { _id, ...rest } = doc;
      return rest as ClimateReport;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("MongoDB reports error, returning empty list fallback:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || body.lat == null || body.lng == null || Number.isNaN(Number(body.lat)) || Number.isNaN(Number(body.lng))) {
      return NextResponse.json({ error: 'Missing required fields: type, lat, lng' }, { status: 400 });
    }

    const newReport: ClimateReport = {
      id: `report-${Date.now()}`,
      type: body.type,
      lat: body.lat,
      lng: body.lng,
      note: body.note || '',
      timestamp: new Date().toISOString()
    };

    const client = await clientPromise;
    const db = client.db('grab_undp');
    await db.collection('reports').insertOne(newReport);

    const { _id, ...rest } = newReport as any;
    return NextResponse.json(rest as ClimateReport, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
