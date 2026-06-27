'use client';

import dynamic from 'next/dynamic';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints } from '@/types';
import L from 'leaflet';

import LeafletMap from './LeafletMap';

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
      <LeafletMap {...props} />
    </div>
  );
}
