'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Thermometer, Droplets, X } from 'lucide-react';
import { HeatZone, FloodRisk } from '@/types';

interface ClimateAlertBannerProps {
  driverLocation: [number, number];
  heatZones: HeatZone[];
  floodRisks: FloodRisk[];
  onGoToCoolStop: () => void;
  onGoToRoutes: () => void;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveAlert {
  id: string;
  type: 'heat' | 'flood';
  name: string;
  riskLevel: string;
  detail: string; // heat index or water depth
  distance: number; // meters from driver
  severityRank: number; // lower = more severe
}

// ---------------------------------------------------------------------------
// Haversine helper – distance in meters between two lat/lng points
// ---------------------------------------------------------------------------

function haversineDistance(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number],
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Severity ranking (lower = more severe)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  High: 1,
  'Medium-High': 2,
  Medium: 3,
  Low: 4,
};

function severityRank(level: string): number {
  return SEVERITY_ORDER[level] ?? 5;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClimateAlertBanner({
  driverLocation,
  heatZones,
  floodRisks,
  onGoToCoolStop,
  onGoToRoutes,
}: ClimateAlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // ── Build active alerts list ──────────────────────────────────────────

  const activeAlerts = useMemo<ActiveAlert[]>(() => {
    const alerts: ActiveAlert[] = [];

    for (const zone of heatZones) {
      const dist = haversineDistance(driverLocation, [zone.lat, zone.lng]);
      if (dist <= zone.radius + 500 && !dismissedIds.has(zone.id)) {
        alerts.push({
          id: zone.id,
          type: 'heat',
          name: zone.name,
          riskLevel: zone.riskLevel,
          detail: `${zone.heatIndex}°C`,
          distance: Math.round(dist),
          severityRank: severityRank(zone.riskLevel),
        });
      }
    }

    for (const zone of floodRisks) {
      const dist = haversineDistance(driverLocation, [zone.lat, zone.lng]);
      if (dist <= zone.radius + 500 && !dismissedIds.has(zone.id)) {
        alerts.push({
          id: zone.id,
          type: 'flood',
          name: zone.name,
          riskLevel: zone.riskLevel,
          detail: `${zone.waterDepth} cm`,
          distance: Math.round(dist),
          severityRank: severityRank(zone.riskLevel),
        });
      }
    }

    // Sort by severity (most severe first)
    alerts.sort((a, b) => a.severityRank - b.severityRank);
    return alerts;
  }, [driverLocation, heatZones, floodRisks, dismissedIds]);

  // ── Auto-cycle through alerts ─────────────────────────────────────────

  useEffect(() => {
    if (activeAlerts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAlerts.length);
    }, 4_000);

    return () => clearInterval(interval);
  }, [activeAlerts.length]);

  // Keep currentIndex in bounds when alerts change
  useEffect(() => {
    if (currentIndex >= activeAlerts.length) {
      setCurrentIndex(0);
    }
  }, [activeAlerts.length, currentIndex]);

  // ── Dismiss handler ───────────────────────────────────────────────────

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set(prev).add(id));
    },
    [],
  );

  // ── Nothing to show ───────────────────────────────────────────────────

  if (activeAlerts.length === 0) return null;

  const alert = activeAlerts[currentIndex] ?? activeAlerts[0];
  if (!alert) return null;

  const isHeat = alert.type === 'heat';
  const total = activeAlerts.length;

  return (
    <div className="px-4 pt-0 animate-in slide-in-from-top duration-300 fill-mode-both">
      <div
        className={`
          relative rounded-xl border p-3
          transition-colors duration-300
          ${
            isHeat
              ? 'bg-red-950/50 border-red-900/50'
              : 'bg-blue-950/50 border-blue-900/50'
          }
        `}
      >
        {/* ── Main row ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5 shrink-0">
            {isHeat ? (
              <Thermometer className="h-5 w-5 text-red-400 animate-pulse" />
            ) : (
              <Droplets className="h-5 w-5 text-blue-400 animate-pulse" />
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-bold leading-tight ${
                isHeat ? 'text-red-200' : 'text-blue-200'
              }`}
            >
              {alert.name}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                isHeat ? 'text-red-300' : 'text-blue-300'
              }`}
            >
              Mức độ: {alert.riskLevel} · {isHeat ? 'Chỉ số nhiệt' : 'Ngập sâu'}:{' '}
              {alert.detail}
            </p>

            {/* CTA buttons */}
            <div className="flex gap-2 mt-2">
              {isHeat ? (
                <button
                  type="button"
                  onClick={onGoToCoolStop}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                >
                  ❄️ Xem CoolStop gần nhất
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoToRoutes}
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                >
                  🛣️ Đổi tuyến tránh ngập
                </button>
              )}
            </div>
          </div>

          {/* Dismiss + counter */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              type="button"
              aria-label="Đóng cảnh báo"
              onClick={() => handleDismiss(alert.id)}
              className={`rounded-md p-0.5 transition-colors ${
                isHeat
                  ? 'text-red-400 hover:bg-red-900/50'
                  : 'text-blue-400 hover:bg-blue-900/50'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            {total > 1 && (
              <span
                className={`text-[10px] font-medium ${
                  isHeat ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                {currentIndex + 1}/{total} cảnh báo
              </span>
            )}
          </div>
        </div>

        {/* ── Carousel dots ────────────────────────────────────────── */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {activeAlerts.map((a, i) => (
              <span
                key={a.id}
                className={`
                  inline-block h-1 rounded-full transition-all duration-300
                  ${i === currentIndex ? 'w-4' : 'w-1'}
                  ${
                    isHeat
                      ? i === currentIndex
                        ? 'bg-red-400'
                        : 'bg-red-700'
                      : i === currentIndex
                        ? 'bg-blue-400'
                        : 'bg-blue-700'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
