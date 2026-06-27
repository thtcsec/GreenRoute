'use client';

import dynamic from 'next/dynamic';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints } from '@/types';
import L from 'leaflet';

// Load động component LeafletMap phía client
const DynamicMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 text-emerald-400">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
        <span className="text-sm font-medium text-gray-400">Đang khởi tạo bản đồ vệ tinh...</span>
      </div>
    </div>
  )
});

interface MapContainerProps {
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
  onSelectCoolStop: (stop: CoolStop) => void;
  onSelectRoute: (routeId: string) => void;
}

export default function MapContainer(props: MapContainerProps) {
  return (
    <div className="w-full h-full">
      <DynamicMap {...props} />
    </div>
  );
}
