import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  Edit2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Shift, ShiftAssignment } from '../../types';
import { canManageShifts } from '../../services/permissions';

export const ShiftsTab: React.FC = () => {
  const {
    shifts,
    rooms,
    teachers,
    currentUser,
    createShift,
    updateShift,
    checkShiftOverlap,
  } = useApp();

  if (!currentUser) return null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formDate, setFormDate] = useState('2026-10-02');
  const [formStartTime, setFormStartTime] = useState('2026-10-02 07:00');
  const [formEndTime, setFormEndTime] = useState('2026-10-03 07:00');
  const [formStatus, setFormStatus] = useState<Shift['status']>('scheduled');
  const [formAssignments, setFormAssignments] = useState<ShiftAssignment[]>([
    { teacherId: teachers[0]?.id || '', teacherName: teachers[0]?.name || '', roomIds: [rooms[0]?.id || ''] },
  ]);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = canManageShifts(currentUser.role);

  const handleOpenAddModal = () => {
    setEditingShift(null);
    const dateStr = '2026-10-02';
    setFormCode(`CA-${dateStr.replace(/-/g, '')}`);
    setFormDate(dateStr);
    setFormStartTime(`${dateStr} 07:00`);
    setFormEndTime(`2026-10-03 07:00`);
    setFormStatus('scheduled');
    // Pre-populate with first 2 teachers
    setFormAssignments([
      {
        teacherId: teachers[4]?.id || teachers[0]?.id || '',
        teacherName: teachers[4]?.name || teachers[0]?.name || '',
        roomIds: [rooms[0]?.id, rooms[2]?.id].filter(Boolean),
      },
      {
        teacherId: teachers[2]?.id || teachers[1]?.id || '',
        teacherName: teachers[2]?.name || teachers[1]?.name || '',
        roomIds: [rooms[1]?.id].filter(Boolean),
      },
    ]);
    setFormNotes('Ca trực 24 giờ. Chú ý điểm danh phòng trước 21:30.');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setFormCode(shift.code);
    setFormDate(shift.date);
    setFormStartTime(shift.startTime);
    setFormEndTime(shift.endTime);
    setFormStatus(shift.status);
    setFormAssignments(shift.assignments);
    setFormNotes(shift.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddAssignmentRow = () => {
    const defaultTeacher = teachers[0];
    setFormAssignments([
      ...formAssignments,
      {
        teacherId: defaultTeacher.id,
        teacherName: defaultTeacher.name,
        roomIds: [],
      },
    ]);
  };

  const handleRemoveAssignmentRow = (index: number) => {
    setFormAssignments(formAssignments.filter((_, idx) => idx !== index));
  };

  const handleTeacherChange = (index: number, teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const newAssignments = [...formAssignments];
    newAssignments[index] = {
      ...newAssignments[index],
      teacherId,
      teacherName: teacher.name,
    };
    setFormAssignments(newAssignments);
  };

  const handleToggleRoomInAssignment = (index: number, roomId: string) => {
    const newAssignments = [...formAssignments];
    const currentRooms = newAssignments[index].roomIds;
    if (currentRooms.includes(roomId)) {
      newAssignments[index].roomIds = currentRooms.filter((id) => id !== roomId);
    } else {
      newAssignments[index].roomIds = [...currentRooms, roomId];
    }
    setFormAssignments(newAssignments);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim() || !formStartTime.trim() || !formEndTime.trim()) {
      setFormError('Vui lòng nhập đầy đủ mã ca và thời gian trực.');
      return;
    }

    if (formAssignments.length === 0) {
      setFormError('Ca trực phải có ít nhất một giáo viên được phân công.');
      return;
    }

    // Check for empty room assignments
    const emptyAsg = formAssignments.find((a) => a.roomIds.length === 0);
    if (emptyAsg) {
      setFormError(`Giáo viên ${emptyAsg.teacherName} chưa được phân công phòng nào.`);
      return;
    }

    // Overlap validation test
    for (const asg of formAssignments) {
      const overlapMessage = checkShiftOverlap(
        asg.teacherId,
        formStartTime,
        formEndTime,
        editingShift ? editingShift.id : undefined
      );
      if (overlapMessage) {
        setFormError(overlapMessage);
        return;
      }
    }

    if (editingShift) {
      const res = updateShift({
        ...editingShift,
        code: formCode.trim(),
        date: formDate,
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim(),
        status: formStatus,
        assignments: formAssignments,
        notes: formNotes.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi cập nhật ca trực.');
        return;
      }
    } else {
      const res = createShift({
        code: formCode.trim(),
        date: formDate,
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim(),
        status: formStatus,
        assignments: formAssignments,
        notes: formNotes.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi thêm ca trực.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
            Lịch Trực & Phân Công Ca 24 Giờ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy định trực 24 giờ liên tục. Hệ thống tự động kiểm tra trùng ca trực của giáo viên và cho phép 1 giáo viên phụ trách nhiều phòng.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ca trực mới</span>
          </button>
        )}
      </div>

      {/* Shifts List */}
      <div className="space-y-4">
        {shifts.map((shift) => {
          const isOngoing = shift.status === 'ongoing';
          const isCompleted = shift.status === 'completed';
          const isScheduled = shift.status === 'scheduled';

          return (
            <div
              key={shift.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                isOngoing
                  ? 'border-emerald-400 ring-2 ring-emerald-100'
                  : isCompleted
                  ? 'border-slate-200 opacity-90'
                  : 'border-blue-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isOngoing
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{shift.code}</h3>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isOngoing
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isCompleted
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {isOngoing ? '● Đang diễn ra (24h)' : isCompleted ? 'Đã kết thúc' : 'Dự kiến'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thời gian: <strong className="text-slate-700">{shift.startTime}</strong> đến{' '}
                      <strong className="text-slate-700">{shift.endTime}</strong>
                    </p>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleOpenEditModal(shift)}
                    className="self-end sm:self-center px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Điều chỉnh ca</span>
                  </button>
                )}
              </div>

              {/* Assignments details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {shift.assignments.map((asg, idx) => {
                  const teacher = teachers.find((t) => t.id === asg.teacherId);
                  const isCurrentSupervising = asg.teacherId === currentUser.id;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col justify-between ${
                        isCurrentSupervising
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{asg.teacherName}</span>
                            {isCurrentSupervising && (
                              <span className="text-[10px] bg-emerald-700 text-white font-bold px-1.5 rounded">
                                Tôi
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{teacher?.title || teacher?.role}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{teacher?.phone}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                          Các phòng phụ trách:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {asg.roomIds.map((rid) => {
                            const r = rooms.find((rm) => rm.id === rid);
                            return (
                              <span
                                key={rid}
                                className="bg-white border border-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded shadow-2xs text-[11px]"
                              >
                                {r ? `${r.code} - ${r.name}` : rid}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {shift.notes && (
                <div className="mt-3 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50 text-xs text-amber-900">
                  <strong>Ghi chú ca:</strong> {shift.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create/Edit Shift */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingShift ? `Chỉnh Sửa Ca Trực ${editingShift.code}` : 'Lập Lịch Ca Trực 24 Giờ Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cảnh báo: </span>
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveShift} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã ca trực *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: CA-20261002"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trạng thái ca *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="scheduled">Dự kiến (Chưa đến giờ)</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="completed">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời gian bắt đầu (24h) *</label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm (VD: 2026-10-02 07:00)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời gian kết thúc (24h) *</label>
                  <input
                    type="text"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm (VD: 2026-10-03 07:00)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Assignment rows */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Phân công Giáo viên trực & Phòng phụ trách:</span>
                  <button
                    type="button"
                    onClick={handleAddAssignmentRow}
                    className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px] hover:bg-emerald-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm giáo viên
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formAssignments.map((asg, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={asg.teacherId}
                          onChange={(e) => handleTeacherChange(idx, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg font-semibold"
                        >
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.title})
                            </option>
                          ))}
                        </select>
                        {formAssignments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignmentRow(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1"
                          >
                            Xóa
                          </button>
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">
                          Chọn các phòng phụ trách (cho phép 1 GV phụ trách nhiều phòng):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rooms.map((room) => {
                            const isSelected = asg.roomIds.includes(room.id);
                            return (
                              <button
                                type="button"
                                key={room.id}
                                onClick={() => handleToggleRoomInAssignment(idx, room.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected ? '✓ ' : ''}
                                {room.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú và nhắc nhở ca trực</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Nội dung nhắc nhở trọng tâm trong ca..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                >
                  {editingShift ? 'Cập nhật' : 'Lưu ca trực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
