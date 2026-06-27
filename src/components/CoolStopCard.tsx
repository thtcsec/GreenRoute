'use client';

import { CoolStop } from '@/types';
import { Compass, ShieldAlert, Sparkles, MapPin, Coffee, Snowflake, Droplets, ShieldCheck } from 'lucide-react';

interface CoolStopCardProps {
  coolstops: CoolStop[];
  onNavigate: (stop: CoolStop) => void;
  activeStop: CoolStop | null;
}

export default function CoolStopCard({ coolstops, onNavigate, activeStop }: CoolStopCardProps) {
  // Điểm đề xuất chính (mặc định lấy điểm đầu tiên hoặc điểm đang được kích hoạt)
  const recommendedStop = activeStop || coolstops[0];

  if (!recommendedStop) return null;

  return (
    <div className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-emerald-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-900/40 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Gợi ý dừng nghỉ tối ưu
          </span>
          <h3 className="text-lg font-bold text-white leading-snug">{recommendedStop.name}</h3>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Cách vị trí hiện tại của bạn khoảng {recommendedStop.distance}m
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4 bg-gray-950/60 p-3 rounded-lg border border-gray-800/40">
        {recommendedStop.description}
      </p>

      {/* Chỉ số chất lượng điểm dừng */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-950/40 p-2.5 rounded-xl border border-gray-800/20">
          <span className="text-[10px] text-gray-500 block uppercase font-medium">Bóng râm (Shade)</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Snowflake className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-white">{recommendedStop.shadeScore}/10</span>
          </div>
        </div>
        <div className="bg-gray-950/40 p-2.5 rounded-xl border border-gray-800/20">
          <span className="text-[10px] text-gray-500 block uppercase font-medium">Mái che mưa (Rain Cover)</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Droplets className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-white">{recommendedStop.rainCover ? 'Có mái che' : 'Lộ thiên'}</span>
          </div>
        </div>
        <div className="bg-gray-950/40 p-2.5 rounded-xl border border-gray-800/20">
          <span className="text-[10px] text-gray-500 block uppercase font-medium">Lề đường (Curb Safety)</span>
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-white">{recommendedStop.curbSafety === 'High' ? 'Rất an toàn' : 'Tạm ổn'}</span>
          </div>
        </div>
        <div className="bg-gray-950/40 p-2.5 rounded-xl border border-gray-800/20">
          <span className="text-[10px] text-gray-500 block uppercase font-medium">Tiện ích (Amenities)</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Coffee className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-white truncate">
              {recommendedStop.amenities.slice(0, 2).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* So sánh điểm dừng */}
      <div className="border-t border-gray-850 pt-4 mb-4">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">So sánh địa điểm</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs bg-red-950/30 border border-red-950 px-3 py-2 rounded-lg text-red-300">
            <span className="font-medium flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Chỗ bạn đang đứng</span>
            <span className="font-bold text-red-400">Nắng gắt, Không bóng mát</span>
          </div>
          <div className="flex items-center justify-between text-xs bg-emerald-950/40 border border-emerald-900/60 px-3 py-2 rounded-lg text-emerald-300">
            <span className="font-medium flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" /> Điểm đề xuất</span>
            <span className="font-bold text-emerald-400">Mát mẻ, Có Wifi & Nước</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate(recommendedStop)}
        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-gray-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
      >
        <Compass className="w-4 h-4" /> Dẫn đường đến CoolStop này
      </button>
    </div>
  );
}
