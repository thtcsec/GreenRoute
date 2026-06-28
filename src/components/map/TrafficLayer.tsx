'use client';

import React, { memo } from 'react';
import { Circle, Popup } from 'react-leaflet';
import { TrafficZone } from '@/types';

interface TrafficLayerProps {
  trafficZones: TrafficZone[];
  active: boolean;
}

function TrafficLayerComponent({ trafficZones, active }: TrafficLayerProps) {
  if (!active || !Array.isArray(trafficZones) || trafficZones.length === 0) return null;

  return (
    <>
      {trafficZones.map((zone) => {
        const color = zone.severity === 'Heavy' ? '#9333ea' : '#d946ef'; // Purple for traffic
        
        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 2,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="p-1 font-sans">
                <p className="font-bold text-purple-400 text-xs flex items-center gap-1">🚗 ĐIỂM KẸT XE</p>
                <p className="font-semibold text-white text-sm mt-0.5">{zone.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-purple-200 bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30">
                    Trễ: +{zone.delayMin} phút
                  </span>
                  <span className="text-[10px] text-gray-300">
                    Mức độ: {zone.severity === 'Heavy' ? 'Nghiêm trọng' : 'Vừa phải'}
                  </span>
                </div>
                {zone.description && (
                  <p className="text-xs text-gray-400 mt-2">{zone.description}</p>
                )}
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}

export default memo(TrafficLayerComponent);
