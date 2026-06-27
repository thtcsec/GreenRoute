import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
config({ path: '.env.local' });

const client = new MongoClient(process.env.MONGODB_URI!);

async function run() {
  await client.connect();
  const db = client.db('grab_undp');
  
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/pickup_points.json'), 'utf8'));
  const col = db.collection('pickup_points');
  await col.deleteMany({});
  
  // Insert as a single document
  await col.insertOne(data);
  
  console.log('Fixed pickup_points seeding');
  await client.close();
}

run();
