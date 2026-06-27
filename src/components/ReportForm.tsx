'use client';

import { useState } from 'react';
import { ClimateReport } from '@/types';
import { Send, Thermometer, CloudSun, Droplets, Ban, ShieldAlert, Sparkles } from 'lucide-react';

interface ReportFormProps {
  onSubmitReport: (type: ClimateReport['type'], note: string) => void;
}

export default function ReportForm({ onSubmitReport }: ReportFormProps) {
  const [reportType, setReportType] = useState<ClimateReport['type']>('Too hot');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Giả lập gửi báo cáo nhanh (demo dưới 1 giây)
    setTimeout(() => {
      onSubmitReport(reportType, note);
      setIsSubmitting(false);
      setSuccess(true);
      setNote('');

      // Tắt thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }, 600);
  };

  const typesList: { type: ClimateReport['type']; label: string; icon: React.ElementType; color: string; desc: string }[] = [
    {
      type: 'Too hot',
      label: 'Trời quá nóng',
      icon: Thermometer,
      color: 'border-orange-500 text-orange-400 bg-orange-950/20',
      desc: 'Nắng gắt nhiệt độ cao'
    },
    {
      type: 'No shade',
      label: 'Thiếu bóng râm',
      icon: CloudSun,
      color: 'border-amber-500 text-amber-400 bg-amber-950/20',
      desc: 'Không có cây/mái che'
    },
    {
      type: 'Flooded',
      label: 'Đường ngập nước',
      icon: Droplets,
      color: 'border-blue-500 text-blue-400 bg-blue-950/20',
      desc: 'Ngập sâu khó di chuyển'
    },
    {
      type: 'Hard to stop',
      label: 'Khó dừng đỗ',
      icon: Ban,
      color: 'border-red-500 text-red-400 bg-red-950/20',
      desc: 'Đường hẹp/cấm đỗ xe'
    },
    {
      type: 'Unsafe pickup/drop-off',
      label: 'Đón trả không an toàn',
      icon: ShieldAlert,
      color: 'border-rose-500 text-rose-400 bg-rose-950/20',
      desc: 'Điểm đón nguy hiểm'
    }
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-md font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Báo cáo thời tiết thời gian thực
          </h3>
          <p className="text-[11px] text-gray-500">Giúp đỡ cộng đồng tài xế khác bằng cách chia sẻ thông tin thực tế</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-900 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Báo cáo thành công! Vị trí đã được đánh dấu trên bản đồ.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lựa chọn loại báo cáo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Chọn tình huống gặp phải:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {typesList.map((item) => {
              const Icon = item.icon;
              const isSelected = reportType === item.type;
              
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setReportType(item.type)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? `${item.color} border-2 scale-[1.01]`
                      : 'bg-gray-950/50 border-gray-800/80 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-gray-900/60' : 'bg-gray-900/40'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ghi chú thêm */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Ghi chú chi tiết (Tùy chọn):
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Đoạn đường ngập khoảng nửa bánh xe máy, xe ga nên tránh..."
            className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all resize-none h-20"
          />
        </div>

        {/* Nút gửi */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-gray-950 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/10"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-gray-950"></div>
          ) : (
            <>
              <Send className="w-4 h-4" /> Gửi báo cáo ngay
            </>
          )}
        </button>
      </form>
    </div>
  );
}
