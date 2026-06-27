'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CoolStop, HeatZone, FloodRisk, Route, ClimateReport, PickupPoints } from '@/types';
import CoolStopCard from '@/components/CoolStopCard';
import RouteCompare from '@/components/RouteCompare';
import PickupSafety from '@/components/PickupSafety';
import ReportForm from '@/components/ReportForm';

// Import icons
import { Map, Snowflake, Route as RouteIcon, ShieldCheck, AlertCircle, AlertTriangle, User, Flame, Compass } from 'lucide-react';

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

  // Tương tác bản đồ
  const [driverLocation] = useState<[number, number]>([10.8795, 106.8045]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('route-balanced');
  const [activeCoolStop, setActiveCoolStop] = useState<CoolStop | null>(null);
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);
  const [focusBounds, setFocusBounds] = useState<any>(null);

  // Tab di động chủ đạo
  const [activeTab, setActiveTab] = useState<'map' | 'coolstop' | 'route' | 'pickup' | 'report'>('map');

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);

  // --- FETCHING DATA FROM API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song các API Route Handlers
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
        setRoutes(resRoutes);
        setPickupPoints(resPickup);

        // Load reports từ localStorage
        const storedReports = localStorage.getItem('greenroute_reports');
        if (storedReports) {
          setUserReports(JSON.parse(storedReports));
        }

        // Đặt mặc định Focus bounds cho tuyến đường Balanced
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
  }, []);

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

  // --- ACTIONS ---
  
  // 1. Khi nhấn dẫn đường tới CoolStop
  const handleNavigateToCoolStop = (stop: CoolStop) => {
    setActiveCoolStop(stop);
    setFocusLocation([stop.lat, stop.lng]);
    setFocusBounds(null);
    setActiveTab('map'); // Chuyển về màn hình bản đồ để tài xế quan sát đường đi
  };

  // 2. Khi chọn tuyến đường so sánh
  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = routes.find(r => r.id === routeId);
    if (route) {
      updateFocusBounds(route.coordinates);
    }
  };

  // 3. Khi chỉ đường tới điểm đón thay thế
  const handleNavigateToPickup = (lat: number, lng: number, name: string) => {
    setFocusLocation([lat, lng]);
    setFocusBounds(null);
    setActiveTab('map');
  };

  // 4. Khi người dùng báo cáo khí hậu mới
  const handleSubmitReport = (type: ClimateReport['type'], note: string) => {
    // Tài xế báo cáo ngay tại tọa độ xung quanh vị trí của mình (lệch một tí để demo sinh động)
    const offsetLat = (Math.random() - 0.5) * 0.003;
    const offsetLng = (Math.random() - 0.5) * 0.003;
    
    const newReport: ClimateReport = {
      id: `report-${Date.now()}`,
      type,
      lat: driverLocation[0] + offsetLat,
      lng: driverLocation[1] + offsetLng,
      note,
      timestamp: new Date().toISOString()
    };

    const updated = [newReport, ...userReports];
    setUserReports(updated);
    localStorage.setItem('greenroute_reports', JSON.stringify(updated));

    // Tập trung bản đồ vào vị trí báo cáo mới và chuyển về Tab Bản đồ
    setFocusLocation([newReport.lat, newReport.lng]);
    setFocusBounds(null);
    setActiveTab('map');
  };

  // 5. Click marker CoolStop trên bản đồ
  const handleMapSelectCoolStop = (stop: CoolStop) => {
    setActiveCoolStop(stop);
    setActiveTab('coolstop'); // Mở tab CoolStop chi tiết
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-950 font-sans text-gray-200">
      {/* Container giả lập Mobile-first */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-gray-950 border-x border-gray-900 shadow-2xl relative">
        
        {/* Header ứng dụng */}
        <header className="px-4 py-3 bg-gray-950 border-b border-gray-900 flex items-center justify-between sticky top-0 z-40">
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

        {/* 1. Bản đồ ở nửa trên màn hình (luôn xuất hiện để dễ quan sát khi thao tác) */}
        <div className="w-full h-[40vh] relative z-10 border-b border-gray-900 bg-gray-950">
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

          {/* Nút reset góc nhìn bản đồ về vị trí tài xế */}
          <button
            onClick={() => {
              setFocusLocation(driverLocation);
              setFocusBounds(null);
            }}
            className="absolute bottom-4 right-4 z-20 p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-emerald-400 shadow-lg active:scale-95 transition-transform cursor-pointer"
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

        {/* 2. Nội dung các chức năng thay đổi theo Tab */}
        <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto z-20">
          {loading ? (
            <div className="h-full flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
                <span className="text-xs text-gray-500">Đang khởi tạo dịch vụ khí hậu...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'map' && (
                <div className="space-y-4">
                  {/* Bản tóm tắt trạng thái hiện tại trong tab bản đồ */}
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
                        <span className="text-emerald-400 font-semibold">Trạm Nhà Văn Hóa SV (480m)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Hiện nhanh gợi ý điểm dừng chân */}
                  <CoolStopCard
                    coolstops={coolstops}
                    onNavigate={handleNavigateToCoolStop}
                    activeStop={activeCoolStop}
                  />
                </div>
              )}

              {activeTab === 'coolstop' && (
                <CoolStopCard
                  coolstops={coolstops}
                  onNavigate={handleNavigateToCoolStop}
                  activeStop={activeCoolStop}
                />
              )}

              {activeTab === 'route' && (
                <RouteCompare
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={handleSelectRoute}
                />
              )}

              {activeTab === 'pickup' && (
                <PickupSafety
                  pickupPoints={pickupPoints}
                  onNavigateToPoint={handleNavigateToPickup}
                />
              )}

              {activeTab === 'report' && (
                <ReportForm onSubmitReport={handleSubmitReport} />
              )}
            </div>
          )}
        </main>

        {/* Thanh Điều Hướng Dưới Cùng (Mobile Navigation Bar) */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-gray-950/95 backdrop-blur-md border-t border-gray-900 grid grid-cols-5 z-40">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-colors cursor-pointer ${
              activeTab === 'map' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[9px] font-bold">Bản đồ</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('coolstop');
              if (coolstops.length > 0 && !activeCoolStop) {
                setActiveCoolStop(coolstops[0]);
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-colors cursor-pointer ${
              activeTab === 'coolstop' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Snowflake className="w-5 h-5" />
            <span className="text-[9px] font-bold">CoolStop</span>
          </button>

          <button
            onClick={() => setActiveTab('route')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-colors cursor-pointer ${
              activeTab === 'route' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <RouteIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold">Tuyến</span>
          </button>

          <button
            onClick={() => setActiveTab('pickup')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-colors cursor-pointer ${
              activeTab === 'pickup' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] font-bold">Đón/Trả</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-colors cursor-pointer ${
              activeTab === 'report' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-[9px] font-bold">Báo cáo</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
