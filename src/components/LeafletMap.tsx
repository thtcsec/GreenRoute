'use client';

import React, { useEffect, useState, memo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints } from '@/types';

import HeatZoneLayer from './map/HeatZoneLayer';
import FloodZoneLayer from './map/FloodZoneLayer';
import CoolStopLayer from './map/CoolStopLayer';
import PickupPointsLayer from './map/PickupPointsLayer';
import UserReportsLayer from './map/UserReportsLayer';
import RouteLayer from './map/RouteLayer';
import UserMarkerLayer from './map/UserMarkerLayer';
import MapLegend from './map/MapLegend';

// Sửa lỗi Leaflet icon mặc định trong Next.js/Webpack
const setupDefaultIcon = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

setupDefaultIcon();

// Component phụ để cập nhật góc nhìn bản đồ động mượt mà
function ChangeView({
  center,
  zoom,
  bounds,
  focusKey,
}: {
  center: [number, number];
  zoom: number;
  bounds?: L.LatLngBoundsExpression;
  focusKey: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1 });
      return;
    }
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, bounds, focusKey, map]);
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
  mapFocusKey: number;
  onSelectCoolStop: (stop: CoolStop) => void;
  onSelectRoute: (routeId: string) => void;
  gpsLocation: [number, number] | null;
  osrmRoute: [number, number][] | null;
  activeLayer: 'heat' | 'flood' | 'all' | 'none';
}

function LeafletMapComponent({
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
  mapFocusKey,
  onSelectCoolStop,
  onSelectRoute,
  gpsLocation,
  osrmRoute,
  activeLayer
}: LeafletMapProps) {
  const [mapReady] = useState(true);

  if (!mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950 text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
          <span className="text-sm font-medium text-gray-300">Đang khởi tạo GIS Map Engine...</span>
        </div>
      </div>
    );
  }

  // Map center setup
  const centerLatLong: [number, number] = focusLocation || gpsLocation || driverLocation;

  const showHeat = activeLayer === 'all' || activeLayer === 'heat';
  const showFlood = activeLayer === 'all' || activeLayer === 'flood';

  return (
    <div className="w-full h-full relative overflow-hidden">
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
        <ChangeView
          center={centerLatLong}
          zoom={focusLocation ? 16 : 15}
          bounds={focusBounds || undefined}
          focusKey={mapFocusKey}
        />

        {/* 1. Marker vị trí người dùng */}
        <UserMarkerLayer driverLocation={driverLocation} gpsLocation={gpsLocation} />

        {/* 2. Vẽ các vùng rủi ro nắng nóng (Heat Zones) */}
        <HeatZoneLayer heatZones={heatZones} visible={showHeat} />

        {/* 3. Vẽ các vùng rủi ro ngập lụt (Flood Zones) */}
        <FloodZoneLayer floodRisks={floodRisks} visible={showFlood} />

        {/* 4. Marker các điểm dừng chân mát mẻ (CoolStops) */}
        <CoolStopLayer coolstops={coolstops} onSelectCoolStop={onSelectCoolStop} />

        {/* 5. Marker điểm đón mặc định & gợi ý điểm an toàn */}
        <PickupPointsLayer pickupPoints={pickupPoints} />

        {/* 6. Hiển thị báo cáo thời tiết tức thời của người dùng */}
        <UserReportsLayer userReports={userReports} />

        {/* 7 & 8. Vẽ các tuyến đường so sánh & tuyến OSRM */}
        <RouteLayer
          routes={routes}
          selectedRouteId={selectedRouteId}
          osrmRoute={osrmRoute}
          onSelectRoute={onSelectRoute}
        />
      </MapContainer>

      {/* 9. Hiển thị chú giải bản đồ (Map Legend) */}
      <MapLegend activeLayer={activeLayer} />
    </div>
  );
}

export default memo(LeafletMapComponent);
