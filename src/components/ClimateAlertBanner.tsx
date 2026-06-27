'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Thermometer, Droplets, X, AlertTriangle } from 'lucide-react';
import { HeatZone, FloodRisk, WeatherData } from '@/types';

interface ClimateAlertBannerProps {
  driverLocation: [number, number];
  heatZones: HeatZone[];
  floodRisks: FloodRisk[];
  weather: WeatherData | null;
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
  weather,
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
          severityRank: severityRank(zone.riskLevel) - (weather?.climateMode === 'heat' ? 10 : 0),
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
          severityRank: severityRank(zone.riskLevel) - (weather?.climateMode === 'rain' ? 10 : 0),
        });
      }
    }

    // Sort by severity (most severe first)
    alerts.sort((a, b) => a.severityRank - b.severityRank);
    return alerts;
  }, [driverLocation, heatZones, floodRisks, dismissedIds, weather]);

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
          relative overflow-hidden rounded-2xl border p-4
          backdrop-blur-xl transition-all duration-300
          ${
            isHeat
              ? 'bg-red-950/30 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
              : 'bg-blue-950/30 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          }
        `}
      >
        {/* Glowing top bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${isHeat ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500 to-transparent'}`}></div>

        {/* ── Main row ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Icon badge */}
          <div className={`mt-0.5 shrink-0 p-2 rounded-xl ${isHeat ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
            {isHeat ? (
              <Thermometer className="h-5 w-5 text-red-400 animate-pulse" />
            ) : (
              <Droplets className="h-5 w-5 text-blue-400 animate-pulse" />
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isHeat ? 'text-red-400' : 'text-blue-400'}`} />
              <p
                className={`text-xs font-extrabold leading-tight uppercase tracking-wide ${
                  isHeat ? 'text-red-300' : 'text-blue-300'
                }`}
              >
                {alert.riskLevel} Risk · {isHeat ? 'Nhiệt' : 'Ngập'}: {alert.detail}
              </p>
            </div>
            <p
              className={`text-sm font-bold leading-snug ${
                isHeat ? 'text-red-100' : 'text-blue-100'
              }`}
            >
              {alert.name}
            </p>
            {weather?.precipProbability !== undefined && weather.precipProbability > 0 && alert.type === 'flood' && (
              <p className="text-[10px] text-blue-200/80 mt-0.5 italic">
                Xác suất mưa hiện tại: {weather.precipProbability}%
              </p>
            )}

            {/* CTA buttons */}
            <div className="flex gap-2 mt-2.5">
              {isHeat ? (
                <button
                  type="button"
                  onClick={onGoToCoolStop}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-extrabold text-emerald-300 transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
                >
                  ❄️ Xem CoolStop gần nhất
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoToRoutes}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-1.5 text-xs font-extrabold text-cyan-300 transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-95"
                >
                  🛣️ Đổi tuyến tránh ngập
                </button>
              )}
            </div>
          </div>

          {/* Dismiss + counter */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              type="button"
              aria-label="Đóng cảnh báo"
              onClick={() => handleDismiss(alert.id)}
              className={`rounded-xl p-1.5 border transition-all active:scale-90 ${
                isHeat
                  ? 'text-red-400 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40'
                  : 'text-blue-400 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/40'
              }`}
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {total > 1 && (
              <span
                className={`text-[9px] font-extrabold uppercase tracking-wider ${
                  isHeat ? 'text-red-500' : 'text-blue-500'
                }`}
              >
                {currentIndex + 1}/{total}
              </span>
            )}
          </div>
        </div>

        {/* ── Carousel dots ────────────────────────────────────────── */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {activeAlerts.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setCurrentIndex(i)}
                className={`
                  inline-block h-1.5 rounded-full transition-all duration-300
                  ${i === currentIndex ? 'w-6' : 'w-1.5'}
                  ${
                    isHeat
                      ? i === currentIndex
                        ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                        : 'bg-red-800/60'
                      : i === currentIndex
                        ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]'
                        : 'bg-blue-800/60'
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
