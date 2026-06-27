'use client';

import React, { memo } from 'react';
import { Polyline, LayerGroup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Route } from '@/types';

interface RouteLayerProps {
  routes: Route[];
  selectedRouteId: string | null;
  osrmRoute: [number, number][] | null;
  onSelectRoute: (routeId: string) => void;
}

function RouteLayerComponent({ routes, selectedRouteId, osrmRoute, onSelectRoute }: RouteLayerProps) {
  const isValidPolyline = (coords: [number, number][]) => coords.length >= 8;

  const destIcon = L.divIcon({
    html: `
      <div class="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-md">
        <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    `,
    className: 'custom-dest-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  // Nếu đang có tuyến đường OSRM thực tế, chỉ hiển thị tuyến OSRM
  if (osrmRoute && isValidPolyline(osrmRoute)) {
    return (
      <LayerGroup>
        {/* Đường viền (Outline) để nổi bật tuyến đường trên nền bản đồ */}
        <Polyline
          positions={osrmRoute}
          pathOptions={{
            color: '#022c22', // emerald-950
            weight: 8,
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
        {/* Lõi tuyến đường */}
        <Polyline
          positions={osrmRoute}
          pathOptions={{
            color: '#10b981', // emerald-500
            weight: 5,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
        <Marker position={osrmRoute[osrmRoute.length - 1]} icon={destIcon} />
      </LayerGroup>
    );
  }

  const unselectedRoutes = routes.filter((r) => r.id !== selectedRouteId && isValidPolyline(r.coordinates));
  const selectedRoute = routes.find((r) => r.id === selectedRouteId && isValidPolyline(r.coordinates));
  const destCoords = routes.length > 0 && isValidPolyline(routes[0].coordinates) 
    ? routes[0].coordinates[routes[0].coordinates.length - 1] 
    : null;

  return (
    <LayerGroup>
      {/* 1. Render các tuyến không chọn bên dưới */}
      {unselectedRoutes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.coordinates}
          pathOptions={{
            color: '#64748b',
            weight: 3.5,
            opacity: 0.45,
            lineCap: 'round',
            lineJoin: 'round'
          }}
          eventHandlers={{ click: () => onSelectRoute(route.id) }}
        />
      ))}

      {/* 2. Render tuyến được chọn nổi bật phía trên */}
      {selectedRoute && (
        <Polyline
          key={selectedRoute.id}
          positions={selectedRoute.coordinates}
          pathOptions={{
            color: selectedRoute.color,
            weight: 6,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }}
          eventHandlers={{ click: () => onSelectRoute(selectedRoute.id) }}
        />
      )}

      {/* 3. Render destination marker */}
      {destCoords && <Marker position={destCoords} icon={destIcon} />}
    </LayerGroup>
  );
}

export default memo(RouteLayerComponent);
