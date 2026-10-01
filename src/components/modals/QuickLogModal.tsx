import React, { useState } from 'react';
import { X, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LogCategory } from '../../types';
import { canCreateDutyLog } from '../../services/permissions';

interface QuickLogModalProps {
  initialRoomId?: string;
  onClose: () => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({ initialRoomId, onClose }) => {
  const { rooms, currentShift, currentUser, addDutyLog } = useApp();

  if (!currentUser) return null;

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    initialRoomId || rooms[0]?.id || ''
  );
  const [category, setCategory] = useState<LogCategory>('sinh_hoat');
  const [content, setContent] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Check permission for this room
  const permissionCheck = selectedRoom
    ? canCreateDutyLog(currentUser, selectedRoom, currentShift)
    : { allowed: true };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!permissionCheck.allowed) {
      setError(permissionCheck.reason || 'Thầy/Cô không có quyền ghi nhật ký cho phòng này.');
      return;
    }

    if (!content.trim()) {
      setError('Vui lòng nhập nội dung ghi nhận trong ca trực.');
      return;
    }

    const res = addDutyLog({
      roomId: selectedRoomId,
      category,
      content: content.trim(),
      actionTaken: actionTaken.trim(),
      followUpNeeded: followUpNeeded.trim(),
    });

    if (!res.success) {
      setError(res.error || 'Có lỗi khi lưu nhật ký.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Ghi Nhật Ký Ca Trực 24 Giờ</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          Người ghi: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.title})
          {currentShift && <span> • Ca trực: <strong className="text-slate-800">{currentShift.code}</strong></span>}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!permissionCheck.allowed && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{permissionCheck.reason}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phòng nội trú *</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
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
              <label className="font-bold text-slate-700 block mb-1">Nhóm nội dung *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LogCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
              >
                <option value="sinh_hoat">Sinh hoạt (Vệ sinh, ăn uống, ngủ nghỉ)</option>
                <option value="hoc_tap">Học tập (Giờ tự học tối, bài vở)</option>
                <option value="kiem_tra_phong">Kiểm tra phòng (Nề nếp, tác phong)</option>
                <option value="khac">Việc khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nội dung quan sát / diễn biến thực tế *
            </label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="VD: Kiểm tra phòng lúc 21:00. Học sinh nghiêm túc tự học, đủ sĩ số..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">
              Ghi nhận trung thực diễn biến thực tế, không tự tạo nhận xét chủ quan về tính cách học sinh.
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Việc đã thực hiện tại chỗ (nếu có)
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="VD: Đã nhắc nhở em Khôi tắt điện ban công, hướng dẫn các em dọn bàn học..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Việc cần tiếp tục theo dõi (sẽ tự động tạo việc tồn đọng cho ca sau)
            </label>
            <textarea
              rows={2}
              value={followUpNeeded}
              onChange={(e) => setFollowUpNeeded(e.target.value)}
              placeholder="VD: Sáng mai kiểm tra lại sức khỏe của em Cường, nhắc em uống nước ấm..."
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
              disabled={!permissionCheck.allowed}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold shadow-xs"
            >
              Lưu nhật ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
