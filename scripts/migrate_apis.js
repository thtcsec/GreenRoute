const fs = require('fs');
const path = require('path');

const collections = ['coolstops', 'flood-risks', 'heat-zones', 'pickup-points'];

for (const col of collections) {
  const camelCase = col.replace(/-([a-z])/g, g => g[1].toUpperCase());
  const typeMap = {
    'coolstops': 'CoolStop',
    'flood-risks': 'FloodRisk',
    'heat-zones': 'HeatZone',
    'pickup-points': 'PickupPoints'
  };
  const type = typeMap[col];
  const dbCol = col.replace('-', '_');

  const content = `import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ${type} } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('grab_undp');
    
    const docs = await db.collection('${dbCol}').find({}).toArray();
    const result = docs.map(doc => {
      const { _id, ...rest } = doc;
      return rest;
    });

    return NextResponse.json(result);
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
    
    await db.collection('${dbCol}').insertOne(body);

    const { _id, ...rest } = body;
    return NextResponse.json(rest, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
`;
  
  const routePath = path.join(__dirname, '../src/app/api', col, 'route.ts');
  if (fs.existsSync(routePath)) {
    // Keep custom logic for coolstops sorting? No, the front end can sort, or we just add it.
    // Wait, let me just add the custom sort for coolstops manually later.
    fs.writeFileSync(routePath, content, 'utf8');
  }
}

console.log('APIs migrated to MongoDB');
