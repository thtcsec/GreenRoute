'use client';

import { PickupPoints } from '@/types';
import { ShieldCheck, ShieldAlert, Navigation, ArrowRight } from 'lucide-react';

interface PickupSafetyProps {
  pickupPoints: PickupPoints | null;
  onNavigateToPoint: (lat: number, lng: number, name: string) => void;
}

export default function PickupSafety({ pickupPoints, onNavigateToPoint }: PickupSafetyProps) {
  if (!pickupPoints) return null;

  return (
    <div className="bg-gray-900 border border-cyan-900/40 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-900/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-md font-bold text-white leading-tight">Điểm đón trả khách an toàn</h3>
          <p className="text-[11px] text-gray-500">Tránh phơi nắng và cải thiện độ an toàn khi đỗ</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Điểm đón gốc (Rủi ro) */}
        <div className="bg-gray-950/70 border border-red-950 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5 text-rose-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Điểm mặc định (Rủi ro cao)</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            {pickupPoints.defaultPoint.name}
          </h4>
          <p className="text-xs text-red-300/80 bg-red-950/20 p-2 rounded border border-red-950/40">
            Lý do: {pickupPoints.defaultPoint.reason}
          </p>
        </div>

        {/* Mũi tên chuyển dịch */}
        <div className="flex justify-center text-cyan-500 animate-bounce">
          <ArrowRight className="w-5 h-5 rotate-90" />
        </div>

        {/* Gợi ý điểm đón an toàn */}
        <div className="bg-gray-950/70 border border-emerald-950 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Đề xuất thay thế (An toàn)</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            {pickupPoints.suggestedPoint.name}
          </h4>
          <p className="text-xs text-emerald-300/80 bg-emerald-950/20 p-2 rounded border border-emerald-950/40 mb-3">
            Lý do: {pickupPoints.suggestedPoint.reason}
          </p>

          <button
            onClick={() => onNavigateToPoint(
              pickupPoints.suggestedPoint.lat,
              pickupPoints.suggestedPoint.lng,
              pickupPoints.suggestedPoint.name
            )}
            className="w-full py-2.5 px-3 rounded-lg font-bold text-xs bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-cyan-950/50"
          >
            <Navigation className="w-3.5 h-3.5" /> Chỉ đường đến điểm đón thay thế
          </button>
        </div>
      </div>
    </div>
  );
}
