'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpDown, Search, MapPin, Crosshair, Loader2 } from 'lucide-react';
import { Location } from '@/types';

// Các địa điểm mẫu được hiển thị ngay lập tức khi người dùng focus vào ô tìm kiếm
const PRESET_LOCATIONS: Location[] = [
  { name: 'ĐH Quốc tế HCMIU - Cổng chính', lat: 10.8783, lng: 106.8063 },
  { name: 'Ký túc xá Khu B - ĐHQG', lat: 10.882, lng: 106.809 },
  { name: 'Nhà Văn Hóa Sinh Viên ĐHQG', lat: 10.8755, lng: 106.801 },
  { name: 'Bệnh viện ĐHQG HCM', lat: 10.87, lng: 106.803 },
  { name: 'Trung tâm TDTT ĐHQG', lat: 10.874, lng: 106.7975 },
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

  const [activeField, setActiveField] = useState<'origin' | 'dest' | null>(null);
  const [suggestions, setSuggestions] = useState<Location[]>(PRESET_LOCATIONS);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // ─── Nominatim Geocoding (OpenStreetMap, miễn phí, không cần key) ─────────
  // API: https://nominatim.openstreetmap.org/search
  // Rate limit: 1 request/giây → debounce 600ms
  // viewbox: giới hạn khu vực Thủ Đức / ĐHQG HCM
  const searchNominatim = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions(PRESET_LOCATIONS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&format=json&limit=5` +
        `&viewbox=106.75,10.90,106.85,10.83&bounded=1` +
        `&countrycodes=vn` +
        `&accept-language=vi`,
        {
          headers: {
            'User-Agent': 'GreenRoute-Hackathon/1.0',
          },
        }
      );
      const data = await res.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: Location[] = data.map((item: any) => ({
        name: item.display_name.split(',').slice(0, 3).join(', ').trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      // Kết hợp kết quả Nominatim với preset gợi ý phù hợp
      const presetMatches = PRESET_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(query.toLowerCase())
      );

      // Loại bỏ trùng lặp (nếu preset và Nominatim trả cùng 1 địa điểm)
      const combined = [...presetMatches];
      for (const r of results) {
        const isDuplicate = combined.some(
          c => Math.abs(c.lat - r.lat) < 0.001 && Math.abs(c.lng - r.lng) < 0.001
        );
        if (!isDuplicate) combined.push(r);
      }

      setSuggestions(combined.slice(0, 6));
    } catch (err) {
      console.warn('Nominatim search error:', err);
      // Fallback: lọc từ preset
      setSuggestions(
        PRESET_LOCATIONS.filter(loc =>
          loc.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search khi user gõ
  const handleInputChange = useCallback(
    (value: string, field: 'origin' | 'dest') => {
      if (field === 'origin') {
        setOriginText(value);
        setOrigin(null);
      } else {
        setDestText(value);
        setDestination(null);
      }

      // Clear previous timer
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Debounce 600ms để tránh spam Nominatim
      debounceRef.current = setTimeout(() => {
        searchNominatim(value);
      }, 600);
    },
    [searchNominatim]
  );

  const handleOriginFocus = () => {
    setActiveField('origin');
    setSuggestions(PRESET_LOCATIONS);
    if (originText === 'Vị trí hiện tại') {
      setOriginText('');
    }
  };

  const handleOriginBlur = () => {
    setTimeout(() => {
      if (activeField === 'origin' && !origin) {
        setOriginText('');
      } else if (origin?.name === 'Vị trí hiện tại' && originText === '') {
        setOriginText('Vị trí hiện tại');
      }
    }, 250);
  };

  const handleDestFocus = () => {
    setActiveField('dest');
    setSuggestions(PRESET_LOCATIONS);
  };

  const handleSelectSuggestion = (location: Location) => {
    if (activeField === 'origin') {
      setOrigin(location);
      setOriginText(location.name);
      setActiveField(null);
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
                    onChange={(e) => handleInputChange(e.target.value, 'origin')}
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
                {activeField === 'origin' && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                    {isSearching && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                        <Loader2 size={12} className="animate-spin" />
                        Đang tìm kiếm...
                      </div>
                    )}
                    {suggestions.map((loc, idx) => (
                      <button
                        key={`origin-${loc.lat}-${loc.lng}-${idx}`}
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
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button */}
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
                    onChange={(e) => handleInputChange(e.target.value, 'dest')}
                    onFocus={handleDestFocus}
                    placeholder="Nhập điểm đến..."
                    className="flex-1 min-w-0 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
                  />
                  {isSearching && activeField === 'dest' && (
                    <Loader2 size={14} className="animate-spin text-gray-500" />
                  )}
                </div>

                {/* Destination Dropdown */}
                {activeField === 'dest' && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                    {isSearching && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                        <Loader2 size={12} className="animate-spin" />
                        Đang tìm kiếm...
                      </div>
                    )}
                    {suggestions.map((loc, idx) => (
                      <button
                        key={`dest-${loc.lat}-${loc.lng}-${idx}`}
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
                setIsCollapsed(true);
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
            
            {/* Collapse button */}
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
