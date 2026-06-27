import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { FloodRisk } from '@/types';
import floodRisksData from '@/data/flood_risks.json';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    const docs = await db.collection('flood_risks').find({}).toArray();
    const result = docs.map(doc => {
      const { _id, ...rest } = doc;
      return rest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("MongoDB flood_risks error, using JSON fallback:", error);
    return NextResponse.json(floodRisksData as FloodRisk[]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    await db.collection('flood_risks').insertOne(body);

    const { _id, ...rest } = body;
    return NextResponse.json(rest, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
