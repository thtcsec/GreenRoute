'use client';

import React, { memo } from 'react';
import { Circle, Popup } from 'react-leaflet';
import { FloodRisk } from '@/types';

interface FloodZoneLayerProps {
  floodRisks: FloodRisk[];
  visible: boolean;
}

/**
 * Lấy kiểu dáng màu sắc theo mức độ nguy hiểm ngập nước
 */
function getFloodStyle(riskLevel: FloodRisk['riskLevel'], waterDepth: number) {
  const depthOpacityBoost = Math.min(0.2, (waterDepth / 100) * 0.2);
  switch (riskLevel) {
    case 'Extreme':
      return { stroke: '#1e3a8a', fill: '#1d4ed8', weight: 2.5, dashArray: undefined, opacity: 0.4 + depthOpacityBoost }; // Blue-900 / Blue-700
    case 'High':
      return { stroke: '#2563eb', fill: '#3b82f6', weight: 2, dashArray: '4, 4', opacity: 0.3 + depthOpacityBoost }; // Blue-600 / Blue-500
    case 'Medium':
      return { stroke: '#0284c7', fill: '#38bdf8', weight: 1.5, dashArray: '3, 3', opacity: 0.25 + depthOpacityBoost }; // Sky-600 / Sky-400
    default:
      return { stroke: '#06b6d4', fill: '#22d3ee', weight: 1, dashArray: '2, 2', opacity: 0.2 };
  }
}

function FloodZoneLayerComponent({ floodRisks, visible }: FloodZoneLayerProps) {
  if (!visible) return null;

  return (
    <>
      {floodRisks.map((zone) => {
        const style = getFloodStyle(zone.riskLevel, zone.waterDepth);

        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: style.stroke,
              fillColor: style.fill,
              fillOpacity: style.opacity,
              weight: style.weight,
              dashArray: style.dashArray,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          >
            <Popup>
              <div className="p-1.5 font-sans min-w-[180px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: style.stroke }} />
                  <p className="font-bold text-gray-900 text-sm">{zone.name}</p>
                </div>
                {zone.address && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 leading-snug">{zone.address}</p>
                )}
                <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200/50 dark:border-blue-800/30 my-1 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">🌊 Cảnh báo ngập:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{zone.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">📏 Độ sâu mực nước:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{zone.waterDepth} cm</span>
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

export default memo(FloodZoneLayerComponent);
