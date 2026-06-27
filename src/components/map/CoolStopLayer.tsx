'use client';

import React, { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CoolStop } from '@/types';

interface CoolStopLayerProps {
  coolstops: CoolStop[];
  onSelectCoolStop: (stop: CoolStop) => void;
}

/**
 * Tạo icon tùy biến memoized cho các loại CoolStop
 */
function createCoolStopIcon(type?: CoolStop['type']) {
  let bgColor = 'bg-emerald-600';
  let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 10H6M12 2a4 4 0 0 1 4 4v4H8V6a4 4 0 0 1 4-4Z"/></svg>`;

  if (type === 'Cooling Station') {
    bgColor = 'bg-cyan-600';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/></svg>`;
  } else if (type === 'Air-conditioned Shelter') {
    bgColor = 'bg-purple-600';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M8 10h.01M8 14h.01M16 10h.01M16 14h.01"/></svg>`;
  }

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full ${bgColor} border-2 border-white text-white shadow-lg transform hover:scale-110 transition-transform duration-200 cursor-pointer">
        ${iconSvg}
      </div>
    `,
    className: 'custom-coolstop-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function CoolStopLayerComponent({ coolstops, onSelectCoolStop }: CoolStopLayerProps) {
  // Memoize Leaflet Icons theo category
  const coolingStationIcon = useMemo(() => createCoolStopIcon('Cooling Station'), []);
  const shadedAreaIcon = useMemo(() => createCoolStopIcon('Shaded Rest Area'), []);
  const shelterIcon = useMemo(() => createCoolStopIcon('Air-conditioned Shelter'), []);

  const getIcon = (type?: CoolStop['type']) => {
    if (type === 'Cooling Station') return coolingStationIcon;
    if (type === 'Air-conditioned Shelter') return shelterIcon;
    return shadedAreaIcon;
  };

  return (
    <>
      {coolstops.map((stop) => {
        const icon = getIcon(stop.type);
        const walkTime = Math.max(1, Math.round(stop.distance / 70)); // Khoảng 70m/phút đi bộ
        const status = stop.status || 'Available';
        const capacity = stop.capacity || 20;

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectCoolStop(stop)
            }}
          >
            <Popup>
              <div className="p-1 font-sans min-w-[200px]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/50">
                    {stop.type || 'Trạm làm mát'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                    status === 'Crowded' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {status === 'Available' ? '🟢 Còn chỗ' : status === 'Crowded' ? '🟡 Đông đúc' : '🔴 Hết chỗ'}
                  </span>
                </div>

                <p className="font-bold text-gray-900 text-sm">{stop.name}</p>
                {stop.address && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{stop.address}</p>
                )}

                <div className="grid grid-cols-2 gap-1.5 my-2 p-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs border border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Khoảng cách</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{stop.distance} m</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Đi bộ ước tính</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">~{walkTime} phút</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Sức chứa</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{capacity} người</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Bóng mát</span>
                    <span className="font-semibold text-emerald-600">{stop.shadeScore}/10</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{stop.description}</p>

                <button
                  onClick={() => onSelectCoolStop(stop)}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  📍 Dẫn đường tới đây
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default memo(CoolStopLayerComponent);
