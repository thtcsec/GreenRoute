const http = require('http');
http.get('http://localhost:3000/api/routes?originLat=10.8715&originLng=106.7915&destLat=10.8755&destLng=106.8010', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Number of routes returned:', json.length);
    json.forEach(r => console.log(r.id, r.name));
  });
}).on('error', (err) => console.log('Error:', err.message));
