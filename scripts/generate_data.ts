import fs from 'fs';
import path from 'path';

// Tọa độ người dùng thực tế đang test (Đại học Kinh tế - Luật / UEL)
const BASE_LAT = 10.8715;
const BASE_LNG = 106.7915;

function randomOffset() {
  // Bán kính khoảng 1km (1 độ lat ~ 111km -> 0.01 độ ~ 1.1km)
  return (Math.random() - 0.5) * 0.012;
}

const coolstops = Array.from({ length: 15 }).map((_, i) => ({
  id: `cs-${i + 1}`,
  name: `Điểm mát (Trạm ${i + 1})`,
  lat: BASE_LAT + randomOffset(),
  lng: BASE_LNG + randomOffset(),
  distance: Math.floor(Math.random() * 800) + 100,
  shadeScore: Math.floor(Math.random() * 4) + 7, // 7-10
  rainCover: true,
  curbSafety: Math.random() > 0.5 ? "High" : "Medium",
  accessibility: "High",
  description: "Trạm nghỉ chân thân thiện, có mái che và bóng râm.",
  amenities: ["Máy lạnh", "Nước uống", "Ghế ngồi", "Wifi"].sort(() => 0.5 - Math.random()).slice(0, 3),
  operatingHours: "06:00-22:00"
}));

const heatZones = Array.from({ length: 8 }).map((_, i) => ({
  id: `hz-${i + 1}`,
  name: `Vùng nóng (Khu ${i + 1})`,
  lat: BASE_LAT + randomOffset(),
  lng: BASE_LNG + randomOffset(),
  radius: Math.floor(Math.random() * 100) + 100, // 100-200m
  riskLevel: ["High", "Medium-High"][Math.floor(Math.random() * 2)],
  heatIndex: Math.floor(Math.random() * 5) + 38, // 38-42
  description: "Đoạn đường bê tông hấp thụ nhiệt mạnh, thiếu bóng cây."
}));

const floodRisks = Array.from({ length: 5 }).map((_, i) => ({
  id: `fr-${i + 1}`,
  name: `Vùng ngập (Ngõ ${i + 1})`,
  lat: BASE_LAT + randomOffset(),
  lng: BASE_LNG + randomOffset(),
  radius: Math.floor(Math.random() * 50) + 80, // 80-130m
  riskLevel: ["High", "Extreme", "Medium"][Math.floor(Math.random() * 3)],
  waterDepth: Math.floor(Math.random() * 30) + 20, // 20-50cm
  description: "Khu vực trũng dễ ngập sâu sau mưa lớn."
}));

const dataDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'coolstops.json'), JSON.stringify(coolstops, null, 2));
fs.writeFileSync(path.join(dataDir, 'heat_zones.json'), JSON.stringify(heatZones, null, 2));
fs.writeFileSync(path.join(dataDir, 'flood_risks.json'), JSON.stringify(floodRisks, null, 2));

console.log(`Successfully generated localized seed data centered at UEL (${BASE_LAT}, ${BASE_LNG})!`);
