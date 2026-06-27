import { useState, useEffect } from 'react';
import { Route } from '@/types';
import { Route as RouteIcon, Clock, Milestone, Thermometer, Droplets, CheckCircle2, AlertTriangle, ShieldCheck, Car, Navigation, ChevronUp, ChevronDown } from 'lucide-react';

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
    if (isTripStarted) {
      setIsCollapsed(true);
    }
  }, [isTripStarted]);

  if (isCollapsed) {
    return (
      <div 
        onClick={() => setIsCollapsed(false)}
        className="flex items-center justify-between p-4 bg-gray-900/90 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-800/80 transition-colors shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-400">Đang điều hướng</h4>
            <p className="text-[11px] text-gray-400">Nhấn để xem lại các tuyến đường</p>
          </div>
        </div>
        <ChevronUp className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-bold text-white flex items-center gap-1.5">
          <RouteIcon className="w-5 h-5 text-emerald-400" /> So sánh tuyến đường khí hậu
        </h3>
        <span className="text-[10px] text-gray-500 font-medium">Ấn để chọn tuyến</span>
      </div>

      <div className="space-y-3">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          
          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-gray-900 border-emerald-500 shadow-lg shadow-emerald-500/5'
                  : 'bg-gray-950/80 border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Tiêu đề & Trạng thái khuyến nghị */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className={`text-sm font-bold transition-colors ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                    {route.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 italic">
                    {route.recommendationStatus}
                  </p>
                </div>
                {route.isRecommended && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-900/60 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Tối ưu nhất
                  </span>
                )}
                {!route.isRecommended && route.id === 'route-coolest' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-900/60 shrink-0">
                    Chậm (+9p)
                  </span>
                )}
              </div>

              {/* Thông số chuyến đi */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  Thời gian: <span className="font-bold text-white">{route.time} phút</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Milestone className="w-3.5 h-3.5 text-gray-500" />
                  Khoảng cách: <span className="font-bold text-white">{route.distance} km</span>
                </div>
              </div>

              {/* Thu nhập & Chi phí xăng */}
              {(route.estimatedEarning != null || route.fuelCost != null) && (
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {route.estimatedEarning != null && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="text-sm">💰</span>
                      Thu nhập: <span className="font-bold text-emerald-400">{route.estimatedEarning.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {route.fuelCost != null && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="text-sm">⛽</span>
                      Xăng: <span className="font-bold text-amber-400">{route.fuelCost.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>
              )}

              {/* Chỉ số rủi ro & Điểm khí hậu */}
              <div className="flex items-center justify-between border-t border-gray-850 pt-3">
                <div className="flex items-center gap-3">
                  {/* Heat Risk */}
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] text-gray-400">
                      Nắng: <b className={`font-semibold ${route.heatRisk === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{route.heatRisk}</b>
                    </span>
                  </div>
                  {/* Flood Risk */}
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] text-gray-400">
                      Ngập: <b className={`font-semibold ${route.floodRisk === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{route.floodRisk}</b>
                    </span>
                  </div>
                  {/* Traffic Congestion */}
                  <div className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] text-gray-400">
                      Kẹt xe: <b className={`font-semibold ${route.trafficCongestion === 'Heavy' ? 'text-red-400' : route.trafficCongestion === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>{route.trafficCongestion === 'Heavy' ? 'Nặng' : route.trafficCongestion === 'Moderate' ? 'Vừa' : route.trafficCongestion === 'Light' ? 'Nhẹ' : 'Thông thoáng'}</b>
                    </span>
                  </div>
                </div>

                {/* Điểm khí hậu */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">Chỉ số khí hậu:</span>
                    <div className="flex items-center gap-1 bg-gray-950 px-2 py-0.5 rounded-md border border-gray-850">
                      <span className={`text-xs font-bold ${
                        route.climateScore >= 80 ? 'text-emerald-400' : route.climateScore >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {route.climateScore}
                      </span>
                      <span className="text-[9px] text-gray-600">/100</span>
                    </div>
                  </div>
                  {/* Visual progress bar for Climate Score */}
                  <div className="w-24 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        route.climateScore >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : route.climateScore >= 60
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                            : 'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${route.climateScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CTA Button for selected route */}
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRoute?.(route.id);
                  }}
                  className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-gray-950 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Navigation className="w-4 h-4" /> Chọn tuyến này
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
