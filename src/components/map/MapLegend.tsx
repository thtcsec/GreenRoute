'use client';

import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Thermometer, Droplets, Snowflake } from 'lucide-react';

interface MapLegendProps {
  activeLayer: 'heat' | 'flood' | 'all' | 'none';
}

export default function MapLegend({ activeLayer }: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeLayer === 'none') return null;

  return (
    <div className="absolute bottom-6 right-3 z-[1000] max-w-xs transition-all duration-300 pointer-events-auto">
      <div className="bg-gray-950/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-3 text-white">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Chú giải lớp bản đồ</span>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 pt-2 border-t border-gray-800/80 text-[11px] animate-fadeIn">
            {/* Heat Intensity Legend */}
            {(activeLayer === 'all' || activeLayer === 'heat') && (
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-orange-400 mb-1.5">
                  <Thermometer className="w-3.5 h-3.5" /> Nắng nóng & Cảnh báo nhiệt
                </div>
                <div className="space-y-1 pl-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-sm shadow-red-500/50"></span> Cực kỳ gay gắt
                    </span>
                    <span className="text-gray-400 font-mono">&gt;40°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50"></span> Nắng nóng cao
                    </span>
                    <span className="text-gray-400 font-mono">38-40°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50"></span> Nhiệt độ vừa
                    </span>
                    <span className="text-gray-400 font-mono">&lt;38°C</span>
                  </div>
                </div>
              </div>
            )}

            {/* Flood Severity Legend */}
            {(activeLayer === 'all' || activeLayer === 'flood') && (
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1.5">
                  <Droplets className="w-3.5 h-3.5" /> Mức độ ngập nước
                </div>
                <div className="space-y-1 pl-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-900 border border-blue-400 inline-block"></span> Ngập nguy hiểm
                    </span>
                    <span className="text-gray-400 font-mono">&gt;35 cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Ngập cao
                    </span>
                    <span className="text-gray-400 font-mono">20-35 cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span> Ngập vừa
                    </span>
                    <span className="text-gray-400 font-mono">&lt;20 cm</span>
                  </div>
                </div>
              </div>
            )}

            {/* CoolStop Types Legend */}
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1.5">
                <Snowflake className="w-3.5 h-3.5" /> Trạm dừng CoolStop
              </div>
              <div className="space-y-1 pl-1">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span> Trạm làm mát
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Bóng râm / Trạm xe buýt
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span> Mái che điều hòa
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
