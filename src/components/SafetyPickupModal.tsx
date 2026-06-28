'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, MapPin, Navigation, ArrowRight, X } from 'lucide-react';
import { PickupPoints } from '@/types';

interface SafetyPickupModalProps {
  pickupPoints: PickupPoints;
  onAcceptSafe: () => void;
  onIgnore: () => void;
}

export default function SafetyPickupModal({ pickupPoints, onAcceptSafe, onIgnore }: SafetyPickupModalProps) {
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Giả lập thời gian AI quét tìm điểm an toàn trong 2.5s
    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
      />

      <AnimatePresence mode="wait">
        {isScanning ? (
          <motion.div 
            key="scanning"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center text-center max-w-sm pointer-events-auto"
          >
            <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-red-500/50 rounded-full animate-pulse" />
              <div className="bg-red-500/20 w-full h-full rounded-full flex items-center justify-center backdrop-blur-md border border-red-500">
                <ShieldAlert className="w-10 h-10 text-red-500 animate-bounce" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-wide text-shadow-sm">PHÁT HIỆN RỦI RO!</h2>
            <p className="text-sm text-red-200">
              Điểm đón khách nằm trong vùng <b>Nắng nóng cực đoan</b>.
            </p>
            <div className="mt-6 flex flex-col items-center">
              <div className="h-1 w-32 bg-gray-800 rounded-full overflow-hidden mb-3">
                <motion.div 
                  className="h-full bg-emerald-500" 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "linear" }}
                />
              </div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                Đang tìm trạm an toàn (CoolStop)...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative z-10 w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 pointer-events-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 relative">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <ShieldCheck className="w-20 h-20" />
              </div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 relative z-10">
                <ShieldCheck className="w-6 h-6" /> Đề Xuất Điểm Đón An Toàn
              </h2>
              <p className="text-emerald-100 text-xs font-medium mt-1 relative z-10">
                AI đã tìm thấy vị trí đón khách tốt hơn cách điểm gốc 60m.
              </p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              
              {/* Risky Point */}
              <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 relative">
                <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded">GỐC</div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm line-through decoration-red-500/50">{pickupPoints.defaultPoint.name}</h3>
                    <p className="text-red-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                      Lý do: {pickupPoints.defaultPoint.reason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-gray-800 rounded-full p-1 border border-gray-700 flex flex-col items-center">
                  <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>

              {/* Safe Point */}
              <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-2xl p-4 relative shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <div className="absolute top-4 right-4 bg-emerald-500 text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm">ĐỀ XUẤT</div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-emerald-400 font-bold text-sm">{pickupPoints.suggestedPoint.name}</h3>
                    <p className="text-gray-300 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                      Ưu điểm: {pickupPoints.suggestedPoint.reason}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-2">
                  <div className="bg-emerald-500/20 px-2 py-1 rounded flex items-center justify-center">
                    <span className="text-emerald-400 text-xs">🚶‍♂️</span>
                  </div>
                  <p className="text-emerald-300/80 text-[10px] font-medium leading-tight">
                    Khách hàng sẽ tự đi bộ đến điểm này. Bạn không cần phải vòng xe vào khu vực rủi ro!
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 pt-2 flex gap-3">
              <button 
                onClick={onIgnore}
                className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
              >
                Giữ điểm gốc
              </button>
              <button 
                onClick={onAcceptSafe}
                className="flex-[2] py-3 rounded-xl font-bold text-gray-900 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4 fill-current" /> ĐỔI ĐIỂM ĐÓN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
