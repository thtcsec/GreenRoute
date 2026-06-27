import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { CoolStop } from '@/types';
import coolstopsData from '@/data/coolstops.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    const docs = await db.collection('coolstops').find({}).toArray();
    let result = docs.map(doc => {
      const { _id, ...rest } = doc;
      return rest as CoolStop;
    });

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      result.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2));
        const distB = Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2));
        return distA - distB;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("MongoDB coolstops error, using JSON fallback:", error);
    return NextResponse.json(coolstopsData as CoolStop[]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    await db.collection('coolstops').insertOne(body);

    const { _id, ...rest } = body;
    return NextResponse.json(rest as CoolStop, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
