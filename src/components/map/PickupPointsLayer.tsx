'use client';

import React, { memo, useMemo } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { PickupPoints } from '@/types';

interface PickupPointsLayerProps {
  pickupPoints: PickupPoints | null;
}

function createDefaultPickupIcon() {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white text-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
    `,
    className: 'custom-pickup-default-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function createSuggestedPickupIcon() {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600 border-2 border-white text-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
    `,
    className: 'custom-pickup-suggested-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function PickupPointsLayerComponent({ pickupPoints }: PickupPointsLayerProps) {
  const defaultIcon = useMemo(() => createDefaultPickupIcon(), []);
  const suggestedIcon = useMemo(() => createSuggestedPickupIcon(), []);

  if (!pickupPoints) return null;

  return (
    <>
      <Marker position={[pickupPoints.defaultPoint.lat, pickupPoints.defaultPoint.lng]} icon={defaultIcon}>
        <Popup>
          <div className="p-1 font-sans">
            <p className="font-bold text-red-600 text-xs flex items-center gap-1">⚠️ ĐIỂM ĐÓN GỐC (RỦI RO)</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{pickupPoints.defaultPoint.name}</p>
            {pickupPoints.defaultPoint.address && (
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{pickupPoints.defaultPoint.address}</p>
            )}
            <p className="text-xs text-gray-700 mt-1 bg-red-50 p-1.5 rounded border border-red-100">Lý do: {pickupPoints.defaultPoint.reason}</p>
          </div>
        </Popup>
      </Marker>

      <Marker position={[pickupPoints.suggestedPoint.lat, pickupPoints.suggestedPoint.lng]} icon={suggestedIcon}>
        <Popup>
          <div className="p-1 font-sans">
            <p className="font-bold text-emerald-600 text-xs flex items-center gap-1">✅ ĐIỂM ĐÓN KHUYÊN DÙNG</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{pickupPoints.suggestedPoint.name}</p>
            {pickupPoints.suggestedPoint.address && (
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{pickupPoints.suggestedPoint.address}</p>
            )}
            <p className="text-xs text-gray-700 mt-1 bg-emerald-50 p-1.5 rounded border border-emerald-100">Lý do: {pickupPoints.suggestedPoint.reason}</p>
          </div>
        </Popup>
      </Marker>

      <Polyline
        positions={[
          [pickupPoints.defaultPoint.lat, pickupPoints.defaultPoint.lng],
          [pickupPoints.suggestedPoint.lat, pickupPoints.suggestedPoint.lng]
        ]}
        pathOptions={{
          color: '#06b6d4',
          weight: 2.5,
          dashArray: '6, 6',
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />
    </>
  );
}

export default memo(PickupPointsLayerComponent);
