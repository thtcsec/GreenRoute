'use client';

import { useState, useEffect } from 'react';
import { Route } from '@/types';
import { Route as RouteIcon, Clock, Milestone, Thermometer, Droplets, ShieldCheck, Car, Navigation, ChevronUp } from 'lucide-react';

interface RouteCompareProps {
  routes: Route[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  onStartRoute?: (routeId: string) => void;
  isTripStarted?: boolean;
}

export default function RouteCompare({ routes, selectedRouteId, onSelectRoute, onStartRoute, isTripStarted }: RouteCompareProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isTripStarted) setIsCollapsed(true);
  }, [isTripStarted]);

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="w-full flex items-center justify-between p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors shadow-lg text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-400">Đang điều hướng</h4>
            <p className="text-[11px] text-gray-400">Nhấn để xem lại các tuyến đường</p>
          </div>
        </div>
        <ChevronUp className="w-5 h-5 text-gray-500" />
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-emerald-400" /> Lựa chọn tuyến đường
        </h3>
        <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase bg-white/5 px-2 py-1 rounded-md">Ấn để chọn</span>
      </div>

      <div className="space-y-4">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          
          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative overflow-hidden p-4 rounded-3xl transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-[1.02]'
                  : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-cyan-500"></div>
              )}
              
              {/* Tiêu đề & Trạng thái khuyến nghị */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className={`text-sm font-extrabold transition-colors ${isSelected ? 'text-emerald-400 drop-shadow-md' : 'text-white'}`}>
                    {route.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium italic">
                    {route.recommendationStatus}
                  </p>
                </div>
                {route.isRecommended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" /> Tối ưu nhất
                  </span>
                )}
                {!route.isRecommended && route.id === 'route-coolest' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] shrink-0">
                    Chậm (+9p)
                  </span>
                )}
              </div>

              {/* Thông số chuyến đi */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Thời gian</span>
                    <span className="font-extrabold text-white">{route.time} phút</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                  <Milestone className="w-4 h-4 text-cyan-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Khoảng cách</span>
                    <span className="font-extrabold text-white">{route.distance} km</span>
                  </div>
                </div>
              </div>

              {/* Thu nhập & Chi phí xăng */}
              {(route.estimatedEarning != null || route.fuelCost != null) && (
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  {route.estimatedEarning != null && (
                    <div className="flex items-center gap-2 text-gray-400 bg-black/20 p-2 rounded-xl border border-white/5">
                      <span className="text-base drop-shadow-md">💰</span>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-gray-500">Dự kiến Thu</span>
                        <span className="font-extrabold text-emerald-400">{route.estimatedEarning.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  )}
                  {route.fuelCost != null && (
                    <div className="flex items-center gap-2 text-gray-400 bg-black/20 p-2 rounded-xl border border-white/5">
                      <span className="text-base drop-shadow-md">⛽</span>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-gray-500">Chi phí xăng</span>
                        <span className="font-extrabold text-amber-400">{route.fuelCost.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chỉ số rủi ro & Điểm khí hậu */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  {/* Heat Risk */}
                  <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                    <Thermometer className={`w-3.5 h-3.5 ${route.heatRisk === 'High' ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
                    <span className="text-[9px] text-gray-400 font-bold uppercase">
                      <b className={`font-extrabold ${route.heatRisk === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{route.heatRisk}</b>
                    </span>
                  </div>
                  {/* Flood Risk */}
                  <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                    <Droplets className={`w-3.5 h-3.5 ${route.floodRisk === 'Medium' ? 'text-blue-500 animate-bounce' : 'text-blue-400'}`} />
                    <span className="text-[9px] text-gray-400 font-bold uppercase">
                      <b className={`font-extrabold ${route.floodRisk !== 'Low' ? 'text-amber-400' : 'text-emerald-400'}`}>{route.floodRisk}</b>
                    </span>
                  </div>
                  {/* Traffic */}
                  <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                    <Car className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase">
                      <b className={`font-extrabold ${route.trafficCongestion === 'Heavy' ? 'text-red-400' : 'text-emerald-400'}`}>{route.trafficCongestion === 'Heavy' ? 'Nặng' : 'Ổn'}</b>
                    </span>
                  </div>
                </div>

                {/* Điểm khí hậu */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Khí hậu</span>
                    <span className={`text-base font-black leading-none drop-shadow-md ${
                        route.climateScore >= 80 ? 'text-emerald-400' : route.climateScore >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {route.climateScore}
                    </span>
                  </div>
                  {/* Visual progress bar for Climate Score */}
                  <div className="w-20 h-1.5 rounded-full bg-black border border-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        route.climateScore >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : route.climateScore >= 60
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-red-500 to-rose-400'
                      }`}
                      style={{ width: `${route.climateScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CTA Button for selected route */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? 'max-h-20 mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(onStartRoute) onStartRoute(route.id);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
                >
                  <Navigation className="w-5 h-5" /> Bắt đầu hành trình
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
