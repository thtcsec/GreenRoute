'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, User, DollarSign, Clock, ShieldAlert } from 'lucide-react';

interface IncomingRideProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingRide({ onAccept, onReject }: IncomingRideProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isVibrating, setIsVibrating] = useState(true);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  // Vibrate logic (if supported)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      // Vibrate pattern: vibrate 200ms, pause 100ms, repeat
      const interval = setInterval(() => {
        window.navigator.vibrate([200, 100, 200]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-none">
      {/* Background Dim (Clickable if you want to reject, but usually you have to press the button) */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onReject}
      />

      {/* Main Card */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full bg-gray-900 rounded-t-3xl border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative z-10 pointer-events-auto flex flex-col overflow-hidden"
      >
        {/* Progress Bar (Time left) */}
        <div className="h-1.5 w-full bg-gray-800">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 15, ease: "linear" }}
            className="h-full bg-emerald-500"
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center relative z-10">
                  <User className="text-emerald-400 w-6 h-6" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-gray-900"></span>
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Khách hàng VIP</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400 text-xs font-bold">★ 4.9</span>
                  <span className="text-gray-500 text-xs">• 15 chuyến</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-400 tracking-tight">45.000đ</p>
              <div className="flex justify-end mt-1">
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                  <DollarSign className="w-3 h-3" /> Tiền mặt
                </span>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 mb-4 flex gap-3 items-start">
            <ShieldAlert className="text-red-400 w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-0.5">Cảnh báo rủi ro</p>
              <p className="text-red-200 text-xs leading-relaxed">
                Khu vực điểm đón đang có <b>chỉ số UV cực đại</b> và nằm trong khu vực <b>thiếu bóng râm</b>.
              </p>
            </div>
          </div>

          {/* Route Info */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4 relative">
            <div className="absolute left-[23px] top-[24px] bottom-[24px] w-0.5 bg-gray-700/50" />
            
            <div className="flex gap-3 items-start relative z-10">
              <div className="w-6 h-6 rounded-full bg-blue-950 border border-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Điểm đón khách (Cách 1.2km)</p>
                <p className="text-white text-sm font-semibold">Tòa nhà Bitexco Financial Tower</p>
                <p className="text-gray-500 text-xs mt-0.5">2 Hải Triều, Bến Nghé, Quận 1</p>
              </div>
            </div>

            <div className="flex gap-3 items-start relative z-10">
              <div className="w-6 h-6 rounded-full bg-rose-950 border border-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Điểm đến (5.4km)</p>
                <p className="text-white text-sm font-semibold">Đại học Quốc Tế - ĐHQG HCM</p>
                <p className="text-gray-500 text-xs mt-0.5">Khu phố 6, Linh Trung, Thủ Đức</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button 
              onClick={onReject}
              className="py-3.5 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white transition-all text-sm"
            >
              Bỏ qua ({timeLeft}s)
            </button>
            <motion.button 
              onClick={onAccept}
              whileTap={{ scale: 0.95 }}
              className="py-3.5 rounded-xl font-bold text-gray-900 bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex justify-center items-center gap-2 text-sm"
            >
              <Navigation className="w-4 h-4 fill-current" />
              NHẬN CHUYẾN
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
