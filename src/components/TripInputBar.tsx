'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpDown, Search, MapPin, Crosshair } from 'lucide-react';
import { Location } from '@/types';

const MOCK_LOCATIONS: Location[] = [
  { name: 'Đại học Quốc tế HCMIU - Cổng chính', lat: 10.8783, lng: 106.8063 },
  { name: 'Ký túc xá Khu B - ĐHQG', lat: 10.882, lng: 106.809 },
  { name: 'Nhà Văn Hóa Sinh Viên ĐHQG', lat: 10.8755, lng: 106.801 },
  { name: 'Bệnh viện ĐHQG HCM', lat: 10.87, lng: 106.803 },
  { name: 'Trung tâm Thể dục Thể thao ĐHQG', lat: 10.874, lng: 106.7975 },
  { name: 'Làng Đại Học Thủ Đức', lat: 10.8742, lng: 106.8028 },
];

interface TripInputBarProps {
  driverLocation: [number, number];
  onSearchRoutes: (origin: Location, destination: Location) => void;
}

export default function TripInputBar({
  driverLocation,
  onSearchRoutes,
}: TripInputBarProps) {
  const defaultOrigin: Location = {
    name: 'Vị trí hiện tại',
    lat: driverLocation[0],
    lng: driverLocation[1],
  };

  const [origin, setOrigin] = useState<Location | null>(defaultOrigin);
  const [destination, setDestination] = useState<Location | null>(null);

  const [originText, setOriginText] = useState(defaultOrigin.name);
  const [destText, setDestText] = useState('');

  const [activeField, setActiveField] = useState<'origin' | 'dest' | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveField(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update origin when driverLocation changes
  useEffect(() => {
    if (origin?.name === 'Vị trí hiện tại') {
      setOrigin({
        name: 'Vị trí hiện tại',
        lat: driverLocation[0],
        lng: driverLocation[1],
      });
    }
  }, [driverLocation, origin?.name]);

  const getFilteredSuggestions = useCallback(
    (query: string) => {
      if (!query || query === 'Vị trí hiện tại') return MOCK_LOCATIONS;
      const lower = query.toLowerCase();
      return MOCK_LOCATIONS.filter((loc) =>
        loc.name.toLowerCase().includes(lower)
      );
    },
    []
  );

  const handleOriginFocus = () => {
    setActiveField('origin');
    if (originText === 'Vị trí hiện tại') {
      setOriginText('');
    }
  };

  const handleOriginBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (activeField === 'origin' && !origin) {
        setOriginText('');
      } else if (origin?.name === 'Vị trí hiện tại' && originText === '') {
        setOriginText('Vị trí hiện tại');
      }
    }, 200);
  };

  const handleDestFocus = () => {
    setActiveField('dest');
  };

  const handleSelectSuggestion = (location: Location) => {
    if (activeField === 'origin') {
      setOrigin(location);
      setOriginText(location.name);
      setActiveField(null);
      // Move focus to destination if empty
      if (!destination) {
        setTimeout(() => destInputRef.current?.focus(), 100);
      }
    } else if (activeField === 'dest') {
      setDestination(location);
      setDestText(location.name);
      setActiveField(null);
    }
  };

  const handleSwap = () => {
    const prevOrigin = origin;
    const prevOriginText = originText;
    const prevDest = destination;
    const prevDestText = destText;

    setOrigin(prevDest);
    setOriginText(prevDestText);
    setDestination(prevOrigin);
    setDestText(prevOriginText);
    setActiveField(null);
  };

  const handleResetOrigin = () => {
    const loc: Location = {
      name: 'Vị trí hiện tại',
      lat: driverLocation[0],
      lng: driverLocation[1],
    };
    setOrigin(loc);
    setOriginText(loc.name);
    setActiveField(null);
  };

  const handleSearch = () => {
    if (origin && destination) {
      onSearchRoutes(origin, destination);
    }
  };

  const isSearchDisabled = !destination;

  const currentSuggestions = activeField
    ? getFilteredSuggestions(activeField === 'origin' ? originText : destText)
    : [];

  const descriptionMap: Record<string, string> = {
    'Đại học Quốc tế HCMIU - Cổng chính': 'Khu phố 6, Linh Trung, Thủ Đức',
    'Ký túc xá Khu B - ĐHQG': 'Đông Hòa, Dĩ An, Bình Dương',
    'Nhà Văn Hóa Sinh Viên ĐHQG': 'Linh Trung, Thủ Đức, TP.HCM',
    'Bệnh viện ĐHQG HCM': 'Linh Trung, Thủ Đức, TP.HCM',
    'Trung tâm Thể dục Thể thao ĐHQG': 'Linh Trung, Thủ Đức, TP.HCM',
    'Làng Đại Học Thủ Đức': 'Linh Trung, Thủ Đức, TP.HCM',
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative rounded-2xl border border-gray-800 bg-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-300">
        {isCollapsed ? (
          <div 
            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-800/50 rounded-2xl transition-colors"
            onClick={() => setIsCollapsed(false)}
          >
            <div className="flex items-center gap-2.5 text-sm">
              <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <span className="text-gray-200 font-medium truncate max-w-[100px]">{originText || 'Vị trí hiện tại'}</span>
              <span className="text-gray-600 font-bold">→</span>
              <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
              <span className="text-gray-400 truncate max-w-[120px]">{destText || 'Bạn muốn đi đâu?'}</span>
            </div>
            <button className="text-gray-500 hover:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
        ) : (
          <div className="p-3">
            {/* Input Fields Container */}
            <div className="relative flex flex-col gap-0">
              {/* Origin Input */}
              <div className="relative">
                <div className="relative flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20">
                  <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  <input
                    ref={originInputRef}
                    type="text"
                    value={originText}
                    onChange={(e) => {
                      setOriginText(e.target.value);
                      setOrigin(null);
                    }}
                    onFocus={handleOriginFocus}
                    onBlur={handleOriginBlur}
                    placeholder="Điểm đón"
                    className="flex-1 min-w-0 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleResetOrigin}
                    className="flex-shrink-0 p-1 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-gray-800 transition-colors duration-150"
                    title="Dùng vị trí hiện tại"
                  >
                    <Crosshair size={16} />
                  </button>
                </div>

                {/* Origin Dropdown */}
                {activeField === 'origin' && currentSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                    {currentSuggestions.map((loc) => (
                      <button
                        key={`origin-${loc.lat}-${loc.lng}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(loc)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-800/60 transition-colors duration-100 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <MapPin
                          size={16}
                          className="flex-shrink-0 mt-0.5 text-gray-500"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 truncate">
                            {loc.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {descriptionMap[loc.name] ?? ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button - Centered between fields */}
              <div className="relative flex items-center justify-center h-0 z-10">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="absolute flex items-center justify-center w-8 h-8 rounded-full border border-gray-700 bg-gray-800 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-gray-750 transition-all duration-200 shadow-lg"
                  title="Hoán đổi điểm đón và điểm đến"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              {/* Destination Input */}
              <div className="relative mt-2">
                <div className="relative flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20">
                  <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                  <input
                    ref={destInputRef}
                    type="text"
                    value={destText}
                    onChange={(e) => {
                      setDestText(e.target.value);
                      setDestination(null);
                    }}
                    onFocus={handleDestFocus}
                    placeholder="Nhập điểm đến..."
                    className="flex-1 min-w-0 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
                  />
                </div>

                {/* Destination Dropdown */}
                {activeField === 'dest' && currentSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                    {currentSuggestions.map((loc) => (
                      <button
                        key={`dest-${loc.lat}-${loc.lng}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(loc)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-800/60 transition-colors duration-100 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <MapPin
                          size={16}
                          className="flex-shrink-0 mt-0.5 text-gray-500"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 truncate">
                            {loc.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {descriptionMap[loc.name] ?? ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={() => {
                handleSearch();
                setIsCollapsed(true); // Tự động thu gọn khi tìm kiếm
              }}
              disabled={isSearchDisabled}
              className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isSearchDisabled
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30'
              }`}
            >
              <Search size={16} />
              Tìm chuyến đi
            </button>
            
            {/* Nút thu gọn (Mũi tên lên) */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-emerald-400 rounded-full p-1 shadow-lg transition-colors z-10"
              title="Thu gọn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
