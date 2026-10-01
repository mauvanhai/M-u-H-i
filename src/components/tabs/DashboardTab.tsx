import React, { useState } from 'react';
import {
  DoorClosed,
  GraduationCap,
  CalendarDays,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Flame,
  FileText,
  Send,
  Sparkles,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS } from '../../services/permissions';

interface DashboardTabProps {
  onNavigateTab: (tab: string) => void;
  onOpenRoomDetail: (roomId: string) => void;
  onOpenQuickLogModal: (roomId?: string) => void;
  onOpenQuickReportModal: (roomId?: string) => void;
  onOpenHandoverModal: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigateTab,
  onOpenRoomDetail,
  onOpenQuickLogModal,
  onOpenQuickReportModal,
  onOpenHandoverModal,
}) => {
  const {
    currentUser,
    rooms,
    students,
    shifts,
    currentShift,
    reports,
    pendingTasks,
    teachers,
    lastUpdated,
  } = useApp();

  if (!currentUser) return null;

  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalStudents = students.length;
  const presentStudents = students.filter((s) => s.boardingStatus === 'present' || s.boardingStatus === 'sick').length;
  const onLeaveStudents = students.filter((s) => s.boardingStatus === 'on_leave').length;
  const sickStudents = students.filter((s) => s.boardingStatus === 'sick').length;

  const urgentReports = reports.filter((r) => r.priority === 'urgent' && r.status !== 'completed');
  const activeTasks = pendingTasks.filter((t) => t.status !== 'completed');

  const currentRoleDef = ROLE_DEFINITIONS[currentUser.role];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-emerald-300 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Trực nội trú 24 giờ
              </span>
              <span className="text-emerald-200/60">•</span>
              <span className="text-xs text-emerald-100/80">Trường PTDTNT TH & THCS Mẫu Sơn</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Xin chào, {currentUser.name}
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Thầy/Cô đang truy cập với vai trò{' '}
              <span className="font-semibold text-white bg-white/20 px-2 py-0.5 rounded backdrop-blur-xs">
                {currentRoleDef.title}
              </span>
              . {currentRoleDef.description}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              onClick={() => onOpenQuickLogModal()}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Ghi nhật ký ca</span>
            </button>
            <button
              onClick={() => onOpenQuickReportModal()}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-slate-950" />
              <span>Báo cáo nhanh</span>
            </button>
            <button
              onClick={onOpenHandoverModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium text-xs border border-emerald-500/40 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bàn giao ca</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Warning Notification if any */}
      {urgentReports.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-700 shrink-0">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-red-900 text-sm">
                  Cảnh báo có {urgentReports.length} báo cáo cần xử lý sớm!
                </h4>
                <button
                  onClick={() => onNavigateTab('reports')}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1"
                >
                  Xem ngay <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-red-700 mt-1">
                {urgentReports[0].title} — {urgentReports[0].roomCode} ({urgentReports[0].reporterName})
              </p>
              <div className="mt-2 text-[11px] text-red-800 bg-red-100/70 p-2 rounded flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 shrink-0 text-red-700" />
                <span>
                  <strong>Lưu ý an toàn:</strong> Khi có tình huống sức khỏe hoặc phát sinh khẩn cấp, đề nghị liên hệ trực tiếp Ban giám hiệu hoặc cán bộ y tế qua điện thoại.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Rooms */}
        <div
          onClick={() => onNavigateTab('rooms')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Phòng nội trú</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DoorClosed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalRooms} phòng</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Sức chứa: {totalStudents}/{totalCapacity} chỗ</span>
            <span className="text-emerald-700 font-medium group-hover:translate-x-0.5 transition-transform">
              Xem →
            </span>
          </div>
        </div>

        {/* Metric 2: Boarding Students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Học sinh nội trú</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents} em</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-emerald-600 font-medium">{presentStudents} có mặt</span>
            {onLeaveStudents > 0 && <span className="text-amber-600 font-medium">{onLeaveStudents} phép</span>}
            {sickStudents > 0 && <span className="text-red-600 font-medium">{sickStudents} ốm</span>}
          </div>
        </div>

        {/* Metric 3: Current Shift */}
        <div
          onClick={() => onNavigateTab('shifts')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Ca trực 24h</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {currentShift ? currentShift.code : 'Chưa có ca'}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {currentShift ? `${currentShift.assignments.length} GV trực ca` : 'Nhấn để tạo ca'}
          </div>
        </div>

        {/* Metric 4: Tasks & Unresolved */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Việc cần theo dõi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeTasks.length} việc</div>
          <div className="text-xs text-slate-500 mt-1">
            {urgentReports.length > 0 ? (
              <span className="text-red-600 font-semibold">{urgentReports.length} việc khẩn cấp</span>
            ) : (
              <span className="text-emerald-600">Đang kiểm soát tốt</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Section: Current Duty Shift Overview & Room Supervision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ongoing Shift status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-sm">Ca Trực Hiện Tại</h3>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                Đang diễn ra (24h)
              </span>
            </div>

            {currentShift ? (
              <div className="mt-4 space-y-3.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Khung giờ trực:
                    </span>
                    <span className="font-bold text-slate-800">{currentShift.code}</span>
                  </div>
                  <div className="text-slate-700 mt-1 font-semibold text-[11px]">
                    Từ: {currentShift.startTime} <br />
                    Đến: {currentShift.endTime}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Giáo viên trực ca & phòng phụ trách:
                  </h4>
                  <div className="space-y-2">
                    {currentShift.assignments.map((asg, idx) => {
                      const teacher = teachers.find((t) => t.id === asg.teacherId);
                      const assignedRoomCodes = asg.roomIds
                        .map((rid) => rooms.find((r) => r.id === rid)?.code)
                        .filter(Boolean);
                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{asg.teacherName}</span>
                            <p className="text-[11px] text-slate-500">{teacher?.title || 'Giáo viên trực'}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                            {assignedRoomCodes.map((code) => (
                              <span
                                key={code}
                                className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {currentShift.notes && (
                  <div className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/50">
                    <strong className="text-amber-900">Lưu ý ca:</strong> {currentShift.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                Chưa có ca trực nào được kích hoạt.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('shifts')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              Xem lịch trực đầy đủ <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenHandoverModal}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
            >
              Lập bàn giao ca
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Room Status Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tình Hình Các Phòng Nội Trú</h3>
              <p className="text-xs text-slate-500">
                Theo dõi sức chứa, 2 giáo viên quản lý chính và giáo viên đang trực từng phòng.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('rooms')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="mt-4 p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <DoorClosed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có phòng. Thêm phòng để bắt đầu.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Khu nội trú hiện chưa khai báo phòng nào. Ban giám hiệu có thể bắt đầu tạo phòng theo cấu trúc 4 dãy (U1 - U4), mỗi dãy 3 tầng.
              </p>
              <button
                onClick={() => onNavigateTab('rooms')}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                Khai báo phòng ngay
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {rooms.map((room) => {
                const roomStudents = students.filter((s) => s.roomId === room.id);
                const presentCount = roomStudents.filter((s) => s.boardingStatus === 'present').length;
                const sickCount = roomStudents.filter((s) => s.boardingStatus === 'sick').length;
                const onLeaveCount = roomStudents.filter((s) => s.boardingStatus === 'on_leave').length;

                const leader = students.find((s) => s.id === room.leaderStudentId);
                const viceLeader = students.find((s) => s.id === room.viceLeaderStudentId);

                // 2 Main managing teachers
                const manager1 = teachers.find((t) => t.id === room.managerTeacherIds[0]);
                const manager2 = teachers.find((t) => t.id === room.managerTeacherIds[1]);

                // Current duty teacher
                const dutyTeacherAssignment = currentShift?.assignments.find((a) =>
                  a.roomIds.includes(room.id)
                );

                // Capacity status
                const isOverCapacity = roomStudents.length > room.capacity;
                const isFull = roomStudents.length === room.capacity;

                return (
                  <div
                    key={room.id}
                    onClick={() => onOpenRoomDetail(room.id)}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-sm group"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {room.code}
                            </span>
                            <span className="text-xs font-medium text-slate-600 truncate">{room.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {room.building === 'unassigned' || !room.building
                              ? 'Chưa gán dãy/tầng'
                              : `Dãy ${room.building} - Tầng ${room.floor || 0}`}
                          </p>
                        </div>

                        {/* Capacity badge */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isOverCapacity
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : isFull
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {roomStudents.length}/{room.capacity}
                        </span>
                      </div>

                      {/* Education Level Breakdown & Status */}
                      {(() => {
                        const thcsC = roomStudents.filter((s) => s.educationLevel === 'thcs').length;
                        const thC = roomStudents.filter((s) => s.educationLevel === 'tieu_hoc').length;
                        return (
                          <div className="text-[10px] text-slate-500 mb-1.5 flex items-center justify-between">
                            <span>
                              Cấp học: <strong className="text-indigo-800">{thcsC} THCS</strong> • <strong className="text-sky-800">{thC} TH</strong>
                            </span>
                            <span className="font-semibold text-slate-600">
                              {room.status === 'active' ? 'Hoạt động' : room.status === 'maintenance' ? 'Bảo trì' : 'Phòng trống'}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Sĩ số chi tiết */}
                      <div className="text-[11px] text-slate-600 mb-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-emerald-700 font-semibold">{presentCount} có mặt</span>
                        {sickCount > 0 && (
                          <span className="text-red-600 font-bold bg-red-100 px-1 rounded">
                            {sickCount} sốt/ốm
                          </span>
                        )}
                        {onLeaveCount > 0 && (
                          <span className="text-amber-700 font-semibold bg-amber-100 px-1 rounded">
                            {onLeaveCount} phép
                          </span>
                        )}
                      </div>

                      {/* Ban cán sự học sinh */}
                      <div className="space-y-1 text-[11px] bg-white p-2 rounded-lg border border-slate-200/60 mb-2.5">
                        <div className="truncate">
                          <span className="text-slate-500 font-medium">Trưởng:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {leader ? leader.fullName : 'Chưa chỉ định'}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500 font-medium">Phó:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {viceLeader ? viceLeader.fullName : 'Chưa chỉ định'}
                          </span>
                        </div>
                      </div>

                      {/* 2 Giáo viên quản lý chính */}
                      <div className="text-[11px] text-slate-600 space-y-0.5 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">2 GV Quản lý chính:</p>
                        <div className="truncate font-medium text-slate-800">
                          1. {manager1 ? manager1.name : 'Chưa chọn'}
                        </div>
                        <div className="truncate font-medium text-slate-800">
                          2. {manager2 ? manager2.name : 'Chưa chọn'}
                        </div>
                      </div>
                    </div>

                    {/* Giáo viên trực hôm nay & Công việc chưa hoàn thành */}
                    <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Đang trực:</span>
                        <span className="font-bold text-amber-900 truncate max-w-[140px]">
                          {dutyTeacherAssignment ? dutyTeacherAssignment.teacherName : 'Chưa phân công'}
                        </span>
                      </div>

                      {(() => {
                        const unfinished = pendingTasks.filter(
                          (t) => t.roomId === room.id && t.status !== 'completed'
                        );
                        return (
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Việc chưa xong:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded ${
                                unfinished.length > 0
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {unfinished.length} việc
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Pending Follow-up Tasks & Quick Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Việc Tồn Đọng Chuyển Ca</h3>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Quản lý việc →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {activeTasks.length > 0 ? (
              activeTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="py-2.5 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        {task.roomCode}
                      </span>
                      <span className="font-semibold text-slate-800">{task.title}</span>
                      {task.priority === 'urgent' && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Khẩn
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{task.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{task.createdAt.split(' ')[0]}</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Hiện không có công việc tồn đọng nào cần theo dõi.
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Quick Reports */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Báo Cáo Nhanh Mới Nhất</h3>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Xem tất cả ({reports.length}) →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {reports.slice(0, 4).map((report) => (
              <div key={report.id} className="py-2.5 text-xs flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        report.priority === 'urgent'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {report.priority === 'urgent' ? 'Cần xử lý sớm' : 'Thông thường'}
                    </span>
                    <span className="font-bold text-slate-800">{report.title}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                    {report.roomCode} • Gửi bởi: {report.reporterName} ({report.createdAt})
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    report.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : report.status === 'processing'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {report.status === 'completed'
                    ? 'Đã xong'
                    : report.status === 'processing'
                    ? 'Đang xử lý'
                    : 'Mới gửi'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
