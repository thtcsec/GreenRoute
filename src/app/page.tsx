'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints } from '@/types';
import CoolStopCard from '@/components/CoolStopCard';
import RouteCompare from '@/components/RouteCompare';
import PickupSafety from '@/components/PickupSafety';
import ReportForm from '@/components/ReportForm';
import TripInputBar from '@/components/TripInputBar';
import ClimateAlertBanner from '@/components/ClimateAlertBanner';

// Import icons
import { Map, Snowflake, Route as RouteIcon, ShieldCheck, AlertCircle, AlertTriangle, Flame, Compass, Navigation, X } from 'lucide-react';

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

  // Tọa độ người dùng (Mặc định ở KTX Khu A Đại học Quốc gia - điểm xuất phát của các tuyến)
  const [driverLocation] = useState<[number, number]>([10.8720, 106.7920]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('route-balanced');
  const [activeCoolStop, setActiveCoolStop] = useState<CoolStop | null>(null);
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);
  const [focusBounds, setFocusBounds] = useState<[[number, number], [number, number]] | null>(null);

  // --- NEW STATES cho Feature 1, 2, 3 ---
  const [gpsLocation, setGpsLocation] = useState<[number, number] | null>(null);
  const [activeLayer, setActiveLayer] = useState<'heat' | 'flood' | 'all' | 'none'>('all');
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);
  const [osrmInfo, setOsrmInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [osrmError, setOsrmError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tab di động chủ đạo (Đã tối ưu lại còn 3 tabs)
  const [activeTab, setActiveTab] = useState<'map' | 'coolstop' | 'journey'>('map');

  // Modal Báo cáo khẩn cấp
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);

  // Tính toán góc nhìn bản đồ chứa trọn tuyến đường
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

  // --- FETCHING DATA FROM API ---
  useEffect(() => {
    // Feature 1: Real GPS Location
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setGpsLocation(loc);
          setFocusLocation(loc);
        },
        (error) => {
          console.warn("GPS Error:", error.message);
        },
        { timeout: 10000, maximumAge: 30000 }
      );
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [resCoolStops, resHeatZones, resFloodRisks, resRoutes, resPickup] = await Promise.all([
          fetch('/api/coolstops').then(r => r.json()),
          fetch('/api/heat-zones').then(r => r.json()),
          fetch('/api/flood-risks').then(r => r.json()),
          fetch('/api/routes').then(r => r.json()),
          fetch('/api/pickup-points').then(r => r.json())
        ]);

        setCoolstops(resCoolStops);
        setHeatZones(resHeatZones);
        setFloodRisks(resFloodRisks);
        setPickupPoints(resPickup);

        const storedReports = localStorage.getItem('greenroute_reports');
        if (storedReports) {
          setUserReports(JSON.parse(storedReports));
        }

        const dataRoutes = resRoutes;

        // Thay vì dùng đường chim bay giả lập, gọi OSRM để bám sát đường đi thực tế cho các tuyến so sánh
        const currentOrigin = gpsLocation || driverLocation;

        const realRoutes = await Promise.all(dataRoutes.map(async (route: Route) => {
          try {
            // Chỉ lấy điểm hiện tại và điểm CUỐI CÙNG của tuyến đường để vẽ đường đi thực tế
            const destination = route.coordinates[route.coordinates.length - 1];
            const waypointsArr = [currentOrigin, destination]; 
            
            const waypoints = waypointsArr.map(c => `${c[1]},${c[0]}`).join(';');
            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
            const osrmData = await osrmRes.json();
            
            if (osrmData.routes && osrmData.routes.length > 0) {
              const realCoords = osrmData.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
              return { ...route, coordinates: realCoords };
            }
          } catch (err) {
            console.error('Lỗi khi fetch OSRM cho tuyến so sánh:', err);
          }
          return route;
        }));

        setRoutes(realRoutes);

        // Lấy route balanced làm mặc định
        const balancedRoute = realRoutes.find((r: Route) => r.id === 'route-balanced');
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
  }, []);

  // --- ACTIONS ---
  
  // Helper: Haversine distance (meters)
  const haversineDist = (a: [number, number], b: [number, number]) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // Earth radius meters
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  };

  // 1. Khi nhấn dẫn đường tới CoolStop
  const handleNavigateToCoolStop = async (stop: CoolStop) => {
    setActiveCoolStop(stop);
    setActiveTab('map'); // Chuyển về màn hình bản đồ để tài xế quan sát đường đi
    
    // Feature 2: OSRM Routing
    const origin = gpsLocation || driverLocation;
    const dest: [number, number] = [stop.lat, stop.lng];
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      setOsrmError(null);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`,
        { signal: abortControllerRef.current.signal }
      );
      if (!res.ok) throw new Error('OSRM network error');
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
        setOsrmRoute(coords);
        setOsrmInfo({
          distance: +(route.distance / 1000).toFixed(1),
          duration: +(route.duration / 60).toFixed(0)
        });
        updateFocusBounds(coords);

        // Try to match this OSRM polyline to one of the predefined routes so the UI highlights it
        try {
          if (routes && routes.length > 0) {
            const scores = routes.map(r => {
              // for each OSRM point find nearest point in route r
              const dists = coords.map((p: [number, number]) => {
                const nearest = r.coordinates.reduce((min, q) => Math.min(min, haversineDist(p, q)), Infinity);
                return nearest;
              });
              const avg = dists.reduce((s: number, v: number) => s + v, 0) / dists.length;
              return { id: r.id, avg };
            });
            scores.sort((a, b) => a.avg - b.avg);
            const best = scores[0];
            // If average distance < 200m consider it a match
            if (best && best.avg < 200) {
              setSelectedRouteId(best.id);
            }
          }
        } catch (matchErr) {
          console.warn('Error matching OSRM to predefined routes', matchErr);
        }
        
      } else {
        throw new Error('No route found');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setOsrmRoute(null);
        setOsrmInfo(null);
        setOsrmError('Không thể lấy chỉ đường thật, giữ nguyên bản đồ.');
        setFocusLocation(dest);
        setFocusBounds(null);
        setTimeout(() => setOsrmError(null), 3000);
      }
    }
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    // Hủy tuyến OSRM hiện tại để hiện lại các tuyến so sánh
    setOsrmRoute(null);
    setOsrmInfo(null);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const route = routes.find(r => r.id === routeId);
    if (route) {
      updateFocusBounds(route.coordinates);
    }
  };

  // 3. Khi chỉ đường tới điểm đón thay thế
  const handleNavigateToPickup = (lat: number, lng: number, _name: string) => {
    setFocusLocation([lat, lng]);
    setFocusBounds(null);
    setActiveTab('map');
  };

  const handleSubmitReport = (type: ClimateReport['type'], note: string) => {
    // Tài xế báo cáo ngay tại tọa độ xung quanh vị trí của mình (lệch một tí để demo sinh động)
    const baseLoc = gpsLocation || driverLocation;
    const offsetLat = (Math.random() - 0.5) * 0.003;
    const offsetLng = (Math.random() - 0.5) * 0.003;
    
    const newReport: ClimateReport = {
      id: `report-${Date.now()}`,
      type,
      lat: baseLoc[0] + offsetLat,
      lng: baseLoc[1] + offsetLng,
      note,
      timestamp: new Date().toISOString()
    };

    const updated = [newReport, ...userReports];
    setUserReports(updated);
    localStorage.setItem('greenroute_reports', JSON.stringify(updated));

    setFocusLocation([newReport.lat, newReport.lng]);
    setFocusBounds(null);
    setActiveTab('map');
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
            gpsLocation={gpsLocation}
            osrmRoute={osrmRoute}
            activeLayer={activeLayer}
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
          </div>

          {/* Feature 3: Map Layer Toggle UI */}
          <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-gray-950/80 p-1 rounded-xl border border-gray-800 backdrop-blur-sm shadow-lg">
            {(['all', 'heat', 'flood', 'none'] as const).map(mode => (
              <button 
                key={mode} 
                onClick={() => setActiveLayer(mode)} 
                className={`px-2 py-1 text-[10px] rounded-lg font-bold transition-colors cursor-pointer ${
                  activeLayer === mode 
                    ? (mode === 'heat' ? 'bg-orange-600 text-white' : mode === 'flood' ? 'bg-blue-600 text-white' : mode === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-white') 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {mode === 'heat' ? 'Nắng' : mode === 'flood' ? 'Ngập' : mode === 'all' ? 'Tất cả' : 'Ẩn'}
              </button>
            ))}
          </div>

          {/* Feature 2: OSRM Info Overlay & Cancel Button */}
          {osrmInfo && (
            <div className="absolute top-14 left-3 z-[1000] flex items-center gap-3 bg-gray-900/90 border border-emerald-900/50 px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-lg text-xs font-bold text-emerald-400">
              <div>
                <Navigation className="w-3.5 h-3.5 inline mr-1" />
                {osrmInfo.distance} km • {osrmInfo.duration} phút
              </div>
              <div className="w-px h-3 bg-gray-700"></div>
              <button
                onClick={() => {
                  setOsrmRoute(null);
                  setOsrmInfo(null);
                  setFocusLocation(gpsLocation || driverLocation);
                  setFocusBounds(null);
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                }}
                className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
                title="Hủy tuyến đường"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Feature 2: OSRM Error Snackbar */}
          {osrmError && (
            <div className="absolute bottom-16 left-4 right-4 z-[1000] bg-red-950/90 border border-red-900/50 p-2 rounded-xl backdrop-blur-sm text-red-200 text-xs text-center shadow-lg">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              {osrmError}
            </div>
          )}

          {/* Nút reset góc nhìn bản đồ về vị trí tài xế */}
          <button
            onClick={() => {
              setFocusLocation(gpsLocation || driverLocation);
              setFocusBounds(null);
            }}
            className="absolute bottom-4 right-4 z-[1000] p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-emerald-400 shadow-lg active:scale-95 transition-transform cursor-pointer"
            title="Định vị tài xế"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>

        {/* Cảnh báo khí hậu khẩn cấp trên đầu nội dung */}
        <div className="px-4 pt-4 relative z-20">
          <div className="flex items-start gap-3 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Cảnh báo nắng nóng cực đoan (VNU Vùng Cam)</p>
              <p className="text-[11px] text-red-300 mt-0.5">Nhiệt độ cảm nhận thực tế đạt 41°C. Hãy chủ động tránh đỗ tại ngã tư và sử dụng trạm **CoolStop** được đề xuất phía dưới.</p>
            </div>
          </div>
        </div>

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
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" /> Trạng thái hành trình
                    </h3>
                    <ul className="text-xs space-y-2 text-gray-400">
                      <li className="flex justify-between">
                        <span>Vị trí hiện tại:</span>
                        <span className="text-gray-200 font-semibold">Đại học Quốc tế (HCMIU)</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Chỉ số tia cực tím UV:</span>
                        <span className="text-red-400 font-semibold">10 (Rất cao)</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Điểm dừng mát gần nhất:</span>
                        <span className="text-emerald-400 font-semibold">Trạm Nhà Văn Hóa SV</span>
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
