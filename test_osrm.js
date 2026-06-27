const https = require('https');

function fetchOSRM(waypoints) {
  const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=false`;
  console.log('URL:', url);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

async function run() {
  // Try UEL to NVH SV
  const origin = [10.8715, 106.7915];
  const dest = [10.8755, 106.8010];
  const res = await fetchOSRM([origin, dest]);
  if (res.routes && res.routes.length > 0) {
    console.log('Distance (m):', res.routes[0].distance);
    console.log('Duration (s):', res.routes[0].duration);
  } else {
    console.log(res);
  }
}
run();
