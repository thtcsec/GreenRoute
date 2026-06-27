import fs from 'fs';
import path from 'path';

const THU_DUC_CENTER = { lat: 10.877, lng: 106.802 };

// Helper to generate random coordinates within a radius (in km)
function getRandomCoord(center: {lat: number, lng: number}, radiusKm: number) {
  const r = radiusKm / 111; // ~111km per degree
  const w = r * Math.sqrt(Math.random());
  const t = 2 * Math.PI * Math.random();
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: center.lat + x,
    lng: center.lng + y
  };
}

// ─── ORIGINAL DATA INCLUDED ───────────────────────────────────────────────

const coolstops = [
  {
    "id": "cs-1",
    "name": "Trạm Dừng Chân Nhà Văn Hóa Sinh Viên",
    "lat": 10.8755,
    "lng": 106.8010,
    "distance": 480,
    "shadeScore": 9,
    "rainCover": true,
    "curbSafety": "High",
    "accessibility": "High",
    "description": "Khu sảnh sinh hoạt mát mẻ có máy lạnh bên trong và trạm chờ xe buýt lớn có mái che rộng bên ngoài.",
    "amenities": ["Máy lọc nước miễn phí", "Wifi miễn phí", "Nhà vệ sinh sạch sẽ", "Chỗ sạc điện thoại"],
    "operatingHours": "06:00-22:00"
  },
  {
    "id": "cs-2",
    "name": "Nhà chờ xe buýt Đại Học Quốc Tế (HCMIU)",
    "lat": 10.8783,
    "lng": 106.8063,
    "distance": 220,
    "shadeScore": 8,
    "rainCover": true,
    "curbSafety": "High",
    "accessibility": "High",
    "description": "Nhà chờ xe buýt hiện đại trước cổng trường HCMIU, bao quanh bởi nhiều cây xanh cổ thụ bóng mát lớn.",
    "amenities": ["Ghế ngồi", "Mái che mưa lớn", "Thùng rác công cộng"],
    "operatingHours": "24/7"
  },
  {
    "id": "cs-3",
    "name": "Cà phê Đối Tác Shipper - Làng Đại Học",
    "lat": 10.8742,
    "lng": 106.8028,
    "distance": 620,
    "shadeScore": 10,
    "rainCover": true,
    "curbSafety": "Medium",
    "accessibility": "Medium",
    "description": "Quán cà phê liên kết với GreenRoute hỗ trợ tài xế nghỉ mát có máy lạnh và giảm giá nước uống.",
    "amenities": ["Điều hòa", "Nước uống miễn phí", "Chỗ đậu xe rộng", "Ổ cắm sạc"],
    "operatingHours": "07:00-23:00"
  }
];

const heatZones = [
  {
    "id": "hz-1",
    "name": "Ngã tư Đại học Quốc Gia (VNU Intersection)",
    "lat": 10.8700,
    "lng": 106.8030,
    "radius": 150,
    "riskLevel": "High",
    "heatIndex": 42,
    "description": "Ngã tư bê tông hóa diện tích rộng, hoàn toàn không có bóng râm cây xanh. Hấp nhiệt cực mạnh vào buổi trưa."
  },
  {
    "id": "hz-2",
    "name": "Bãi đỗ xe lộ thiên - Trung tâm Thể thao VNU",
    "lat": 10.8740,
    "lng": 106.7975,
    "radius": 100,
    "riskLevel": "Medium-High",
    "heatIndex": 39,
    "description": "Bề mặt bê tông hấp thụ nhiệt cao, thích hợp đỗ xe có mái che thay vì đỗ trực tiếp dưới nắng."
  },
  {
    "id": "hz-3",
    "name": "Đoạn đường nhựa song hành Xa Lộ Hà Nội",
    "lat": 10.8660,
    "lng": 106.7990,
    "radius": 200,
    "riskLevel": "High",
    "heatIndex": 41,
    "description": "Mặt nhựa hấp nhiệt cao kết hợp khí thải phương tiện giao thông lớn, nhiệt độ cảm nhận rất oi bức."
  }
];

const floodRisks = [
  {
    "id": "fr-1",
    "name": "Đường song hành ngập sâu (gần Đại học TDTT)",
    "lat": 10.8720,
    "lng": 106.7960,
    "radius": 120,
    "riskLevel": "Extreme",
    "waterDepth": 40,
    "description": "Vùng trũng thấp thoát nước kém. Khi mưa lớn thường ngập sâu trên 30-40cm, dễ gây hư hỏng động cơ xe máy."
  },
  {
    "id": "fr-2",
    "name": "Đoạn dốc thoát nước chậm - KTX Khu B (Cổng sau)",
    "lat": 10.8820,
    "lng": 106.8090,
    "radius": 90,
    "riskLevel": "High",
    "waterDepth": 25,
    "description": "Khu vực giao lộ ngập nước cục bộ tạm thời khi mưa lớn dồn dập, đường trơn trượt nguy hiểm."
  }
];

// ─── GENERATE MORE MOCK DATA ──────────────────────────────────────────────

for (let i = 1; i <= 30; i++) {
  const coord = getRandomCoord(THU_DUC_CENTER, 3); // 3km radius
  coolstops.push({
    id: `cs-gen-${i}`,
    name: `Trạm nghỉ mát GreenRoute ${i}`,
    lat: coord.lat,
    lng: coord.lng,
    distance: Math.floor(Math.random() * 2000) + 100,
    shadeScore: Math.floor(Math.random() * 4) + 7, // 7-10
    rainCover: Math.random() > 0.3,
    curbSafety: Math.random() > 0.5 ? 'High' : 'Medium',
    accessibility: 'High',
    description: 'Trạm dừng chân được bố trí bổ sung tại các tuyến đường ít bóng râm, hỗ trợ tài xế công nghệ nghỉ ngơi nhanh.',
    amenities: ['Cây xanh', 'Nước uống', 'Ghế đá', 'Mái che'].slice(0, Math.floor(Math.random() * 4) + 1),
    operatingHours: '06:00-22:00'
  });
}

for (let i = 1; i <= 15; i++) {
  const coord = getRandomCoord(THU_DUC_CENTER, 4);
  heatZones.push({
    id: `hz-gen-${i}`,
    name: `Vùng lõi bê tông ${i}`,
    lat: coord.lat,
    lng: coord.lng,
    radius: Math.floor(Math.random() * 300) + 100, // 100-400m
    riskLevel: Math.random() > 0.6 ? 'High' : 'Medium-High',
    heatIndex: Math.floor(Math.random() * 5) + 38, // 38-42 độ
    description: 'Khu vực mật độ giao thông cao, mặt đường hấp thụ nhiệt mạnh, cảm nhận oi bức.'
  });
}

for (let i = 1; i <= 10; i++) {
  const coord = getRandomCoord(THU_DUC_CENTER, 4);
  floodRisks.push({
    id: `fr-gen-${i}`,
    name: `Điểm ngập tự động ${i}`,
    lat: coord.lat,
    lng: coord.lng,
    radius: Math.floor(Math.random() * 100) + 50,
    riskLevel: Math.random() > 0.5 ? 'Extreme' : 'High',
    waterDepth: Math.floor(Math.random() * 30) + 20, // 20-50cm
    description: 'Điểm trũng tích tụ nước khi mưa trên 30p, nguy cơ chết máy cao.'
  });
}

const dataDir = path.join(__dirname, '../src/data');
fs.writeFileSync(path.join(dataDir, 'coolstops.json'), JSON.stringify(coolstops, null, 2));
fs.writeFileSync(path.join(dataDir, 'heat_zones.json'), JSON.stringify(heatZones, null, 2));
fs.writeFileSync(path.join(dataDir, 'flood_risks.json'), JSON.stringify(floodRisks, null, 2));

console.log('Successfully generated correctly structured mock data!');
