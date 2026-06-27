'use client';

import React, { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface UserMarkerLayerProps {
  driverLocation: [number, number];
  gpsLocation: [number, number] | null;
}

function createDriverIcon() {
  return L.divIcon({
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
}

function createGpsIcon() {
  return L.divIcon({
    html: `
      <div class="relative flex h-6 w-6">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-6 w-6 bg-emerald-600 border-2 border-white shadow-md"></span>
      </div>
    `,
    className: 'custom-gps-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

function UserMarkerLayerComponent({ driverLocation, gpsLocation }: UserMarkerLayerProps) {
  const driverIcon = useMemo(() => createDriverIcon(), []);
  const gpsIcon = useMemo(() => createGpsIcon(), []);

  const position = gpsLocation || driverLocation;
  const icon = gpsLocation ? gpsIcon : driverIcon;

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="p-1 font-sans">
          <p className="font-bold text-emerald-700 text-sm">
            {gpsLocation ? '📍 Vị trí GPS thật' : '🚖 Vị trí giả lập'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {gpsLocation ? 'Được cập nhật thực tế từ thiết bị của bạn' : 'Dùng để demo định vị hành trình'}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export default memo(UserMarkerLayerComponent);
