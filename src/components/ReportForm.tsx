'use client';

import { useState } from 'react';
import { ClimateReport } from '@/types';
import { Send, Thermometer, CloudSun, Droplets, Ban, ShieldAlert, Sparkles, Car, Trash2, ClipboardList, ChevronDown, CheckCircle2 } from 'lucide-react';

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

interface ReportFormProps {
  onSubmitReport: (type: ClimateReport['type'], note: string) => void;
  reports?: ClimateReport[];
  onDeleteReport?: (reportId: string) => void;
}

export default function ReportForm({ onSubmitReport, reports, onDeleteReport }: ReportFormProps) {
  const [reportType, setReportType] = useState<ClimateReport['type']>('Too hot');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);

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

  const typesList: { type: ClimateReport['type']; label: string; icon: React.ElementType; activeColor: string; activeBg: string; activeBorder: string; desc: string }[] = [
    {
      type: 'Too hot',
      label: 'Trời quá nóng',
      icon: Thermometer,
      activeColor: 'text-orange-300',
      activeBg: 'bg-orange-950/40',
      activeBorder: 'border-orange-500/50',
      desc: 'Nắng gắt nhiệt độ cao'
    },
    {
      type: 'No shade',
      label: 'Thiếu bóng râm',
      icon: CloudSun,
      activeColor: 'text-amber-300',
      activeBg: 'bg-amber-950/40',
      activeBorder: 'border-amber-500/50',
      desc: 'Không có cây/mái che'
    },
    {
      type: 'Flooded',
      label: 'Đường ngập nước',
      icon: Droplets,
      activeColor: 'text-blue-300',
      activeBg: 'bg-blue-950/40',
      activeBorder: 'border-blue-500/50',
      desc: 'Ngập sâu khó di chuyển'
    },
    {
      type: 'Hard to stop',
      label: 'Khó dừng đỗ',
      icon: Ban,
      activeColor: 'text-red-300',
      activeBg: 'bg-red-950/40',
      activeBorder: 'border-red-500/50',
      desc: 'Đường hẹp/cấm đỗ xe'
    },
    {
      type: 'Unsafe pickup/drop-off',
      label: 'Đón trả không an toàn',
      icon: ShieldAlert,
      activeColor: 'text-rose-300',
      activeBg: 'bg-rose-950/40',
      activeBorder: 'border-rose-500/50',
      desc: 'Điểm đón nguy hiểm'
    },
    {
      type: 'Traffic jam',
      label: 'Kẹt xe / Tắc đường',
      icon: Car,
      activeColor: 'text-red-300',
      activeBg: 'bg-red-950/40',
      activeBorder: 'border-red-500/50',
      desc: 'Đoạn đường ùn tắc kéo dài'
    }
  ];

  const reportTypeMap: Record<ClimateReport['type'], { label: string; icon: React.ElementType }> = {
    'Too hot': { label: 'Trời quá nóng', icon: Thermometer },
    'No shade': { label: 'Thiếu bóng râm', icon: CloudSun },
    'Flooded': { label: 'Đường ngập nước', icon: Droplets },
    'Hard to stop': { label: 'Khó dừng đỗ', icon: Ban },
    'Unsafe pickup/drop-off': { label: 'Đón trả không an toàn', icon: ShieldAlert },
    'Traffic jam': { label: 'Kẹt xe / Tắc đường', icon: Car },
  };

  // Sort reports by timestamp descending (most recent first)
  const sortedReports = reports
    ? [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];
  const visibleReports = showAllReports ? sortedReports : sortedReports.slice(0, 5);
  const hasMoreReports = sortedReports.length > 5;

  return (
    <div className="relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent"></div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">Báo cáo thời tiết thực tế</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Giúp cộng đồng tài xế khác bằng cách chia sẻ thông tin</p>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="mb-4 p-3.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Báo cáo thành công! Vị trí đã được đánh dấu trên bản đồ.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lựa chọn loại báo cáo */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">
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
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${item.activeBg} ${item.activeBorder} scale-[1.01] shadow-lg`
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-black/40 border border-white/10' : 'bg-black/30'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? item.activeColor : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>{item.desc}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${item.activeColor}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ghi chú thêm */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">
            Ghi chú chi tiết (Tùy chọn):
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Đoạn đường ngập khoảng nửa bánh xe máy, xe ga nên tránh..."
            className="w-full bg-black/50 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-amber-950/10 focus:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all resize-none h-20 leading-relaxed"
          />
        </div>

        {/* Nút gửi */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Gửi báo cáo ngay
            </>
          )}
        </button>
      </form>

      {/* Lịch sử báo cáo */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" /> Lịch sử báo cáo
        </h4>

        {sortedReports.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
            <ClipboardList className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600 font-medium">Chưa có báo cáo nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleReports.map((report) => {
              const typeInfo = reportTypeMap[report.type];
              const Icon = typeInfo?.icon || ShieldAlert;

              return (
                <div
                  key={report.id}
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3 group transition-all hover:bg-white/10 hover:border-white/10"
                >
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-gray-200 truncate">{typeInfo?.label || report.type}</span>
                      <span className="text-[10px] text-gray-600 shrink-0">·</span>
                      <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(report.timestamp)}</span>
                    </div>
                    {report.note && (
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{report.note}</p>
                    )}
                  </div>
                  {onDeleteReport && (
                    <button
                      onClick={() => onDeleteReport(report.id)}
                      className="p-1.5 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                      title="Xoá báo cáo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {hasMoreReports && !showAllReports && (
              <button
                onClick={() => setShowAllReports(true)}
                className="w-full py-2.5 text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5"
              >
                <ChevronDown className="w-4 h-4" /> Xem tất cả ({sortedReports.length} báo cáo)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
