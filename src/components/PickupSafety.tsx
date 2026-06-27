'use client';

import { PickupPoints } from '@/types';
import { ShieldCheck, ShieldAlert, Navigation, ArrowDown } from 'lucide-react';

interface PickupSafetyProps {
  pickupPoints: PickupPoints | null;
  onNavigateToPoint: (lat: number, lng: number, name: string) => void;
}

export default function PickupSafety({ pickupPoints, onNavigateToPoint }: PickupSafetyProps) {
  if (!pickupPoints) return null;

  return (
    <div className="relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent"></div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white leading-tight">Điểm đón trả khách an toàn</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Tránh phơi nắng và cải thiện độ an toàn khi đỗ</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Điểm đón gốc (Rủi ro) */}
        <div className="relative overflow-hidden bg-red-950/20 border border-red-500/20 p-4 rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-400 to-red-700 rounded-l-2xl"></div>
          <div className="pl-2">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">Điểm mặc định — Rủi ro cao</span>
            </div>
            <h4 className="text-sm font-extrabold text-white mb-1">
              {pickupPoints.defaultPoint.name}
            </h4>
            {pickupPoints.defaultPoint.address && (
              <p className="text-[10px] text-gray-500 mb-1.5 leading-relaxed">{pickupPoints.defaultPoint.address}</p>
            )}
            <p className="text-xs text-red-300/80 bg-red-950/30 p-2.5 rounded-xl border border-red-500/15 leading-relaxed">
              {pickupPoints.defaultPoint.reason}
            </p>
          </div>
        </div>

        {/* Arrow connector */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-3 bg-gradient-to-b from-red-500/50 to-emerald-500/50"></div>
            <div className="p-1 rounded-full bg-white/5 border border-white/10">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            </div>
            <div className="w-px h-3 bg-gradient-to-b from-emerald-500/50 to-transparent"></div>
          </div>
        </div>

        {/* Gợi ý điểm đón an toàn */}
        <div className="relative overflow-hidden bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.08)]">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-600 rounded-l-2xl"></div>
          <div className="pl-2">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Đề xuất thay thế — An toàn</span>
            </div>
            <h4 className="text-sm font-extrabold text-white mb-1">
              {pickupPoints.suggestedPoint.name}
            </h4>
            {pickupPoints.suggestedPoint.address && (
              <p className="text-[10px] text-gray-500 mb-1.5 leading-relaxed">{pickupPoints.suggestedPoint.address}</p>
            )}
            <p className="text-xs text-emerald-300/80 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/15 leading-relaxed mb-4">
              {pickupPoints.suggestedPoint.reason}
            </p>

            <button
              onClick={() => onNavigateToPoint(
                pickupPoints.suggestedPoint.lat,
                pickupPoints.suggestedPoint.lng,
                pickupPoints.suggestedPoint.name
              )}
              className="w-full py-3 px-4 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              <Navigation className="w-4 h-4" /> Chỉ đường đến điểm an toàn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
