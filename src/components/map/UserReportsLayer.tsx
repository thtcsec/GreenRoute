'use client';

import React, { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ClimateReport } from '@/types';

interface UserReportsLayerProps {
  userReports: ClimateReport[];
}

function createReportIcon(type: string) {
  let color = 'bg-amber-500';
  if (type === 'Flooded') color = 'bg-blue-500';
  if (type === 'Too hot') color = 'bg-orange-600';
  if (type === 'Traffic jam') color = 'bg-rose-700';
  if (type === 'Wrong location') color = 'bg-purple-600';

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-full ${color} border border-white text-white shadow-md animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    `,
    className: 'custom-report-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function UserReportsLayerComponent({ userReports }: UserReportsLayerProps) {
  const hotIcon = useMemo(() => createReportIcon('Too hot'), []);
  const floodIcon = useMemo(() => createReportIcon('Flooded'), []);
  const jamIcon = useMemo(() => createReportIcon('Traffic jam'), []);
  const defaultIcon = useMemo(() => createReportIcon('Other'), []);

  const getIcon = (type: string) => {
    if (type === 'Too hot' || type === 'No shade') return hotIcon;
    if (type === 'Flooded') return floodIcon;
    if (type === 'Traffic jam') return jamIcon;
    if (type === 'Wrong location') return defaultIcon;
    return defaultIcon;
  };

  return (
    <>
      {userReports.map((report) => (
        <Marker
          key={report.id}
          position={[report.lat, report.lng]}
          icon={getIcon(report.type)}
        >
          <Popup>
            <div className="p-1 font-sans">
              <p className="font-bold text-amber-600 text-xs flex items-center gap-1">⚠️ BÁO CÁO TỪ TÀI XẾ</p>
              <p className="font-semibold text-gray-900 text-sm mt-0.5">
                {report.type === 'Too hot' && '🔥 Trời quá nóng'}
                {report.type === 'No shade' && '☀️ Thiếu bóng mát'}
                {report.type === 'Flooded' && '🌊 Đường bị ngập'}
                {report.type === 'Hard to stop' && '⛔ Khó dừng đỗ'}
                {report.type === 'Unsafe pickup/drop-off' && '❌ Điểm đón không an toàn'}
                {report.type === 'Traffic jam' && '🚗 Kẹt xe / Tắc đường'}
                {report.type === 'Wrong location' && '📍 Địa điểm sai sót'}
              </p>
              {report.note && <p className="text-xs text-gray-700 mt-1 bg-amber-50 p-1.5 rounded border border-amber-100">Ghi chú: {report.note}</p>}
              <p className="text-[10px] text-gray-500 mt-1">Gửi lúc: {new Date(report.timestamp).toLocaleTimeString()}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default memo(UserReportsLayerComponent);
