import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Setup basic env for script if it's run via ts-node outside Next.js
import { config } from 'dotenv';
config({ path: '.env.local' });

if (!process.env.MONGODB_URI) {
  console.error('Error: Please set MONGODB_URI in .env.local');
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected correctly to server');
    
    // Database name should be grab_undp or read from URI
    const db = client.db('grab_undp');
    
    const dataDir = path.join(__dirname, '../src/data');
    
    // Seed CoolStops
    console.log('Seeding coolstops...');
    const coolstopsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'coolstops.json'), 'utf8'));
    const coolstopsCol = db.collection('coolstops');
    await coolstopsCol.deleteMany({});
    if (coolstopsData.length > 0) await coolstopsCol.insertMany(coolstopsData);
    
    // Seed Flood Risks
    console.log('Seeding flood_risks...');
    const floodRisksData = JSON.parse(fs.readFileSync(path.join(dataDir, 'flood_risks.json'), 'utf8'));
    const floodRisksCol = db.collection('flood_risks');
    await floodRisksCol.deleteMany({});
    if (floodRisksData.length > 0) await floodRisksCol.insertMany(floodRisksData);
    
    // Seed Heat Zones
    console.log('Seeding heat_zones...');
    const heatZonesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'heat_zones.json'), 'utf8'));
    const heatZonesCol = db.collection('heat_zones');
    await heatZonesCol.deleteMany({});
    if (heatZonesData.length > 0) await heatZonesCol.insertMany(heatZonesData);
    
    // Seed Pickup Points
    console.log('Seeding pickup_points...');
    const pickupPointsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'pickup_points.json'), 'utf8'));
    const pickupPointsCol = db.collection('pickup_points');
    await pickupPointsCol.deleteMany({});
    if (pickupPointsData.length > 0) await pickupPointsCol.insertMany(pickupPointsData);
    
    // Seed Routes
    console.log('Seeding routes...');
    const routesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'routes.json'), 'utf8'));
    const routesCol = db.collection('routes');
    await routesCol.deleteMany({});
    if (routesData.length > 0) await routesCol.insertMany(routesData);
    
    // Seed Traffic Zones
    console.log('Seeding traffic_zones...');
    const trafficZonesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'traffic_zones.json'), 'utf8'));
    const trafficZonesCol = db.collection('traffic_zones');
    await trafficZonesCol.deleteMany({});
    if (trafficZonesData.length > 0) await trafficZonesCol.insertMany(trafficZonesData);
    
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
