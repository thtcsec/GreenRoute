'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { WeatherData, CoolStop, HeatZone, FloodRisk, Route, PickupPoints, ClimateReport, TrafficZone } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';
import CoolStopCard from '@/components/CoolStopCard';
import IncomingRide from '@/components/IncomingRide';
import SafetyPickupModal from '@/components/SafetyPickupModal';
import RouteCompare from '@/components/RouteCompare';
import PickupSafety from '@/components/PickupSafety';
import ReportForm from '@/components/ReportForm';
import TripInputBar from '@/components/TripInputBar';
import ClimateAlertBanner from '@/components/ClimateAlertBanner';

// Import icons
import { Map, Snowflake, Route as RouteIcon, AlertCircle, AlertTriangle, Flame, Compass, Navigation, X, Droplets, ChevronUp, ChevronDown, MapPinOff, Layers } from 'lucide-react';
import { motion, AnimatePresence, tabContentVariants, tabContentTransition } from '@/components/motion';

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
  const [trafficZones, setTrafficZones] = useState<TrafficZone[]>([]);
  
  // UI States cho Demo
  const [showIncomingRide, setShowIncomingRide] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Tọa độ người dùng (Mặc định ở Đại học Quốc tế HCMIU)
  const [driverLocation] = useState<[number, number]>([10.8795, 106.8045]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [activeCoolStop, setActiveCoolStop] = useState<CoolStop | null>(null);
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);
  const [focusBounds, setFocusBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [mapFocusKey, setMapFocusKey] = useState(0);

  // --- NEW STATES cho Feature 1, 2, 3 ---
  const [gpsLocation, setGpsLocation] = useState<[number, number] | null>(null);
  const [isFakeGps, setIsFakeGps] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'heat' | 'flood' | 'all' | 'none'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);
  const [osrmInfo, setOsrmInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [osrmError, setOsrmError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tab di động chủ đạo
  const [activeTab, setActiveTab] = useState<'map' | 'coolstop' | 'journey' | 'report'>('map');

  // Map bottom sheet + trip state (Hoàng An UX)
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPassengerPickedUp, setIsPassengerPickedUp] = useState(false);
  const [actualPickupPoint, setActualPickupPoint] = useState<{name: string, lat: number, lng: number} | null>(null);

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

  const centerMapOnLocation = (loc: [number, number]) => {
    setFocusLocation(loc);
    setFocusBounds(null);
    setMapFocusKey((key) => key + 1);
  };

  const handleLocateMe = () => {
    // Nếu đã có gpsLocation cập nhật từ watchPosition, bay về ngay lập tức không delay
    if (gpsLocation) {
      centerMapOnLocation(gpsLocation);
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isFakeGps) return; // Prevent real GPS from overwriting fake
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setGpsLocation(loc);
          centerMapOnLocation(loc);
        },
        () => centerMapOnLocation(driverLocation),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return;
    }
    centerMapOnLocation(driverLocation);
  };

  // --- REAL-TIME GPS TRACKING ---
  useEffect(() => {
    let watchId: number | undefined;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          // If we are faking GPS for demo, ignore real GPS updates
          if (isFakeGps) return;
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setGpsLocation(loc);
        },
        (error) => {
          console.warn("GPS Tracking Error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    return () => {
      // watchId === 0 là handle hợp lệ, phải so sánh undefined thay vì kiểm tra truthy
      if (watchId !== undefined && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isFakeGps]);

  // --- FETCHING DATA FROM API ---
  useEffect(() => {

    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song các API Route Handlers
        const [resCoolStops, resHeatZones, resFloodRisks, resPickup, resWeather, resReports, resTraffic] = await Promise.all([
          fetch('/api/coolstops').then(r => r.json()),
          fetch('/api/heat-zones').then(r => r.json()),
          fetch('/api/flood-risks').then(r => r.json()),
          fetch('/api/pickup-points').then(r => r.json()),
          fetch('/api/weather').then(r => r.json()),
          fetch('/api/reports').then(r => r.json()),
          fetch('/api/traffic-zones').then(r => r.json())
        ]);

        setCoolstops(resCoolStops);
        setHeatZones(resHeatZones);
        setFloodRisks(resFloodRisks);
        setPickupPoints(resPickup);
        setWeather(resWeather);
        setTrafficZones(resTraffic || []);
        
        // Auto-switch bản đồ dựa vào Climate Mode
        if (resWeather) {
          if (resWeather.climateMode === 'rain') setActiveLayer('flood');
          else if (resWeather.climateMode === 'heat') setActiveLayer('heat');
        }
        
        // Cập nhật reports từ API kết hợp với localStorage (nếu có offline data)
        const apiReports: ClimateReport[] = Array.isArray(resReports) ? resReports : [];
        let merged = apiReports;
        try {
          const storedReports = localStorage.getItem('greenroute_reports');
          if (storedReports) {
            const localReps = JSON.parse(storedReports);
            if (Array.isArray(localReps)) {
              merged = [...apiReports];
              localReps.forEach((lr: ClimateReport) => {
                if (lr && !merged.find(mr => mr.id === lr.id)) merged.push(lr);
              });
            }
          }
        } catch (e) {
          console.warn('Không đọc được báo cáo offline từ localStorage:', e);
        }
        setUserReports(merged);
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
        if (resWeather) {
          if (resWeather.climateMode === 'rain') setActiveLayer('flood');
          else if (resWeather.climateMode === 'heat') setActiveLayer('heat');
        }
      } catch (e) {
        console.error('Lỗi khi refresh weather:', e);
      }
    }, 300000);

    return () => clearInterval(weatherInterval);
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
    setIsPanelOpen(false);
    
    const origin = gpsLocation || driverLocation;
    await handleSearchRoutes(
      { name: 'Vị trí hiện tại', lat: origin[0], lng: origin[1] },
      { name: stop.name, lat: stop.lat, lng: stop.lng }
    );
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
  const handleNavigateToPickup = async (lat: number, lng: number, _name: string) => {
    setIsPanelOpen(false);
    
    const origin = gpsLocation || driverLocation;
    await handleSearchRoutes(
      { name: 'Vị trí hiện tại', lat: origin[0], lng: origin[1] },
      { name: _name || 'Điểm đón an toàn', lat, lng }
    );
  };

  // 4. Khi người dùng báo cáo khí hậu mới
  const handleSubmitReport = async (type: ClimateReport['type'], note: string) => {
    // Tài xế báo cáo ngay tại tọa độ xung quanh vị trí của mình (lệch một tí để demo sinh động)
    const baseLoc = gpsLocation || driverLocation;
    const offsetLat = (Math.random() - 0.5) * 0.0005;
    const offsetLng = (Math.random() - 0.5) * 0.0005;
    
    const newReportPayload = {
      type,
      lat: baseLoc[0] + offsetLat,
      lng: baseLoc[1] + offsetLng,
      note,
      timestamp: new Date().toISOString()
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
        centerMapOnLocation([newReport.lat, newReport.lng]);
        setActiveTab('map');
        setIsPanelOpen(false);
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
    setIsPanelOpen(true);
  };

  // 5. Khi người dùng tìm kiếm tuyến đường (TripInputBar)
  const handleSearchRoutes = async (origin: { name?: string; lat: number; lng: number }, destination: { name?: string; lat: number; lng: number }) => {
    // Huỷ request tuyến đường đang bay (nếu có) để tránh race-condition response cũ ghi đè response mới
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setActiveTab('journey');
    try {
      const res = await fetch(
        `/api/routes?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`,
        { signal: controller.signal }
      );
      const newRoutes = await res.json();
      if (!Array.isArray(newRoutes)) {
        throw new Error('Invalid routes response');
      }
      setRoutes(newRoutes);
      setSelectedRouteId('route-balanced');
      // Fit map to show all routes
      const allCoords = newRoutes.flatMap((r: Route) => r.coordinates);
      if (allCoords.length > 0) {
        updateFocusBounds(allCoords);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return; // bỏ qua khi chủ động huỷ
      console.error('Lỗi khi tìm tuyến đường:', err);
    } finally {
      if (abortControllerRef.current === controller) setLoading(false);
    }
  };

  // Chỉ giữ 3 tab chính, các nút bấm sẽ to và rõ ràng hơn
  const tabs = [
    { id: 'map', label: 'Bản đồ', icon: Map },
    { id: 'coolstop', label: 'CoolStop', icon: Snowflake },
    { id: 'journey', label: 'Hành trình', icon: RouteIcon },
    { id: 'report', label: 'Báo lỗi', icon: MapPinOff },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black font-sans text-gray-200 sm:py-6 overflow-hidden">
      
      {/* Container Mobile Shape */}
      <div className="w-full max-w-[480px] h-full sm:h-[90vh] sm:max-h-[850px] flex flex-col bg-gradient-to-b from-gray-900 to-black sm:border border-white/10 sm:rounded-[2.5rem] sm:shadow-[0_0_80px_rgba(16,185,129,0.15)] relative overflow-hidden">
        
        {/* Header */}
        <header className="shrink-0 px-5 py-3.5 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-30">
          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                GreenRoute
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">Team I - iMPACT</p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <button
                onClick={() => setShowIncomingRide(true)}
                className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full font-bold hover:bg-indigo-500/20 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              >
                GỌI XE (DEMO)
              </button>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                PROTOTYPE
              </span>
            </div>
            {weather?.climateMode === 'rain' && (
              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 animate-pulse">
                <Droplets className="w-3 h-3" /> RAIN MODE
              </span>
            )}
            {weather?.climateMode === 'heat' && (
              <span className="text-[10px] bg-orange-950 text-orange-400 border border-orange-900/50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" /> HEAT MODE
              </span>
            )}
          </div>
        </header>

        {/* Input */}
        <div className="shrink-0 relative z-30 pt-4 px-4 pb-3 bg-black/40 backdrop-blur-xl border-b border-white/5">
          <TripInputBar 
            driverLocation={gpsLocation || driverLocation}
            onSearchRoutes={handleSearchRoutes}
          />
        </div>

        {/* Bản đồ */}
        <div className={`w-full relative z-10 border-b border-white/10 bg-gray-900 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${
          isPanelOpen && activeTab !== 'map'
            ? 'h-[20%]'
            : activeTab === 'map' 
              ? isPanelOpen ? 'h-[50%]' : 'h-[100%]' 
              : 'h-[60%]'
        }`}>
          <ErrorBoundary>
            <MapContainer
              driverLocation={driverLocation}
              coolstops={coolstops}
              heatZones={heatZones}
              floodRisks={floodRisks}
              trafficZones={trafficZones}
              routes={routes}
              selectedRouteId={selectedRouteId}
              pickupPoints={pickupPoints}
              userReports={userReports}
              focusLocation={focusLocation}
              focusBounds={focusBounds}
              mapFocusKey={mapFocusKey}
              onSelectCoolStop={handleMapSelectCoolStop}
              onSelectRoute={handleSelectRoute}
              gpsLocation={gpsLocation}
              osrmRoute={osrmRoute}
              activeLayer={activeLayer}
            />
          </ErrorBoundary>
          
          {/* Cụm nút công cụ nổi trên bản đồ */}
          <div className={`absolute right-4 flex flex-col gap-3.5 z-[1000] transition-all duration-300 ${!isPanelOpen && activeTab === 'map' ? 'bottom-16' : 'bottom-4'}`}>
            {/* Nút reset góc nhìn bản đồ về vị trí tài xế */}
            <motion.button
              type="button"
              onClick={handleLocateMe}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 shadow-xl hover:bg-black/80 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Định vị tài xế"
            >
              <Compass className="w-5 h-5" />
            </motion.button>

            {/* Nút FAB Báo cáo Khẩn cấp */}
            <button
              onClick={() => {
                setActiveTab('report');
                setIsPanelOpen(true);
              }}
              className="p-3.5 rounded-full bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/50 text-white shadow-[0_0_25px_rgba(225,29,72,0.6)] animate-bounce hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center relative"
              title="Báo cáo nhanh"
            >
              <AlertTriangle className="w-5 h-5 drop-shadow-md" />
              {userReports.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-rose-700"></span>
                </span>
              )}
            </button>
          </div>

          {/* Feature 3: Map Layer Toggle UI */}
          <div className="absolute top-4 left-4 z-[1000] flex items-center bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-1.5 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 transition-colors flex-shrink-0"
              title="Bộ lọc bản đồ"
            >
              <Layers className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-1.5 overflow-hidden whitespace-nowrap"
                >
                  <div className="w-px h-6 bg-white/10 mx-1 self-center flex-shrink-0" />
                  {(['all', 'heat', 'flood', 'none'] as const).map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => setActiveLayer(mode)} 
                      className={`px-3 py-1.5 text-[11px] rounded-xl font-bold transition-all duration-300 cursor-pointer flex-shrink-0 ${
                        activeLayer === mode 
                          ? (mode === 'heat' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                            : mode === 'flood' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                            : mode === 'all' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                            : 'bg-white/20 text-white') 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {mode === 'heat' ? 'Nắng' : mode === 'flood' ? 'Ngập' : mode === 'all' ? 'Tất cả' : 'Ẩn'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feature 2: OSRM Info Overlay & Cancel Button */}
          {osrmInfo && (
            <div className="absolute top-16 left-4 z-[1000] flex items-center gap-3 bg-black/70 border border-emerald-500/30 px-4 py-2 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] text-xs font-bold text-emerald-400">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-emerald-500" />
                <span>{osrmInfo.distance} km</span>
                <span className="text-gray-500 mx-1">•</span>
                <span>{osrmInfo.duration} phút</span>
              </div>
              <div className="w-px h-4 bg-white/10"></div>
              <button
                onClick={() => {
                  setOsrmRoute(null);
                  setOsrmInfo(null);
                  centerMapOnLocation(gpsLocation || driverLocation);
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                }}
                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                title="Hủy tuyến đường"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* OSRM Error Snackbar */}
          {osrmError && (
            <div className="absolute bottom-20 left-4 right-4 z-[1000] bg-red-950/90 border border-red-500/30 p-3 rounded-2xl backdrop-blur-md text-red-200 text-xs text-center shadow-lg">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              {osrmError}
            </div>
          )}

          {/* Old locate button removed to group with other map controls */}
        </div>

        {/* Nút vuốt panel */}
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-full h-10 shrink-0 flex items-center justify-center bg-black/60 backdrop-blur-md border-b border-white/10 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer z-40 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          title={isPanelOpen ? 'Thu gọn thông tin' : 'Mở rộng thông tin'}
        >
          {isPanelOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>

        {/* Nội dung Tab */}
        <div className={`w-full overflow-y-auto z-20 custom-scrollbar transition-all duration-300 ease-in-out ${
          activeTab === 'map'
            ? isPanelOpen
              ? 'h-[50%] px-4 py-5 pb-4 opacity-100'
              : 'h-0 p-0 opacity-0'
            : isPanelOpen
              ? 'h-[80%] px-4 py-5 pb-4 opacity-100'
              : 'h-[40%] px-4 py-5 pb-4 opacity-100'
        }`}>
          {loading ? (
            <div className="h-full flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
                <span className="text-sm font-medium text-emerald-500/80 animate-pulse">Đang đồng bộ dữ liệu...</span>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="space-y-5"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabContentTransition}
            >

              {activeTab !== 'report' && weather && weather.alertLevel !== 'low' && (
                <div className="relative z-20">
                  <div className={`relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl ${
                    weather.alertLevel === 'extreme' ? 'bg-red-950/50 border-red-500/30 text-red-200 shadow-[0_0_30px_rgba(220,38,38,0.15)]'
                    : weather.alertLevel === 'high' ? 'bg-orange-950/50 border-orange-500/30 text-orange-200 shadow-[0_0_30px_rgba(249,115,22,0.15)]'
                    : 'bg-yellow-950/50 border-yellow-500/30 text-yellow-200 shadow-[0_0_30px_rgba(234,179,8,0.15)]'
                  }`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50"></div>
                    <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 animate-pulse ${
                      weather.alertLevel === 'extreme' ? 'text-red-500' : weather.alertLevel === 'high' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-extrabold text-white tracking-wide">
                        {weather.weatherCondition} — Cảm nhận <span className="text-[1.1em]">{weather.feelsLike}°C</span>
                      </p>
                      <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
                        weather.alertLevel === 'extreme' ? 'text-red-300' : weather.alertLevel === 'high' ? 'text-orange-300' : 'text-yellow-300'
                      }`}>
                        {weather.rainVolume > 0
                          ? `Lượng mưa ${weather.rainVolume}mm. Cẩn thận ngập sâu, hãy dùng tuyến GreenRoute đề xuất.`
                          : `Tia UV ở mức ${weather.uvIndex}. Hãy tránh đỗ tại ngã tư và dùng CoolStop phía dưới.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'report' && (
              <ClimateAlertBanner
                driverLocation={driverLocation}
                heatZones={heatZones}
                floodRisks={floodRisks}
                weather={weather}
                onGoToCoolStop={() => setActiveTab('coolstop')}
                onGoToRoutes={() => setActiveTab('journey')}
              />
              )}

              {activeTab === 'report' && (
                <div className="space-y-4">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <MapPinOff className="w-5 h-5 text-purple-400" />
                      Báo cáo địa điểm sai sót
                    </h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      Pin CoolStop, vùng nắng/ngập hoặc điểm đón hiển thị sai? Gửi báo cáo để team cập nhật dữ liệu pilot.
                    </p>
                  </div>
                  <ReportForm
                    defaultType="Wrong location"
                    onSubmitReport={(type, note) => {
                      handleSubmitReport(type, note);
                    }}
                    reports={userReports}
                    onDeleteReport={handleDeleteReport}
                  />
                </div>
              )}

              {activeTab === 'map' && (
                <div className="space-y-5">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-50"></div>
                    <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
                      {weather && <img src={weather.icon} alt={weather.weatherCondition} className="w-7 h-7 object-contain drop-shadow-md" />}
                      Trạng thái hành trình {weather ? `(${weather.temperature}°C)` : ''}
                    </h3>
                    <ul className="text-xs space-y-3 text-gray-400">
                      <li className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <span>Thời tiết</span>
                        <span className="text-gray-200 font-bold">{weather?.weatherCondition || 'Đang tải...'}</span>
                      </li>
                      <li className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <span>Chỉ số tia cực tím UV</span>
                        <span className={`${(weather?.uvIndex ?? 0) >= 8 ? 'text-red-400' : 'text-amber-400'} font-bold flex items-center gap-1`}>
                          {weather?.uvIndex ?? '--'} {(weather?.uvIndex ?? 0) >= 8 ? <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded-full">Rất cao</span> : ''}
                        </span>
                      </li>
                      <li className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <span>Điểm dừng mát gần nhất</span>
                        <span className="text-emerald-400 font-bold">
                          {coolstops.length > 0 ? `${coolstops[0].name} (${coolstops[0].distance}m)` : 'Đang tải...'}
                        </span>
                      </li>
                      <li className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <span>Thời gian di chuyển</span>
                        <span className="text-white font-bold">{osrmInfo ? osrmInfo.duration + ' phút' : 'Chưa có'}</span>
                      </li>
                    </ul>
                  </div>

                  {pickupPoints && !isTripStarted && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                      <PickupSafety
                        pickupPoints={pickupPoints}
                        onNavigateToPoint={handleNavigateToPickup}
                      />
                    </div>
                  )}
                  
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
                  {routes.length > 0 ? (
                    <RouteCompare
                      routes={routes}
                      selectedRouteId={selectedRouteId}
                      onSelectRoute={handleSelectRoute}
                      isTripStarted={isTripStarted}
                      onStartRoute={() => {
                        setIsTripStarted(true);
                        setFocusBounds(null);
                        centerMapOnLocation(gpsLocation || driverLocation);
                        setActiveTab('map');
                        setIsPanelOpen(false);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-70">
                      <div className="w-16 h-16 bg-black/40 border border-white/10 rounded-full flex items-center justify-center mb-4">
                        <Map className="w-8 h-8 text-gray-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-300">Hãy chọn điểm đến trước</h3>
                      <p className="text-xs text-gray-500 mt-1">Dùng thanh tìm kiếm phía trên để tìm chuyến đi</p>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Thanh Điều Hướng Dưới Cùng */}
        <nav className="shrink-0 h-[72px] bg-black/80 backdrop-blur-2xl border-t border-white/10 grid grid-cols-4 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-safe">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'map') {
                    if (activeTab === 'map') {
                      setIsPanelOpen(!isPanelOpen);
                    } else {
                      setActiveTab('map');
                      setIsPanelOpen(false);
                    }
                  } else {
                    setActiveTab(tab.id as 'map' | 'coolstop' | 'journey' | 'report');
                    setIsPanelOpen(true);
                  }
                  if (tab.id === 'coolstop' && coolstops.length > 0 && !activeCoolStop) {
                    setActiveCoolStop(coolstops[0]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-300 cursor-pointer ${
                  isActive ? 'text-emerald-400 scale-105' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
                )}
                {isActive && <span className="absolute top-1.5 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]" />}
                <Icon className={`w-5 h-5 transition-transform mt-1.5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>{tab.label}</span>
              </button>
            )
          })}
        </nav>
        <AnimatePresence>
          {showIncomingRide && pickupPoints && (
            <IncomingRide 
              pickupPoints={pickupPoints}
              onAccept={() => {
                setShowIncomingRide(false);
                // Calculate route from driver to the risky pickup point
                const actualDriverLoc = gpsLocation || driverLocation;
                const driverOrigin = { name: 'Vị trí của bạn', lat: actualDriverLoc[0], lng: actualDriverLoc[1] };
                const dest = { name: pickupPoints.defaultPoint.name, lat: pickupPoints.defaultPoint.lat, lng: pickupPoints.defaultPoint.lng }; 
                handleSearchRoutes(driverOrigin, dest);
                setActualPickupPoint(dest);
                
                // Show safety modal immediately after route is drawn
                setShowSafetyModal(true);
              }}
              onReject={() => setShowIncomingRide(false)}
            />
          )}

          {showSafetyModal && pickupPoints && (
            <SafetyPickupModal 
              pickupPoints={pickupPoints}
              onAcceptSafe={() => {
                setShowSafetyModal(false);
                const actualDriverLoc = gpsLocation || driverLocation;
                const driverOrigin = { name: 'Vị trí của bạn', lat: actualDriverLoc[0], lng: actualDriverLoc[1] };
                const safeDest = { name: pickupPoints.suggestedPoint.name, lat: pickupPoints.suggestedPoint.lat, lng: pickupPoints.suggestedPoint.lng };
                handleSearchRoutes(driverOrigin, safeDest);
                setActualPickupPoint(safeDest);
              }}
              onIgnore={() => {
                setShowSafetyModal(false);
              }}
            />
          )}

          {isTripStarted && !isPassengerPickedUp && actualPickupPoint && !showSafetyModal && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none"
            >
              <button
                onClick={() => {
                  setIsPassengerPickedUp(true);
                  setIsFakeGps(true);
                  setGpsLocation([actualPickupPoint.lat, actualPickupPoint.lng]);
                  centerMapOnLocation([actualPickupPoint.lat, actualPickupPoint.lng]);
                  
                  const finalDestination = { name: 'Điểm đến (Giao hàng)', lat: 10.8700, lng: 106.8000 };
                  handleSearchRoutes(actualPickupPoint, finalDestination);
                }}
                className="w-full max-w-sm py-4 rounded-xl font-bold text-gray-900 bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] pointer-events-auto active:scale-95 transition-transform text-lg flex items-center justify-center gap-2"
              >
                ĐÃ ĐÓN KHÁCH
              </button>
            </motion.div>
          )}

          {isTripStarted && isPassengerPickedUp && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none"
            >
              <button
                onClick={() => {
                  setIsTripStarted(false);
                  setIsPassengerPickedUp(false);
                  setOsrmRoute(null);
                  setOsrmInfo(null);
                  setRoutes([]);
                  setSelectedRouteId(null);
                  setActualPickupPoint(null);
                  setIsFakeGps(false);
                  setActiveTab('map');
                  setIsPanelOpen(true);
                }}
                className="w-full max-w-sm py-4 rounded-xl font-bold text-gray-900 bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] pointer-events-auto active:scale-95 transition-transform text-lg flex items-center justify-center gap-2"
              >
                HOÀN THÀNH CHUYẾN ĐI
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
