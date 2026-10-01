import React, { useState } from 'react';
import { X, Send, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HandoverNote, RoomHandoverStatus } from '../../types';

interface HandoverModalProps {
  onClose: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ onClose }) => {
  const {
    shifts,
    currentShift,
    nextShift,
    rooms,
    students,
    teachers,
    currentUser,
    pendingTasks,
    createHandover,
  } = useApp();

  if (!currentUser) return null;

  const [fromShiftId, setFromShiftId] = useState(currentShift?.id || shifts[1]?.id || shifts[0]?.id || '');
  const [toShiftId, setToShiftId] = useState(nextShift?.id || shifts[2]?.id || shifts[0]?.id || '');

  // Default incoming teacher: first teacher of nextShift or another teacher
  const defaultToTeacher =
    nextShift?.assignments[0]?.teacherId ||
    teachers.find((t) => t.id !== currentUser.id)?.id ||
    teachers[0]?.id ||
    '';
  const [toTeacherId, setToTeacherId] = useState(defaultToTeacher);

  // Initialize room statuses
  const initialRoomStatuses: RoomHandoverStatus[] = rooms.map((room) => {
    const rStudents = students.filter((s) => s.roomId === room.id);
    const present = rStudents.filter((s) => s.boardingStatus === 'present').length;
    const leave = rStudents.filter((s) => s.boardingStatus === 'on_leave').length;
    const sick = rStudents.filter((s) => s.boardingStatus === 'sick').length;

    let health = 'Sức khỏe ổn định, bình thường';
    if (sick > 0) {
      health = `Có ${sick} em đang sốt/theo dõi`;
    }

    return {
      roomId: room.id,
      roomCode: room.code,
      totalStudents: rStudents.length,
      presentStudents: present,
      leaveStudents: leave,
      healthNote: health,
      hygieneStatus: 'Phòng sạch sẽ, chăn màn gấp gọn',
      equipmentStatus: 'Điện, nước, quạt, cửa hoạt động tốt',
    };
  });

  const [roomStatuses, setRoomStatuses] = useState<RoomHandoverStatus[]>(initialRoomStatuses);

  // Active pending task IDs selected to carry forward
  const activeTaskIds = pendingTasks.filter((t) => t.status !== 'completed').map((t) => t.id);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(activeTaskIds);

  const [generalNotes, setGeneralNotes] = useState(
    'Bàn giao nề nếp sinh hoạt học sinh. Đề nghị ca sau tiếp tục theo dõi các em đang sốt và đón học sinh nghỉ phép trở lại.'
  );
  const [error, setError] = useState<string | null>(null);

  const handleRoomStatusChange = (
    index: number,
    field: keyof RoomHandoverStatus,
    val: string | number
  ) => {
    const updated = [...roomStatuses];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setRoomStatuses(updated);
  };

  const handleToggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromShiftId || !toShiftId || !toTeacherId) {
      setError('Vui lòng chọn đầy đủ ca trước, ca sau và giáo viên tiếp nhận.');
      return;
    }

    const res = createHandover({
      fromShiftId,
      toShiftId,
      toTeacherId,
      roomStatuses,
      pendingTaskIds: selectedTaskIds,
      generalNotes: generalNotes.trim(),
    });

    if (!res.success) {
      setError(res.error || 'Có lỗi khi lập biên bản bàn giao.');
      return;
    }

    alert('Đã lập phiếu bàn giao ca thành công! Phiếu đang ở trạng thái chờ người nhận xác nhận.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Lập Biên Bản Bàn Giao Ca Trực 24 Giờ</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          Người bàn giao: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.title})
        </p>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Shift Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ca trực bàn giao *</label>
              <select
                value={fromShiftId}
                onChange={(e) => setFromShiftId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} ({s.status === 'ongoing' ? 'Đang trực' : s.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ca trực tiếp nhận *</label>
              <select
                value={toShiftId}
                onChange={(e) => setToShiftId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Giáo viên nhận bàn giao *</label>
              <select
                value={toTeacherId}
                onChange={(e) => setToTeacherId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room Status Table */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wider">
              Tình hình bàn giao từng phòng:
            </h4>
            <div className="space-y-3">
              {roomStatuses.map((rs, idx) => (
                <div key={rs.roomId} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                      Phòng {rs.roomCode}
                    </span>
                    <span className="text-slate-600 font-normal">
                      Sĩ số: <strong>{rs.presentStudents}</strong> có mặt / <strong>{rs.totalStudents}</strong> em
                      {rs.leaveStudents > 0 && <span> ({rs.leaveStudents} nghỉ phép)</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Sức khỏe học sinh</label>
                      <input
                        type="text"
                        value={rs.healthNote}
                        onChange={(e) => handleRoomStatusChange(idx, 'healthNote', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Vệ sinh phòng ở</label>
                      <input
                        type="text"
                        value={rs.hygieneStatus}
                        onChange={(e) => handleRoomStatusChange(idx, 'hygieneStatus', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Cơ sở vật chất</label>
                      <input
                        type="text"
                        value={rs.equipmentStatus}
                        onChange={(e) => handleRoomStatusChange(idx, 'equipmentStatus', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tasks to carry forward */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <span className="font-bold text-amber-950 block">
              Chọn các công việc tồn đọng chuyển giao sang ca tiếp theo:
            </span>
            <p className="text-[11px] text-amber-800">
              Công việc chưa hoàn thành sẽ được giữ nguyên lịch sử và giao tiếp cho ca kế tiếp tiếp tục xử lý.
            </p>

            <div className="space-y-1.5 mt-2">
              {pendingTasks
                .filter((t) => t.status !== 'completed')
                .map((task) => {
                  const isChecked = selectedTaskIds.includes(task.id);
                  return (
                    <label
                      key={task.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200/80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTask(task.id)}
                        className="accent-amber-600 rounded"
                      />
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                        {task.roomCode}
                      </span>
                      <span className="font-semibold text-slate-800 flex-1">{task.title}</span>
                      {task.priority === 'urgent' && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Khẩn
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nhận xét và lưu ý chung toàn ca</label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
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
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
            >
              Lập biên bản bàn giao
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
