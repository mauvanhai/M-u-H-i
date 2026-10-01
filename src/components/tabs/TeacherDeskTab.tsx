import React from 'react';
import {
  Clock,
  DoorClosed,
  AlertTriangle,
  FileText,
  Send,
  Calendar,
  CheckCircle2,
  Users,
  Shield,
  ArrowRight,
  PhoneCall,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TeacherDeskTabProps {
  onNavigateTab: (tab: string) => void;
  onOpenRoomDetail: (roomId: string) => void;
  onOpenQuickLogModal: (roomId?: string) => void;
  onOpenQuickReportModal: (roomId?: string) => void;
  onOpenHandoverModal: () => void;
}

export const TeacherDeskTab: React.FC<TeacherDeskTabProps> = ({
  onNavigateTab,
  onOpenRoomDetail,
  onOpenQuickLogModal,
  onOpenQuickReportModal,
  onOpenHandoverModal,
}) => {
  const {
    currentUser,
    currentShift,
    rooms,
    students,
    pendingTasks,
    reports,
    handovers,
    coordinations,
    acceptHandover,
  } = useApp();

  if (!currentUser) return null;

  // 1. Check if user is on duty in current shift
  const dutyAssignment = currentShift?.assignments.find((a) => a.teacherId === currentUser.id);
  const isOnDutyToday = Boolean(dutyAssignment && currentShift?.status === 'ongoing');
  const dutyRoomIds = dutyAssignment ? dutyAssignment.roomIds : [];
  const dutyRooms = rooms.filter((r) => dutyRoomIds.includes(r.id));

  // 2. Check rooms managed by user as GVQL
  const managedRooms = rooms.filter((r) => r.managerTeacherIds.includes(currentUser.id));

  // 3. Pending handovers addressed to current teacher
  const pendingHandoverForMe = handovers.find(
    (h) => h.toTeacherId === currentUser.id && h.status === 'pending'
  );

  // 4. Tasks and reports for this teacher
  const myPendingTasks = pendingTasks.filter(
    (t) =>
      (t.assignedToTeacherId === currentUser.id ||
        managedRooms.some((r) => r.id === t.roomId) ||
        dutyRoomIds.includes(t.roomId)) &&
      t.status !== 'completed'
  );

  const myCoordinations = coordinations.filter(
    (c) =>
      c.assignedTeacherId === currentUser.id ||
      managedRooms.some((r) => r.id === c.roomId)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-white/20 text-white font-bold text-xs px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Không Gian Làm Việc Giáo Viên
              </span>
              <span className="text-blue-200 text-xs">•</span>
              <span className="text-xs text-blue-100">{currentUser.title}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Thầy/Cô {currentUser.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-blue-100">
              {managedRooms.length > 0 && (
                <span className="bg-emerald-500/30 text-white border border-emerald-300/40 px-2 py-0.5 rounded-lg">
                  GVQL: {managedRooms.map((r) => r.code).join(', ')}
                </span>
              )}
              {isOnDutyToday ? (
                <span className="bg-amber-500/30 text-white border border-amber-300/40 px-2 py-0.5 rounded-lg">
                  Đang trực ca 24h ({currentShift?.code})
                </span>
              ) : (
                <span className="bg-white/10 text-white px-2 py-0.5 rounded-lg">
                  Hôm nay không có ca trực
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenQuickLogModal()}
              className="px-3 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-xs hover:bg-blue-50 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>Ghi nhật ký ca</span>
            </button>
            <button
              onClick={() => onOpenQuickReportModal()}
              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Báo cáo nhanh</span>
            </button>
            {isOnDutyToday && (
              <button
                onClick={onOpenHandoverModal}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs border border-blue-400/50 shadow-xs transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Bàn giao cuối ca</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert if not assigned to any room or shift */}
      {!isOnDutyToday && managedRooms.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-950">Bạn chưa được phân công phòng hoặc ca trực.</h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Tài khoản của Thầy/Cô chưa được Ban Giám Hiệu gắn vào danh sách 2 giáo viên quản lý chính của phòng nào hoặc phân công ca trực. Khi Ban Giám Hiệu hoàn tất phân công, các phòng phụ trách sẽ xuất hiện tại đây.
            </p>
          </div>
        </div>
      )}
      {pendingHandoverForMe && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Biên bản bàn giao ca đang chờ Thầy/Cô tiếp nhận!</span>
            </div>
            <p className="text-amber-900 mt-0.5">
              Biên bản <strong>{pendingHandoverForMe.code}</strong> từ giáo viên {pendingHandoverForMe.fromTeacherName} ({pendingHandoverForMe.fromShiftCode}).
            </p>
          </div>
          <button
            onClick={() => acceptHandover(pendingHandoverForMe.id)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0 self-start sm:self-auto"
          >
            Xác nhận tiếp nhận ca ngay
          </button>
        </div>
      )}

      {/* SECTION 1: NHIỆM VỤ TRỰC CA 24H (NẾU HÔM NAY ĐANG TRỰC) */}
      {isOnDutyToday && (
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-slate-900 text-sm">
                Nhiệm Vụ Ca Trực 24 Giờ Hôm Nay ({currentShift?.code})
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Khung giờ: {currentShift?.startTime} → {currentShift?.endTime}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Các phòng phụ trách trong ca ({dutyRooms.length} phòng):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {dutyRooms.map((r) => {
                const rStudents = students.filter((s) => s.roomId === r.id);
                const rSick = rStudents.filter((s) => s.boardingStatus === 'sick').length;

                return (
                  <div
                    key={r.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-blue-900 text-sm">{r.code} - {r.name}</span>
                        <span className="font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {rStudents.length}/{r.capacity} em
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {r.building === 'unassigned' || !r.building ? 'Chưa gán dãy/tầng' : `Dãy ${r.building} • Tầng ${r.floor || 0}`}
                      </p>
                      {rSick > 0 && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                          {rSick} em đang sốt/ốm
                        </span>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between">
                      <button
                        onClick={() => onOpenRoomDetail(r.id)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                      >
                        Chi tiết phòng →
                      </button>
                      <button
                        onClick={() => onOpenQuickLogModal(r.id)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium text-[11px]"
                      >
                        Ghi nhật ký
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CÁC PHÒNG QUẢN LÝ CHÍNH (GVQL) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DoorClosed className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Phòng Quản Lý Chính (GVQL Dài Hạn)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {managedRooms.length} phòng phụ trách
          </span>
        </div>

        {managedRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {managedRooms.map((r) => {
              const rStudents = students.filter((s) => s.roomId === r.id);
              const manager2Id = r.managerTeacherIds.find((id) => id !== currentUser.id);

              return (
                <div
                  key={r.id}
                  className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-950 text-base">{r.code} - {r.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {r.building === 'unassigned' || !r.building ? 'Chưa gán dãy/tầng' : `Dãy ${r.building} • Tầng ${r.floor || 0}`}
                      </p>
                    </div>
                    <span className="font-bold text-xs bg-white text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200">
                      {rStudents.length} / {r.capacity} em
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px]">
                    Cơ sở vật chất: {r.facilityNotes || 'Bình thường'}
                  </p>

                  <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenRoomDetail(r.id)}
                      className="px-3 py-1.5 bg-blue-700 text-white rounded-lg font-bold text-xs hover:bg-blue-800"
                    >
                      Mở quản lý & phối hợp
                    </button>
                    <button
                      onClick={() => onOpenQuickReportModal(r.id)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                    >
                      Gửi báo cáo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-400 italic text-center py-4 text-xs">
            Thầy/Cô hiện không được phân công quản lý chính phòng nào.
          </div>
        )}
      </div>

      {/* SECTION 3: CÔNG VIỆC VÀ NỘI DUNG PHỐI HỢP CẦN THEO DÕI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Việc Cần Theo Dõi Của Thầy/Cô</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{myPendingTasks.length} việc</span>
          </div>

          <div className="space-y-2 text-xs">
            {myPendingTasks.length > 0 ? (
              myPendingTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span className="bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded text-[10px]">
                      {t.roomCode}
                    </span>
                    <span>{t.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{t.description}</p>
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic text-center py-4 text-xs">
                Không có công việc tồn đọng nào cần xử lý.
              </div>
            )}
          </div>
        </div>

        {/* Coordinations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Nội Dung Phối Hợp Gần Đây</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{myCoordinations.length} vụ việc</span>
          </div>

          <div className="space-y-2 text-xs">
            {myCoordinations.length > 0 ? (
              myCoordinations.slice(0, 3).map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">
                      [{c.roomCode}] Phối hợp: {c.targetPartyName}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.recordedDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{c.content}</p>
                  {c.resultNote && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Kết quả: {c.resultNote}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic text-center py-4 text-xs">
                Chưa có nội dung phối hợp nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
