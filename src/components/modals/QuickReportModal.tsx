import React, { useState } from 'react';
import { X, AlertTriangle, PhoneCall, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReportPriority } from '../../types';

interface QuickReportModalProps {
  initialRoomId?: string;
  onClose: () => void;
}

export const QuickReportModal: React.FC<QuickReportModalProps> = ({
  initialRoomId,
  onClose,
}) => {
  const { rooms, students, currentUser, createReport } = useApp();

  if (!currentUser) return null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || rooms[0]?.id || '');
  const [studentId, setStudentId] = useState('');
  const [priority, setPriority] = useState<ReportPriority>('normal');
  const [error, setError] = useState<string | null>(null);

  const roomStudents = students.filter((s) => s.roomId === roomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung báo cáo.');
      return;
    }

    const res = createReport({
      title: title.trim(),
      content: content.trim(),
      roomId,
      studentId: studentId || undefined,
      priority,
    });

    if (!res.success) {
      setError(res.error || 'Có lỗi khi gửi báo cáo.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Tạo Báo Cáo Nhanh / Sự Vụ Đột Xuất</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          Người gửi: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.title})
        </div>

        {/* Urgent warning banner */}
        {priority === 'urgent' && (
          <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs text-red-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-red-950">
              <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
              <span>YÊU CẦU AN TOÀN KHẨN CẤP:</span>
            </div>
            <p className="leading-relaxed">
              Báo cáo ở mức <strong>Cần xử lý sớm</strong>: Đề nghị thầy/cô chủ động <strong>liên hệ trực tiếp qua điện thoại</strong> tới Ban giám hiệu, Cán bộ y tế hoặc Quản sinh trực để có phản ứng kịp thời. Phần mềm không đảm bảo phản ứng khẩn cấp tức thì!
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Mức độ ưu tiên *</label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  priority === 'normal'
                    ? 'bg-slate-100 border-slate-400 font-bold text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="accent-slate-700"
                />
                <div>
                  <span className="block font-semibold">Thông thường</span>
                  <span className="text-[10px] text-slate-500 block">Sự cố CSVC nhẹ, nhắc nhở nếp sống</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  priority === 'urgent'
                    ? 'bg-red-50 border-red-400 font-bold text-red-950'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="accent-red-600"
                />
                <div>
                  <span className="block font-bold text-red-700">Cần xử lý sớm</span>
                  <span className="text-[10px] text-red-600 block">Sốt cao, tai nạn, mất điện/nước</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Tiêu đề báo cáo tóm tắt *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Học sinh Lăng Văn Cường sốt 38.2 độ sau bữa tối..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phòng nội trú liên quan *</label>
              <select
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setStudentId('');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Học sinh liên quan (nếu có)</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                <option value="">-- Sự cố chung của phòng --</option>
                {roomStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.className})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Nội dung chi tiết sự việc *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ghi rõ thời gian xảy ra, biểu hiện học sinh, hiện trạng hỏng hóc hoặc các biện pháp ban đầu đã xử lý..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl font-bold text-white shadow-xs ${
                priority === 'urgent' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
