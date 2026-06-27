import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

import trafficData from '@/data/traffic_zones.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined');
    
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('grab_undp');
    const collection = db.collection('traffic_zones');
    
    const data = await collection.find({}).toArray();
    
    if (data.length === 0) {
      return NextResponse.json(trafficData);
    }
    
    // Remove MongoDB _id from response to keep it clean
    const trafficZones = data.map(({ _id, ...rest }) => rest);
    
    return NextResponse.json(trafficZones);
  } catch (error) {
    console.error('API Error, using fallback:', error);
    return NextResponse.json(trafficData);
  } finally {
    if (client) await client.close();
  }
}
