'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints, WeatherData } from '@/types';
import CoolStopCard from '@/components/CoolStopCard';
import RouteCompare from '@/components/RouteCompare';
import PickupSafety from '@/components/PickupSafety';
import ReportForm from '@/components/ReportForm';
import TripInputBar from '@/components/TripInputBar';
import ClimateAlertBanner from '@/components/ClimateAlertBanner';

// Import icons
import { Map, Snowflake, Route as RouteIcon, AlertTriangle, Flame, Compass, X } from 'lucide-react';

// Load MapContainer dynamically to prevent SSR issues
const MapContainer = dynamic(() => import('@/components/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 text-emerald-400">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
        <span className="text-sm font-medium text-gray-400">Đang tải bản đồ vệ tinh...</span>
      </div>
    </div>
  )
});

export default function Home() {
  // --- STATES ---
  const [coolstops, setCoolstops] = useState<CoolStop[]>([]);
  const [heatZones, setHeatZones] = useState<HeatZone[]>([]);
  const [floodRisks, setFloodRisks] = useState<FloodRisk[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoints | null>(null);
  const [userReports, setUserReports] = useState<ClimateReport[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Tương tác bản đồ
  const [driverLocation] = useState<[number, number]>([10.8795, 106.8045]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('route-balanced');
  const [activeCoolStop, setActiveCoolStop] = useState<CoolStop | null>(null);
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);
  const [focusBounds, setFocusBounds] = useState<any>(null);

  // Tab di động chủ đạo (Đã tối ưu lại còn 3 tabs)
  const [activeTab, setActiveTab] = useState<'map' | 'coolstop' | 'journey'>('map');

  // Modal Báo cáo khẩn cấp
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);

  // --- FETCHING DATA FROM API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song các API Route Handlers
        const [resCoolStops, resHeatZones, resFloodRisks, resRoutes, resPickup, resWeather, resReports] = await Promise.all([
          fetch('/api/coolstops').then(r => r.json()),
          fetch('/api/heat-zones').then(r => r.json()),
          fetch('/api/flood-risks').then(r => r.json()),
          fetch('/api/routes').then(r => r.json()),
          fetch('/api/pickup-points').then(r => r.json()),
          fetch('/api/weather').then(r => r.json()),
          fetch('/api/reports').then(r => r.json())
        ]);

        setCoolstops(resCoolStops);
        setHeatZones(resHeatZones);
        setFloodRisks(resFloodRisks);
        setRoutes(resRoutes);
        setPickupPoints(resPickup);
        setWeather(resWeather);
        
        // Cập nhật reports từ API kết hợp với localStorage (nếu có offline data)
        const storedReports = localStorage.getItem('greenroute_reports');
        if (storedReports) {
          // Trong thực tế sẽ cần merge, MVP đơn giản ta set từ API trước
          // sau đó gộp thêm từ localStorage
          const localReps = JSON.parse(storedReports);
          const merged = [...resReports];
          // Tránh trùng lặp ID
          localReps.forEach((lr: ClimateReport) => {
            if (!merged.find(mr => mr.id === lr.id)) merged.push(lr);
          });
          setUserReports(merged);
        } else {
          setUserReports(resReports);
        }

        const balancedRoute = resRoutes.find((r: Route) => r.id === 'route-balanced');
        if (balancedRoute) {
          updateFocusBounds(balancedRoute.coordinates);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu từ API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh weather mỗi 5 phút (300000ms)
    const weatherInterval = setInterval(async () => {
      try {
        const resWeather = await fetch('/api/weather').then(r => r.json());
        setWeather(resWeather);
      } catch (e) {
        console.error('Lỗi khi refresh weather:', e);
      }
    }, 300000);

    return () => clearInterval(weatherInterval);
  }, []);

  const updateFocusBounds = (coords: [number, number][]) => {
    if (!coords || coords.length === 0) return;
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);
    setFocusBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ]);
    setFocusLocation(null);
  };
  
  const handleNavigateToCoolStop = (stop: CoolStop) => {
    setActiveCoolStop(stop);
    setFocusLocation([stop.lat, stop.lng]);
    setFocusBounds(null);
    setActiveTab('map');
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = routes.find(r => r.id === routeId);
    if (route) {
      updateFocusBounds(route.coordinates);
    }
  };

  const handleNavigateToPickup = (lat: number, lng: number, name: string) => {
    setFocusLocation([lat, lng]);
    setFocusBounds(null);
    setActiveTab('map');
  };

  // 4. Khi người dùng báo cáo khí hậu mới
  const handleSubmitReport = async (type: ClimateReport['type'], note: string) => {
    // Tài xế báo cáo ngay tại tọa độ xung quanh vị trí của mình (lệch một tí để demo sinh động)
    const offsetLat = (Math.random() - 0.5) * 0.003;
    const offsetLng = (Math.random() - 0.5) * 0.003;
    
    const newReportPayload = {
      type,
      lat: driverLocation[0] + offsetLat,
      lng: driverLocation[1] + offsetLng,
      note
    };

    try {
      // Gọi API để POST dữ liệu
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportPayload)
      });
      
      if (response.ok) {
        const newReport = await response.json();
        const updated = [newReport, ...userReports];
        setUserReports(updated);
        localStorage.setItem('greenroute_reports', JSON.stringify(updated));

        // Tập trung bản đồ vào vị trí báo cáo mới và chuyển về Tab Bản đồ
        setFocusLocation([newReport.lat, newReport.lng]);
        setFocusBounds(null);
        setActiveTab('map');
      }
    } catch (error) {
      console.error('Lỗi khi gửi báo cáo:', error);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    const updated = userReports.filter(r => r.id !== reportId);
    setUserReports(updated);
    localStorage.setItem('greenroute_reports', JSON.stringify(updated));
  };

  const handleMapSelectCoolStop = (stop: CoolStop) => {
    setActiveCoolStop(stop);
    setActiveTab('coolstop');
  };

  // Chỉ giữ 3 tab chính, các nút bấm sẽ to và rõ ràng hơn
  const tabs = [
    { id: 'map', label: 'Bản đồ', icon: Map },
    { id: 'coolstop', label: 'CoolStop', icon: Snowflake },
    { id: 'journey', label: 'Hành trình', icon: RouteIcon },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-black font-sans text-gray-200 sm:py-6 overflow-hidden">
      
      {/* Container Mobile Shape */}
      <div className="w-full max-w-[480px] h-[100dvh] sm:h-[90vh] sm:max-h-[850px] flex flex-col bg-gray-950 sm:border border-gray-800 sm:rounded-[2.5rem] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        {/* Header */}
        <header className="shrink-0 px-4 py-3 bg-gray-950 border-b border-gray-900 flex items-center justify-between z-30">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h1 className="text-md font-extrabold tracking-tight text-white flex items-center gap-1">
                GreenRoute
              </h1>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Team I - iMPACT</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded-md font-bold">
              MVP PROTOTYPE
            </span>
          </div>
        </header>

        {/* Input */}
        <div className="shrink-0 relative z-30 pt-3 px-3 pb-2 bg-gray-950 border-b border-gray-900">
          <TripInputBar 
            driverLocation={driverLocation}
            onSearchRoutes={(origin, dest) => {
              setActiveTab('journey'); // Chuyển thẳng sang tab hành trình
            }}
          />
        </div>

        {/* Bản đồ */}
        <div className="shrink-0 w-full h-[32vh] min-h-[200px] relative z-10 border-b border-gray-900 bg-gray-900">
          <MapContainer
            driverLocation={driverLocation}
            coolstops={coolstops}
            heatZones={heatZones}
            floodRisks={floodRisks}
            routes={routes}
            selectedRouteId={selectedRouteId}
            pickupPoints={pickupPoints}
            userReports={userReports}
            focusLocation={focusLocation}
            focusBounds={focusBounds}
            onSelectCoolStop={handleMapSelectCoolStop}
            onSelectRoute={handleSelectRoute}
          />
          
          {/* Cụm nút công cụ nổi trên bản đồ */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-3 z-20">
            {/* Nút FAB Báo cáo Khẩn cấp */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-3 rounded-full bg-red-600 border border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-bounce hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center relative"
              title="Báo cáo nhanh"
            >
              <AlertTriangle className="w-5 h-5" />
              {/* Chấm đỏ ping thông báo nếu có report chưa xem (ví dụ) */}
              {userReports.length > 0 && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </button>

            {/* Nút định vị */}
            <button
              onClick={() => {
                setFocusLocation(driverLocation);
                setFocusBounds(null);
              }}
              className="p-3 rounded-full bg-gray-900 border border-gray-800 text-emerald-400 shadow-lg active:scale-95 transition-transform cursor-pointer"
              title="Định vị tài xế"
            >
              <Compass className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cảnh báo khí hậu khẩn cấp trên đầu nội dung (Nếu có weather.alertLevel extreme hoặc high) */}
        {weather && (weather.alertLevel === 'extreme' || weather.alertLevel === 'high') && (
          <div className="px-4 pt-4 relative z-20">
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${weather.alertLevel === 'extreme' ? 'bg-red-950/40 border-red-900/50 text-red-200' : 'bg-orange-950/40 border-orange-900/50 text-orange-200'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 animate-pulse ${weather.alertLevel === 'extreme' ? 'text-red-500' : 'text-orange-500'}`} />
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  Cảnh báo thời tiết: {weather.alertLevel === 'extreme' ? 'CỰC ĐOAN' : 'NGUY HIỂM'}
                </p>
                <p className={`text-[11px] mt-0.5 ${weather.alertLevel === 'extreme' ? 'text-red-300' : 'text-orange-300'}`}>
                  Nhiệt độ cảm nhận <b>{weather.feelsLike}°C</b>, UV <b>{weather.uvIndex}</b>. {weather.rainVolume > 0 ? `Lượng mưa: ${weather.rainVolume}mm.` : 'Hãy tránh đỗ tại ngã tư và sử dụng trạm **CoolStop** được đề xuất.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cảnh báo khí hậu */}
        <div className="shrink-0 relative z-20 pt-3 px-3 bg-gray-950">
          <ClimateAlertBanner 
            driverLocation={driverLocation}
            heatZones={heatZones}
            floodRisks={floodRisks}
            onGoToCoolStop={() => setActiveTab('coolstop')}
            onGoToRoutes={() => setActiveTab('journey')}
          />
        </div>

        {/* Nội dung Tab */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 bg-gray-950 z-20 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
                <span className="text-xs text-gray-500">Đang khởi tạo dữ liệu...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="bg-gray-900/60 border border-gray-850 p-4 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      {weather && <img src={weather.icon} alt={weather.weatherCondition} className="w-6 h-6 object-contain drop-shadow" />}
                      Trạng thái hành trình {weather ? `(${weather.temperature}°C)` : ''}
                    </h3>
                    <ul className="text-xs space-y-2 text-gray-400">
                      <li className="flex justify-between">
                        <span>Thời tiết:</span>
                        <span className="text-gray-200 font-semibold">{weather?.weatherCondition || 'Đang tải...'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Chỉ số tia cực tím UV:</span>
                        <span className={`${(weather?.uvIndex ?? 0) >= 8 ? 'text-red-400' : 'text-amber-400'} font-semibold`}>
                          {weather?.uvIndex ?? '--'} {(weather?.uvIndex ?? 0) >= 8 ? '(Rất cao)' : ''}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Điểm dừng mát gần nhất:</span>
                        <span className="text-emerald-400 font-semibold">
                          {coolstops.length > 0 ? `${coolstops[0].name} (${coolstops[0].distance}m)` : 'Đang tải...'}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <CoolStopCard
                    coolstops={coolstops}
                    onNavigate={handleNavigateToCoolStop}
                    onSelectStop={(stop) => setActiveCoolStop(stop)}
                    activeStop={activeCoolStop}
                  />
                </div>
              )}

              {activeTab === 'coolstop' && (
                <CoolStopCard
                  coolstops={coolstops}
                  onNavigate={handleNavigateToCoolStop}
                  onSelectStop={(stop) => setActiveCoolStop(stop)}
                  activeStop={activeCoolStop}
                />
              )}

              {activeTab === 'journey' && (
                <div className="space-y-6">
                  {/* Tuyến đường */}
                  <RouteCompare
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={handleSelectRoute}
                    onStartRoute={(id) => alert('Hành trình bắt đầu! 🚗 Vui lòng đi theo hướng dẫn.')}
                  />
                  
                  <div className="w-full h-px bg-gray-900"></div>
                  
                  {/* Điểm đón trả an toàn */}
                  <div>
                    <h3 className="text-base font-bold text-white mb-3 px-1">Điểm đón an toàn quanh đây</h3>
                    <PickupSafety
                      pickupPoints={pickupPoints}
                      onNavigateToPoint={handleNavigateToPickup}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Thanh Điều Hướng Dưới Cùng (Tối ưu còn 3 tabs) */}
        <nav className="absolute bottom-0 left-0 right-0 h-[68px] bg-gray-950/95 backdrop-blur-md border-t border-gray-900 grid grid-cols-3 z-30">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'coolstop' && coolstops.length > 0 && !activeCoolStop) {
                    setActiveCoolStop(coolstops[0]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center gap-1.5 select-none transition-colors cursor-pointer ${
                  isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {isActive && <span className="absolute top-1 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />}
                <Icon className={`w-6 h-6 mt-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Modal Báo cáo (Hiển thị nổi lấp đầy bên dưới) */}
        {isReportModalOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsReportModalOpen(false)}
            />
            
            <div className="relative bg-gray-950 border-t border-gray-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 custom-scrollbar">
              <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-5"></div>
              
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Báo cáo & Cảnh báo
                </h2>
                <button 
                  onClick={() => setIsReportModalOpen(false)} 
                  className="p-2 bg-gray-900 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <ReportForm 
                onSubmitReport={(type, note) => {
                  handleSubmitReport(type, note);
                  setIsReportModalOpen(false);
                }} 
                reports={userReports}
                onDeleteReport={handleDeleteReport}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
