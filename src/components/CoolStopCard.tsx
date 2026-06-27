'use client';

import { CoolStop } from '@/types';
import { Compass, ShieldAlert, Sparkles, MapPin, Coffee, Snowflake, Droplets, ShieldCheck, Clock } from 'lucide-react';

interface CoolStopCardProps {
  coolstops: CoolStop[];
  onNavigate: (stop: CoolStop) => void;
  onSelectStop?: (stop: CoolStop) => void;
  activeStop: CoolStop | null;
}

export default function CoolStopCard({ coolstops, onNavigate, onSelectStop, activeStop }: CoolStopCardProps) {
  // Điểm đề xuất chính (mặc định lấy điểm đầu tiên hoặc điểm đang được kích hoạt)
  const recommendedStop = activeStop || coolstops[0];

  if (!recommendedStop) return null;

  return (
    <div className="relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 opacity-70"></div>
      
      {/* Horizontal scrollable list of all CoolStops */}
      {coolstops.length > 1 && (
        <div className="overflow-x-auto flex gap-3 pb-3 mb-4 -mx-1 px-1 custom-scrollbar">
          {coolstops.map((stop) => {
            const isActive = recommendedStop.id === stop.id;
            return (
              <div
                key={stop.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStop?.(stop);
                }}
                className={`min-w-[150px] p-3 rounded-2xl cursor-pointer transition-all duration-300 shrink-0 border ${
                  isActive
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <p className={`text-sm font-extrabold truncate ${isActive ? 'text-emerald-400 drop-shadow-sm' : 'text-white'}`}>
                  {stop.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">{stop.distance}m</p>
                <div className="mt-2 flex items-center">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    stop.shadeScore >= 7
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : stop.shadeScore >= 4
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    <Snowflake className="w-2.5 h-2.5" /> Shade {stop.shadeScore}/10
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 mb-3 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Gợi ý tối ưu
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-snug">{recommendedStop.name}</h3>
            {recommendedStop.operatingHours && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-gray-300 border border-white/5">
                <Clock className="w-3 h-3 text-gray-400" /> {recommendedStop.operatingHours}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1 font-medium bg-emerald-500/10 w-fit px-2 py-0.5 rounded-md">
            <MapPin className="w-3.5 h-3.5" /> Cách bạn {recommendedStop.distance}m
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-300 mb-5 bg-white/5 p-3.5 rounded-xl border border-white/10 leading-relaxed shadow-inner">
        {recommendedStop.description}
      </p>

      {/* Chỉ số chất lượng điểm dừng */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5 hover:bg-black/40 transition-colors">
          <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Bóng râm (Shade)</span>
          <div className="flex items-center gap-1.5">
            <Snowflake className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-black text-white">{recommendedStop.shadeScore}/10</span>
          </div>
        </div>
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5 hover:bg-black/40 transition-colors">
          <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Che mưa (Rain)</span>
          <div className="flex items-center gap-1.5">
            <Droplets className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
            <span className="text-sm font-black text-white">{recommendedStop.rainCover ? 'Có mái che' : 'Lộ thiên'}</span>
          </div>
        </div>
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5 hover:bg-black/40 transition-colors">
          <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-1">An toàn (Safety)</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-black text-white">{recommendedStop.curbSafety === 'High' ? 'Rất an toàn' : 'Tạm ổn'}</span>
          </div>
        </div>
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5 hover:bg-black/40 transition-colors">
          <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Tiện ích (Amenities)</span>
          <div className="flex items-center gap-1.5">
            <Coffee className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
            <span className="text-xs font-bold text-white truncate w-full">
              {recommendedStop.amenities.slice(0, 2).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* So sánh điểm dừng */}
      <div className="border-t border-white/10 pt-5 mb-5 relative">
        <h4 className="text-[10px] font-extrabold text-gray-500 mb-3 uppercase tracking-widest text-center">So sánh khí hậu</h4>
        <div className="space-y-3 relative">
          <div className="absolute top-1/2 left-4 -translate-y-1/2 w-0.5 h-10 bg-gradient-to-b from-red-500/50 to-emerald-500/50 rounded-full z-0"></div>
          
          <div className="flex items-center justify-between text-xs bg-red-950/40 border border-red-500/20 p-3 rounded-xl text-red-200 relative z-10 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
            <span className="font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" /> Vị trí hiện tại</span>
            <span className="font-black text-red-400">Shade: 2/10</span>
          </div>
          <div className="flex items-center justify-between text-xs bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="font-bold flex items-center gap-2"><Snowflake className="w-4 h-4 text-emerald-400" /> Điểm CoolStop</span>
            <span className="font-black text-emerald-400">Shade: {recommendedStop.shadeScore}/10</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate(recommendedStop)}
        className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] transition-all text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer"
      >
        <Compass className="w-5 h-5 drop-shadow-md" /> Dẫn đường đến điểm này
      </button>
    </div>
  );
}
