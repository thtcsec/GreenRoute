'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints } from '@/types';

// Sửa lỗi Leaflet icon mặc định trong Next.js/Webpack
const setupDefaultIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

setupDefaultIcon();

// Component phụ để cập nhật góc nhìn bản đồ động
function ChangeView({ center, zoom, bounds }: { center: [number, number]; zoom: number; bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

interface LeafletMapProps {
  driverLocation: [number, number];
  coolstops: CoolStop[];
  heatZones: HeatZone[];
  floodRisks: FloodRisk[];
  routes: Route[];
  selectedRouteId: string | null;
  pickupPoints: PickupPoints | null;
  userReports: ClimateReport[];
  focusLocation: [number, number] | null;
  focusBounds: L.LatLngBoundsExpression | null;
  onSelectCoolStop: (stop: CoolStop) => void;
  onSelectRoute: (routeId: string) => void;
}

export default function LeafletMap({
  driverLocation,
  coolstops,
  heatZones,
  floodRisks,
  routes,
  selectedRouteId,
  pickupPoints,
  userReports,
  focusLocation,
  focusBounds,
  onSelectCoolStop,
  onSelectRoute
}: LeafletMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950 text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
          <span className="text-sm font-medium">Đang tải bản đồ...</span>
        </div>
      </div>
    );
  }

  // --- THIẾT KẾ CÁC ICON TÙY BIẾN ĐẸP MẮT ---
  
  // 1. Icon định vị tài xế (màu xanh dương nhấp nháy)
  const driverIcon = L.divIcon({
    html: `
      <div class="relative flex h-6 w-6">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-6 w-6 bg-blue-600 border-2 border-white shadow-md"></span>
      </div>
    `,
    className: 'custom-driver-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // 2. Icon điểm dừng mát mẻ (Màu xanh lá có biểu tượng lá cây)
  const coolStopIcon = (name: string) => L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 border-2 border-white text-white shadow-lg transform hover:scale-110 transition-transform duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 10H6M12 2a4 4 0 0 1 4 4v4H8V6a4 4 0 0 1 4-4Z"/></svg>
      </div>
    `,
    className: 'custom-coolstop-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // 3. Icon điểm đón mặc định bị nắng nóng/nguy hiểm (Màu đỏ cảnh báo)
  const defaultPickupIcon = L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white text-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
    `,
    className: 'custom-pickup-default-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // 4. Icon điểm đón thay thế an toàn gợi ý (Màu xanh dương nhạt hình dấu check)
  const suggestedPickupIcon = L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600 border-2 border-white text-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
    `,
    className: 'custom-pickup-suggested-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // 5. Icon báo cáo khí hậu của người dùng (Màu vàng cam cảnh báo)
  const reportIcon = (type: string) => {
    let color = 'bg-amber-500';
    if (type === 'Flooded') color = 'bg-blue-500';
    if (type === 'Too hot') color = 'bg-orange-600';
    
    return L.divIcon({
      html: `
        <div class="flex items-center justify-center w-7 h-7 rounded-full ${color} border border-white text-white shadow-md animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
      `,
      className: 'custom-report-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  // Map center setup
  const centerLatLong: [number, number] = focusLocation || driverLocation;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={centerLatLong}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Cập nhật view động */}
        <ChangeView center={centerLatLong} zoom={focusLocation ? 16 : 15} bounds={focusBounds || undefined} />

        {/* 1. Marker vị trí tài xế */}
        <Marker position={driverLocation} icon={driverIcon}>
          <Popup>
            <div className="p-1">
              <p className="font-semibold text-gray-900">Vị trí của bạn</p>
              <p className="text-xs text-gray-600">Đang ở gần Đại học Quốc tế</p>
            </div>
          </Popup>
        </Marker>

        {/* 2. Vẽ các vùng rủi ro nắng nóng (Heat Zones) */}
        {heatZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#f97316',
              fillColor: '#ea580c',
              fillOpacity: 0.25,
              weight: 1.5,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-orange-600">{zone.name}</p>
                <p className="text-xs text-gray-700 mt-1">💡 Rủi ro: <b>{zone.riskLevel}</b></p>
                <p className="text-xs text-gray-700">🌡️ Chỉ số nhiệt: <b>{zone.heatIndex}°C</b></p>
                <p className="text-xs text-gray-600 mt-1">{zone.description}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* 3. Vẽ các vùng rủi ro ngập lụt (Flood Zones) */}
        {floodRisks.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#2563eb',
              fillOpacity: 0.25,
              weight: 1.5,
              dashArray: '3, 3'
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-blue-600">{zone.name}</p>
                <p className="text-xs text-gray-700 mt-1">🌊 Rủi ro ngập: <b>{zone.riskLevel}</b></p>
                <p className="text-xs text-gray-700">📏 Mức nước ngập: <b>{zone.waterDepth} cm</b></p>
                <p className="text-xs text-gray-600 mt-1">{zone.description}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* 4. Marker các điểm dừng chân mát mẻ (CoolStops) */}
        {coolstops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={coolStopIcon(stop.name)}
            eventHandlers={{
              click: () => onSelectCoolStop(stop)
            }}
          >
            <Popup>
              <div className="p-1 font-sans">
                <p className="font-bold text-emerald-700 text-sm">{stop.name}</p>
                <p className="text-xs text-gray-700 mt-1">🌳 Shade Score: <b>{stop.shadeScore}/10</b></p>
                <p className="text-xs text-gray-700">☂️ Mái che mưa: <b>{stop.rainCover ? 'Có' : 'Không'}</b></p>
                <p className="text-xs text-gray-700">🛡️ An toàn lề đường: <b>{stop.curbSafety}</b></p>
                <p className="text-xs text-gray-600 mt-1">{stop.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 5. Marker điểm đón mặc định & gợi ý điểm an toàn */}
        {pickupPoints && (
          <>
            <Marker position={[pickupPoints.defaultPoint.lat, pickupPoints.defaultPoint.lng]} icon={defaultPickupIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-red-600 text-xs">⚠️ ĐIỂM ĐÓN GỐC (RỦI RO)</p>
                  <p className="font-semibold text-gray-900 text-sm">{pickupPoints.defaultPoint.name}</p>
                  <p className="text-xs text-gray-700 mt-1">Lý do: {pickupPoints.defaultPoint.reason}</p>
                </div>
              </Popup>
            </Marker>

            <Marker position={[pickupPoints.suggestedPoint.lat, pickupPoints.suggestedPoint.lng]} icon={suggestedPickupIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-emerald-600 text-xs">✅ ĐIỂM ĐÓN KHUYÊN DÙNG</p>
                  <p className="font-semibold text-gray-900 text-sm">{pickupPoints.suggestedPoint.name}</p>
                  <p className="text-xs text-gray-700 mt-1">Lý do: {pickupPoints.suggestedPoint.reason}</p>
                </div>
              </Popup>
            </Marker>

            {/* Nối 2 điểm đón bằng đường nét đứt để thể hiện sự dịch chuyển an toàn */}
            <Polyline
              positions={[
                [pickupPoints.defaultPoint.lat, pickupPoints.defaultPoint.lng],
                [pickupPoints.suggestedPoint.lat, pickupPoints.suggestedPoint.lng]
              ]}
              pathOptions={{
                color: '#06b6d4',
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          </>
        )}

        {/* 6. Hiển thị báo cáo thời tiết tức thời của người dùng */}
        {userReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={reportIcon(report.type)}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-amber-600 text-xs">⚠️ BÁO CÁO TỪ TÀI XẾ</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {report.type === 'Too hot' && '🔥 Trời quá nóng'}
                  {report.type === 'No shade' && '☀️ Thiếu bóng mát'}
                  {report.type === 'Flooded' && '🌊 Đường bị ngập'}
                  {report.type === 'Hard to stop' && '⛔ Khó dừng đỗ'}
                  {report.type === 'Unsafe pickup/drop-off' && '❌ Điểm đón không an toàn'}
                </p>
                {report.note && <p className="text-xs text-gray-700 mt-1">Ghi chú: {report.note}</p>}
                <p className="text-[10px] text-gray-500 mt-1">Gửi lúc: {new Date(report.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 7. Vẽ các tuyến đường so sánh */}
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          return (
            <Polyline
              key={route.id}
              positions={route.coordinates}
              pathOptions={{
                color: isSelected ? route.color : '#64748b',
                weight: isSelected ? 6 : 3,
                opacity: isSelected ? 0.9 : 0.4
              }}
              eventHandlers={{
                click: () => onSelectRoute(route.id)
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
