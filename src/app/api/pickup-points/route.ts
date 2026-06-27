import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { PickupPoints } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    const doc = await db.collection('pickup_points').findOne({});
    if (!doc) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }
    const { _id, ...rest } = doc;

    return NextResponse.json(rest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    await db.collection('pickup_points').insertOne(body);

    const { _id, ...rest } = body;
    return NextResponse.json(rest, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
