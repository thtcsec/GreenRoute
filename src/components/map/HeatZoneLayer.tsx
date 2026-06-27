'use client';

import React, { memo } from 'react';
import { Circle, Popup } from 'react-leaflet';
import { HeatZone } from '@/types';

interface HeatZoneLayerProps {
  heatZones: HeatZone[];
  visible: boolean;
}

/**
 * Tính toán màu sắc gradient theo nhiệt độ heatIndex (°C)
 */
function getHeatColor(heatIndex: number): { stroke: string; fill: string } {
  if (heatIndex >= 41) {
    return { stroke: '#dc2626', fill: '#b91c1c' }; // Red-600 / Red-700
  } else if (heatIndex >= 39) {
    return { stroke: '#f97316', fill: '#ea580c' }; // Orange-500 / Orange-600
  } else {
    return { stroke: '#f59e0b', fill: '#d97706' }; // Amber-500 / Amber-600
  }
}

/**
 * Tính toán opacity tỉ lệ theo mức độ nắng nóng
 */
function getHeatOpacity(heatIndex: number): number {
  const normalized = Math.min(1, Math.max(0.2, (heatIndex - 35) / 10));
  return 0.15 + normalized * 0.25; // từ 0.15 đến 0.40
}

function HeatZoneLayerComponent({ heatZones, visible }: HeatZoneLayerProps) {
  if (!visible) return null;

  return (
    <>
      {(Array.isArray(heatZones) ? heatZones : []).map((zone) => {
        const { stroke, fill } = getHeatColor(zone.heatIndex);
        const fillOpacity = getHeatOpacity(zone.heatIndex);
        const isExtreme = zone.heatIndex >= 41;

        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: stroke,
              fillColor: fill,
              fillOpacity: fillOpacity,
              weight: isExtreme ? 2.5 : 1.5,
              dashArray: isExtreme ? undefined : '5, 5',
              className: isExtreme ? 'animate-pulse' : undefined
            }}
          >
            <Popup>
              <div className="p-1.5 font-sans min-w-[180px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: stroke }} />
                  <p className="font-bold text-gray-900 text-sm">{zone.name}</p>
                </div>
                {zone.address && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 leading-snug">{zone.address}</p>
                )}
                <div className="bg-orange-50 dark:bg-orange-950/40 p-2 rounded-lg border border-orange-200/50 dark:border-orange-800/30 my-1 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">🌡️ Chỉ số nhiệt:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{zone.heatIndex}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">💡 Mức rủi ro:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{zone.riskLevel}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{zone.description}</p>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}

export default memo(HeatZoneLayerComponent);
