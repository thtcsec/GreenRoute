'use client';

import React, { memo } from 'react';
import { Polyline, LayerGroup } from 'react-leaflet';
import { Route } from '@/types';

interface RouteLayerProps {
  routes: Route[];
  selectedRouteId: string | null;
  osrmRoute: [number, number][] | null;
  onSelectRoute: (routeId: string) => void;
}

function RouteLayerComponent({ routes, selectedRouteId, osrmRoute, onSelectRoute }: RouteLayerProps) {
  // Nếu đang có tuyến đường OSRM thực tế, chỉ hiển thị tuyến OSRM
  if (osrmRoute) {
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
      </LayerGroup>
    );
  }

  const unselectedRoutes = routes.filter((r) => r.id !== selectedRouteId);
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

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
    </LayerGroup>
  );
}

export default memo(RouteLayerComponent);
