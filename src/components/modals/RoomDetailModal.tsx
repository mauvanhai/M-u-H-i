import React, { useState } from 'react';
import {
  X,
  DoorClosed,
  Users,
  Shield,
  Phone,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  UserCheck,
  HeartPulse,
  Send,
  Calendar,
  History,
  Edit2,
  AlertCircle,
  ArrowRightLeft,
  Check,
  Save,
  Flame,
  Info,
  Layers,
  Wrench,
  HelpCircle,
  PhoneCall,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Room, Student, LogCategory, ReportPriority, ReportStatus } from '../../types';
import { canEditRoom, canCreateDutyLog, canAssignTask, canUpdateReport, canViewRoom } from '../../services/permissions';

interface RoomDetailModalProps {
  roomId: string;
  onClose: () => void;
  onOpenQuickLogModal: (roomId: string) => void;
  onOpenQuickReportModal: (roomId: string) => void;
}

type DetailTab = 'general' | 'students' | 'teachers' | 'logs' | 'reports_tasks' | 'handovers';

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  roomId,
  onClose,
  onOpenQuickLogModal,
  onOpenQuickReportModal,
}) => {
  const {
    rooms,
    students,
    teachers,
    shifts,
    dutyLogs,
    reports,
    pendingTasks,
    handovers,
    currentShift,
    currentUser,
    updateRoom,
    updateStudent,
    addStudent,
    changeStudentRoom,
    addDutyLog,
    createReport,
    updateTaskStatus,
    assignReportHandler,
    updateReportStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DetailTab>('general');

  // Search in student list
  const [studentSearch, setStudentSearch] = useState('');

  // Facility notes edit state
  const [isEditingFacility, setIsEditingFacility] = useState(false);
  const [facilityText, setFacilityText] = useState('');

  // Edit Room Configuration state (Capacity, Building, Floor)
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(8);
  const [editBuilding, setEditBuilding] = useState('');
  const [editFloor, setEditFloor] = useState(1);
  const [configError, setConfigError] = useState<string | null>(null);

  // Edit Managing Teachers modal state
  const [isEditingManagers, setIsEditingManagers] = useState(false);
  const [manager1Id, setManager1Id] = useState('');
  const [manager2Id, setManager2Id] = useState('');
  const [managerError, setManagerError] = useState<string | null>(null);

  // Edit Room Leaders modal state
  const [isEditingLeaders, setIsEditingLeaders] = useState(false);
  const [leaderId, setLeaderId] = useState('');
  const [viceLeaderId, setViceLeaderId] = useState('');
  const [leaderError, setLeaderError] = useState<string | null>(null);

  // Add student directly inside room
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'nam' | 'nu'>('nam');
  const [newStudentClass, setNewStudentClass] = useState('Lớp 6A');
  const [newStudentBirthYear, setNewStudentBirthYear] = useState(2014);
  const [newStudentHomeroom, setNewStudentHomeroom] = useState('Thầy Lăng Văn Kiên');
  const [newStudentRole, setNewStudentRole] = useState<'leader' | 'vice_leader' | 'member'>('member');
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Transfer student modal
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [transferTargetRoomId, setTransferTargetRoomId] = useState<string>('');

  // Inline Log Form
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [logCategory, setLogCategory] = useState<LogCategory>('sinh_hoat');
  const [logContent, setLogContent] = useState('');
  const [logAction, setLogAction] = useState('');
  const [logFollowUp, setLogFollowUp] = useState('');
  const [logError, setLogError] = useState<string | null>(null);

  // Inline Report Form
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [repTitle, setRepTitle] = useState('');
  const [repContent, setRepContent] = useState('');
  const [repStudentId, setRepStudentId] = useState('');
  const [repPriority, setRepPriority] = useState<ReportPriority>('normal');
  const [repError, setRepError] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === roomId);
  if (!room || !currentUser) return null;

  // Strict Permission Check: Teacher cannot view rooms outside assignment
  const isAccessible = canViewRoom(currentUser, room, currentShift, shifts);
  if (!isAccessible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Không có quyền truy cập phòng</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Thầy/Cô không thuộc danh sách Giáo viên quản lý chính (GVQL) hoặc Giáo viên trực ca (GVT) được phân công phụ trách phòng <strong>{room.code}</strong> ({room.name}).
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Theo quy định phân quyền, chỉ nhân sự được phân công mới có thể xem thông tin phòng này.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
  }

  const roomStudents = students.filter((s) => s.roomId === room.id);
  const tieuHocStudents = roomStudents.filter((s) => s.educationLevel === 'tieu_hoc');
  const thcsStudents = roomStudents.filter((s) => s.educationLevel === 'thcs');
  const presentCount = roomStudents.filter((s) => s.boardingStatus === 'present').length;
  const sickCount = roomStudents.filter((s) => s.boardingStatus === 'sick').length;
  const onLeaveCount = roomStudents.filter((s) => s.boardingStatus === 'on_leave').length;
  const absentCount = roomStudents.filter((s) => s.boardingStatus === 'absent').length;

  const roomLogs = dutyLogs.filter((l) => l.roomId === room.id);
  const roomReports = reports.filter((r) => r.roomId === room.id);
  const roomTasks = pendingTasks.filter((t) => t.roomId === room.id);
  const unfinishedTasks = roomTasks.filter((t) => t.status !== 'completed');

  // Related handovers
  const roomHandovers = handovers.filter((h) =>
    h.roomStatuses.some((rs) => rs.roomId === room.id)
  );

  const manager1 = teachers.find((t) => t.id === room.managerTeacherIds[0]);
  const manager2 = teachers.find((t) => t.id === room.managerTeacherIds[1]);

  // Current duty teacher
  const dutyAssignment = currentShift?.assignments.find((a) => a.roomIds.includes(room.id));
  const dutyTeacher = dutyAssignment ? teachers.find((t) => t.id === dutyAssignment.teacherId) : undefined;

  const leader = roomStudents.find((s) => s.id === room.leaderStudentId);
  const viceLeader = roomStudents.find((s) => s.id === room.viceLeaderStudentId);

  const isBgh = currentUser.role === 'bgh';
  const isQuanSinh = currentUser.role === 'quan_sinh';
  const isMyManagedRoom = room.managerTeacherIds.includes(currentUser.id);
  const isMyDutyRoom = dutyAssignment?.teacherId === currentUser.id;

  const isOverCapacity = roomStudents.length > room.capacity;
  const isFull = roomStudents.length === room.capacity;

  // Filter students in tab
  const displayedStudents = roomStudents.filter(
    (st) =>
      st.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.code.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.className.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Open config edit
  const handleStartEditConfig = () => {
    setEditName(room.name);
    setEditCapacity(room.capacity);
    setEditBuilding(room.building);
    setEditFloor(room.floor);
    setConfigError(null);
    setIsEditingConfig(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    if (!editName.trim()) {
      setConfigError('Tên phòng không được để trống.');
      return;
    }
    if (editCapacity < roomStudents.length) {
      setConfigError(
        `Sức chứa (${editCapacity}) không thể nhỏ hơn số học sinh hiện tại (${roomStudents.length} em).`
      );
      return;
    }

    const res = updateRoom({
      ...room,
      name: editName.trim(),
      capacity: Number(editCapacity),
      building: editBuilding,
      floor: Number(editFloor),
    });

    if (!res.success) {
      setConfigError(res.error || 'Có lỗi khi cập nhật.');
      return;
    }
    setIsEditingConfig(false);
  };

  // Open manager edit
  const handleStartEditManagers = () => {
    setManager1Id(room.managerTeacherIds[0]);
    setManager2Id(room.managerTeacherIds[1]);
    setManagerError(null);
    setIsEditingManagers(true);
  };

  const handleSaveManagers = (e: React.FormEvent) => {
    e.preventDefault();
    setManagerError(null);
    if (!manager1Id || !manager2Id) {
      setManagerError('Bắt buộc phải chọn đủ 2 giáo viên quản lý chính.');
      return;
    }
    if (manager1Id === manager2Id) {
      setManagerError('Hai giáo viên quản lý chính phải là 2 người khác nhau.');
      return;
    }

    const res = updateRoom({
      ...room,
      managerTeacherIds: [manager1Id, manager2Id],
    });

    if (!res.success) {
      setManagerError(res.error || 'Có lỗi khi cập nhật.');
      return;
    }
    setIsEditingManagers(false);
  };

  // Open leaders edit
  const handleStartEditLeaders = () => {
    setLeaderId(room.leaderStudentId || '');
    setViceLeaderId(room.viceLeaderStudentId || '');
    setLeaderError(null);
    setIsEditingLeaders(true);
  };

  const handleSaveLeaders = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaderError(null);

    if (leaderId && viceLeaderId && leaderId === viceLeaderId) {
      setLeaderError('Trưởng phòng và Phó phòng phải là 2 học sinh khác nhau trong phòng.');
      return;
    }

    const res = updateRoom({
      ...room,
      leaderStudentId: leaderId || undefined,
      viceLeaderStudentId: viceLeaderId || undefined,
    });

    if (!res.success) {
      setLeaderError(res.error || 'Có lỗi khi cập nhật.');
      return;
    }
    setIsEditingLeaders(false);
  };

  // Save facility notes
  const handleSaveFacilityNotes = () => {
    updateRoom({
      ...room,
      facilityNotes: facilityText.trim(),
    });
    setIsEditingFacility(false);
  };

  // Student inline add
  const handleOpenAddStudent = () => {
    const nextCode = `HS-MS${(students.length + 1).toString().padStart(3, '0')}`;
    setNewStudentCode(nextCode);
    setNewStudentName('');
    setNewStudentGender('nam');
    setNewStudentClass('Lớp 6A');
    setNewStudentBirthYear(2014);
    setNewStudentHomeroom('Thầy Lăng Văn Kiên');
    setNewStudentRole('member');
    setAddStudentError(null);
    setIsAddingStudent(true);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);

    if (!newStudentCode.trim() || !newStudentName.trim()) {
      setAddStudentError('Vui lòng nhập đầy đủ mã HS và họ tên.');
      return;
    }

    const classNum = parseInt(newStudentClass.replace(/\D/g, ''), 10);
    const eduLevel = classNum && classNum <= 5 ? 'tieu_hoc' : 'thcs';

    const res = addStudent({
      code: newStudentCode.trim().toUpperCase(),
      fullName: newStudentName.trim(),
      gender: newStudentGender,
      birthYear: Number(newStudentBirthYear),
      className: newStudentClass.trim(),
      educationLevel: eduLevel,
      roomId: room.id,
      homeroomTeacherName: newStudentHomeroom.trim(),
      roleInRoom: newStudentRole,
      boardingStatus: 'present',
    });

    if (!res.success) {
      setAddStudentError(res.error || 'Có lỗi khi thêm học sinh.');
      return;
    }

    setIsAddingStudent(false);
  };

  // Transfer room
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !transferTargetRoomId) return;

    const res = changeStudentRoom(transferringStudent.id, transferTargetRoomId);
    if (!res.success) {
      alert(res.error);
      return;
    }

    setTransferringStudent(null);
  };

  // Save inline log
  const handleSaveInlineLog = (e: React.FormEvent) => {
    e.preventDefault();
    setLogError(null);

    const check = canCreateDutyLog(currentUser, room, currentShift);
    if (!check.allowed) {
      setLogError(check.reason || 'Thầy/Cô không có quyền ghi nhật ký cho phòng này.');
      return;
    }

    if (!logContent.trim()) {
      setLogError('Vui lòng nhập nội dung ghi nhận.');
      return;
    }

    const res = addDutyLog({
      roomId: room.id,
      category: logCategory,
      content: logContent.trim(),
      actionTaken: logAction.trim(),
      followUpNeeded: logFollowUp.trim(),
    });

    if (!res.success) {
      setLogError(res.error || 'Có lỗi khi lưu nhật ký.');
      return;
    }

    setLogContent('');
    setLogAction('');
    setLogFollowUp('');
    setIsCreatingLog(false);
  };

  // Save inline report
  const handleSaveInlineReport = (e: React.FormEvent) => {
    e.preventDefault();
    setRepError(null);

    if (!repTitle.trim() || !repContent.trim()) {
      setRepError('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    const res = createReport({
      title: repTitle.trim(),
      content: repContent.trim(),
      roomId: room.id,
      studentId: repStudentId || undefined,
      priority: repPriority,
    });

    if (!res.success) {
      setRepError(res.error || 'Có lỗi khi gửi báo cáo.');
      return;
    }

    setRepTitle('');
    setRepContent('');
    setRepStudentId('');
    setIsCreatingReport(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
              {room.code}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {room.name}
                </h2>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                    isOverCapacity
                      ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                      : isFull
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {roomStudents.length} / {room.capacity} em
                </span>
                {isOverCapacity && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    ⚠ VƯỢT SỨC CHỨA!
                  </span>
                )}
                {isMyManagedRoom && (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    Phòng tôi quản lý
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {room.building === 'unassigned' || !room.building
                  ? 'Chưa gán dãy/tầng'
                  : `Dãy ${room.building} • Tầng ${room.floor || 'Chưa gán'}`}{' '}
                • Trạng thái:{' '}
                <strong className="text-slate-700">
                  {room.status === 'active'
                    ? 'Đang hoạt động'
                    : room.status === 'maintenance'
                    ? 'Đang bảo trì'
                    : 'Phòng trống / Dự phòng'}
                </strong>
                {' '}• Cấp học: <span className="font-semibold text-indigo-700">{thcsStudents.length} THCS</span>, <span className="font-semibold text-sky-700">{tieuHocStudents.length} Tiểu học</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('logs');
                setIsCreatingLog(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ghi nhật ký</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('reports_tasks');
                setIsCreatingReport(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Báo cáo nhanh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Exactly 6 Sections as Requested */}
        <div className="flex border-b border-slate-200 gap-1 sm:gap-4 text-xs font-semibold overflow-x-auto py-2 shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2 border-b-2 px-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>1. Thông tin chung</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-2 border-b-2 px-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Danh sách học sinh ({roomStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-2 border-b-2 px-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'teachers'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3. Giáo viên phụ trách</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 border-b-2 px-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Nhật kí ca trực ({roomLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports_tasks')}
            className={`pb-2 border-b-2 px-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports_tasks'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              5. Báo cáo & công việc ({unfinishedTasks.length > 0 ? `${unfinishedTasks.length} tồn đọng` : '0'})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('handovers')}
            className={`pb-2 border-b-2 px-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'handovers'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>6. Bàn giao ca ({roomHandovers.length})</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs pr-1">
          {/* ========================================================= */}
          {/* MỤC 1: THÔNG TIN CHUNG */}
          {/* ========================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Thống kê sĩ số & Sức chứa */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Sức chứa tối đa:</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{room.capacity} em</div>
                  <span className="text-[10px] text-slate-400">Có thể điều chỉnh theo thực tế</span>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-medium block">Hiện có mặt:</span>
                  <div className="text-xl font-bold text-emerald-900 mt-0.5">{presentCount} em</div>
                  <span className="text-[10px] text-emerald-700">Tỷ lệ: {Math.round((presentCount / room.capacity) * 100)}%</span>
                </div>
                <div className="bg-red-50/70 p-3 rounded-xl border border-red-200">
                  <span className="text-[11px] text-red-800 font-medium block">Đang sốt / mệt:</span>
                  <div className="text-xl font-bold text-red-900 mt-0.5">{sickCount} em</div>
                  <span className="text-[10px] text-red-700">Theo dõi y tế tại trường</span>
                </div>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-medium block">Nghỉ phép / Vắng:</span>
                  <div className="text-xl font-bold text-amber-900 mt-0.5">{onLeaveCount + absentCount} em</div>
                  <span className="text-[10px] text-amber-700">{onLeaveCount} phép, {absentCount} vắng</span>
                </div>
              </div>

              {/* Ban tự quản học sinh */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    Ban Tự Quản Phòng Ở (Học Sinh)
                  </h4>
                  {(isBgh || isQuanSinh || isMyManagedRoom) && (
                    <button
                      onClick={handleStartEditLeaders}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Bổ nhiệm / Thay đổi</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mb-1">
                      Trưởng phòng
                    </span>
                    <div className="font-bold text-slate-900 text-sm">
                      {leader ? leader.fullName : 'Chưa chỉ định'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {leader ? `${leader.className} • Mã HS: ${leader.code}` : 'Cần chọn 1 học sinh làm trưởng phòng'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Trách nhiệm: Nhận nhiệm vụ từ GVQL/GVT, đôn đốc các bạn trực nhật, tắt điện đúng giờ.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block mb-1">
                      Phó phòng
                    </span>
                    <div className="font-bold text-slate-900 text-sm">
                      {viceLeader ? viceLeader.fullName : 'Chưa chỉ định'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {viceLeader ? `${viceLeader.className} • Mã HS: ${viceLeader.code}` : 'Cần chọn 1 học sinh làm phó phòng'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Trách nhiệm: Phụ trách kiểm tra trật tự giờ tự học tối và vệ sinh chăn màn hàng ngày.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cơ sở vật chất & Tiện nghi phòng */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-slate-600" />
                    Cơ Sở Vật Chất & Tiện Nghi Phòng
                  </h4>
                  {!isEditingFacility && (isBgh || isQuanSinh || isMyManagedRoom) && (
                    <button
                      onClick={() => {
                        setFacilityText(room.facilityNotes || '');
                        setIsEditingFacility(true);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Cập nhật</span>
                    </button>
                  )}
                </div>

                {isEditingFacility ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={facilityText}
                      onChange={(e) => setFacilityText(e.target.value)}
                      placeholder="Ghi chú giường tầng, quạt, đèn, bình nóng lạnh, cửa sổ, thiết bị hỏng hóc..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingFacility(false)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveFacilityNotes}
                        className="px-3 py-1 bg-emerald-700 text-white rounded font-bold"
                      >
                        Lưu ghi chú
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                    {room.facilityNotes || 'Chưa có ghi chú cơ sở vật chất cho phòng này.'}
                  </p>
                )}
              </div>

              {/* Lịch sử điều chỉnh phân công & cấu hình phòng */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-600" />
                  Lịch Sử Thay Đổi Phân Công & Cấu Hình Phòng
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ghi nhận mốc thời gian, người thực hiện khi thay đổi giáo viên quản lý, cán sự học sinh hoặc sức chứa.
                </p>

                <div className="space-y-2 mt-2">
                  {room.assignmentHistory && room.assignmentHistory.length > 0 ? (
                    room.assignmentHistory.map((hist) => (
                      <div key={hist.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{hist.description}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{hist.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Thực hiện bởi: <strong className="text-slate-700">{hist.changedBy}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic text-center py-2">
                      Chưa có thay đổi phân công nào được ghi nhận.
                    </div>
                  )}
                </div>
              </div>

              {/* BGH Configuration Action */}
              {isBgh && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleStartEditConfig}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Chỉnh sửa tên phòng / Sức chứa</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 2: DANH SÁCH HỌC SINH */}
          {/* ========================================================= */}
          {activeTab === 'students' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, mã HS..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-48 sm:w-60"
                  />
                  <span className="text-slate-500 text-[11px]">
                    {displayedStudents.length} / {roomStudents.length} em
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(isBgh || isQuanSinh) && (
                    <button
                      onClick={handleOpenAddStudent}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm học sinh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Mã HS</th>
                      <th className="py-2.5 px-3">Họ và Tên</th>
                      <th className="py-2.5 px-3">Lớp</th>
                      <th className="py-2.5 px-3">Chức danh</th>
                      <th className="py-2.5 px-3">Tình trạng nội trú</th>
                      <th className="py-2.5 px-3">GV Chủ Nhiệm</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStudents.map((st) => {
                      const isL = st.id === room.leaderStudentId;
                      const isVL = st.id === room.viceLeaderStudentId;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{st.code}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900">{st.fullName}</span>
                            <span className="text-[10px] text-slate-400 block">{st.gender === 'nam' ? 'Nam' : 'Nữ'} • {st.birthYear}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{st.className}</td>
                          <td className="py-2.5 px-3">
                            {isL ? (
                              <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-1.5 py-0.5 rounded border border-amber-300">
                                Trưởng phòng
                              </span>
                            ) : isVL ? (
                              <span className="bg-blue-100 text-blue-900 font-bold text-[10px] px-1.5 py-0.5 rounded border border-blue-300">
                                Phó phòng
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Thành viên</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {/* Fast status switcher */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateStudent({ ...st, boardingStatus: 'present' })}
                                title="Có mặt"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  st.boardingStatus === 'present'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                Có mặt
                              </button>
                              <button
                                onClick={() => updateStudent({ ...st, boardingStatus: 'sick' })}
                                title="Sốt / Ốm"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 ${
                                  st.boardingStatus === 'sick'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-red-600 border-slate-200 hover:bg-red-50'
                                }`}
                              >
                                <HeartPulse className="w-2.5 h-2.5" /> Sốt
                              </button>
                              <button
                                onClick={() => updateStudent({ ...st, boardingStatus: 'on_leave' })}
                                title="Nghỉ phép"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  st.boardingStatus === 'on_leave'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50'
                                }`}
                              >
                                Phép
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">{st.homeroomTeacherName}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setTransferringStudent(st);
                                setTransferTargetRoomId(st.roomId);
                              }}
                              title="Chuyển phòng"
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 3: GIÁO VIÊN PHỤ TRÁCH */}
          {/* ========================================================= */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              {/* Distinct explanation notice */}
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Phân biệt hai nhiệm vụ:</strong> <em>Giáo viên quản lý chính</em> là 2 thầy/cô chịu trách nhiệm nề nếp lâu dài, phối hợp phụ huynh và GVCN. <em>Giáo viên trực ca</em> nhận bàn giao theo ca 24h để kiểm tra đôn đốc sinh hoạt tại chỗ. Một thầy/cô có thể đảm nhận cả hai vai trò.
                </p>
              </div>

              {/* Group A: 2 Main managing teachers */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    Hai Giáo Viên Quản Lý Chính (Dài Hạn)
                  </h4>
                  {isBgh && (
                    <button
                      onClick={handleStartEditManagers}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Thay đổi phân công GVQL</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Manager 1 */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                        Giáo viên 1
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{manager1?.code}</span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">{manager1?.name}</div>
                    <div className="text-[11px] text-slate-600">{manager1?.title} • Môn {manager1?.subject}</div>
                    <div className="text-xs text-slate-700 flex items-center gap-1 pt-1 border-t border-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{manager1?.phone}</span>
                    </div>
                  </div>

                  {/* Manager 2 */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                        Giáo viên 2
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{manager2?.code}</span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">{manager2?.name}</div>
                    <div className="text-[11px] text-slate-600">{manager2?.title} • Môn {manager2?.subject}</div>
                    <div className="text-xs text-slate-700 flex items-center gap-1 pt-1 border-t border-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{manager2?.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group B: Current Duty Teacher */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Giáo Viên Đang Trực Ca 24 Giờ Hôm Nay
                  </h4>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {currentShift ? currentShift.code : 'Chưa xếp ca'}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-amber-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {dutyTeacher ? dutyTeacher.name : dutyAssignment?.teacherName || 'Chưa phân công ca trực'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {dutyTeacher?.title || 'Giáo viên trực'} • SĐT: {dutyTeacher?.phone}
                      </div>
                    </div>
                    {currentShift && (
                      <div className="text-right">
                        <span className="text-[11px] text-amber-900 font-semibold block">Khung giờ trực 24h:</span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {currentShift.startTime} → {currentShift.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    Nhiệm vụ: Nhận bàn giao, duy trì nề nếp tự học tối, điểm danh trước giờ ngủ, giải quyết sự việc đột xuất trong ca.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 4: NHẬT KÍ CA TRỰC */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Sổ Nhật Ký Riêng Của Phòng {room.code}
                </h4>
                {!isCreatingLog && (
                  <button
                    onClick={() => setIsCreatingLog(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ghi nhật ký mới</span>
                  </button>
                )}
              </div>

              {/* Inline Create Log Form */}
              {isCreatingLog && (
                <form
                  onSubmit={handleSaveInlineLog}
                  className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3"
                >
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>Ghi nhận xét / kiểm tra ca trực mới:</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingLog(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {logError && (
                    <div className="p-2 bg-red-100 text-red-800 text-[11px] rounded font-semibold">
                      {logError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Phân loại nội dung *</label>
                      <select
                        value={logCategory}
                        onChange={(e) => setLogCategory(e.target.value as LogCategory)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="sinh_hoat">Sinh hoạt (Vệ sinh, ăn uống, ngủ nghỉ)</option>
                        <option value="hoc_tap">Học tập (Giờ tự học tối, bài vở)</option>
                        <option value="kiem_tra_phong">Kiểm tra phòng (Nề nếp, trật tự)</option>
                        <option value="khac">Việc khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Người ghi:</label>
                      <input
                        type="text"
                        disabled
                        value={`${currentUser.name} (${currentUser.title})`}
                        className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Nội dung quan sát thực tế *</label>
                    <textarea
                      rows={2}
                      required
                      value={logContent}
                      onChange={(e) => setLogContent(e.target.value)}
                      placeholder="Ghi nhận trung thực diễn biến kiểm tra phòng..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Việc đã xử lý tại chỗ</label>
                      <input
                        type="text"
                        value={logAction}
                        onChange={(e) => setLogAction(e.target.value)}
                        placeholder="VD: Đã nhắc nhở em Khôi..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Việc cần tiếp tục theo dõi</label>
                      <input
                        type="text"
                        value={logFollowUp}
                        onChange={(e) => setLogFollowUp(e.target.value)}
                        placeholder="VD: Theo dõi sốt lúc 23h..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingLog(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                    >
                      Lưu nhật ký
                    </button>
                  </div>
                </form>
              )}

              {/* Logs List */}
              <div className="space-y-3">
                {roomLogs.length > 0 ? (
                  roomLogs.map((log) => (
                    <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                            {log.category === 'hoc_tap'
                              ? 'Học tập'
                              : log.category === 'sinh_hoat'
                              ? 'Sinh hoạt'
                              : log.category === 'kiem_tra_phong'
                              ? 'Kiểm tra phòng'
                              : 'Khác'}
                          </span>
                          <span className="text-slate-600">
                            Ghi bởi: <strong>{log.teacherName}</strong>
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono">{log.timestamp}</span>
                      </div>

                      <p className="text-slate-800 font-medium leading-relaxed">{log.content}</p>

                      {log.actionTaken && (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg">
                          <strong>Việc đã xử lý:</strong> {log.actionTaken}
                        </div>
                      )}

                      {log.followUpNeeded && (
                        <div className="text-[11px] text-amber-950 bg-amber-50/80 p-2 rounded-lg border border-amber-200/50">
                          <strong>Cần theo dõi tiếp:</strong> {log.followUpNeeded}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 italic">
                    Chưa có nhật ký nào cho phòng {room.code}.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 5: BÁO CÁO VÀ CÔNG VIỆC */}
          {/* ========================================================= */}
          {activeTab === 'reports_tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Báo Cáo Nhanh & Việc Tồn Đọng Phòng {room.code}
                </h4>
                {!isCreatingReport && (
                  <button
                    onClick={() => setIsCreatingReport(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gửi báo cáo nhanh</span>
                  </button>
                )}
              </div>

              {/* Inline Create Report Form */}
              {isCreatingReport && (
                <form
                  onSubmit={handleSaveInlineReport}
                  className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3"
                >
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>Tạo báo cáo nhanh cho phòng {room.code}:</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingReport(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {repPriority === 'urgent' && (
                    <div className="p-2.5 bg-red-100 border border-red-300 rounded text-red-900 text-[11px] flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-red-700 shrink-0" />
                      <span>
                        <strong>Cảnh báo khẩn cấp:</strong> Hãy gọi điện trực tiếp cho Ban giám hiệu hoặc cán bộ y tế!
                      </span>
                    </div>
                  )}

                  {repError && (
                    <div className="p-2 bg-red-100 text-red-800 text-[11px] rounded font-semibold">
                      {repError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Mức độ ưu tiên *</label>
                      <select
                        value={repPriority}
                        onChange={(e) => setRepPriority(e.target.value as ReportPriority)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                      >
                        <option value="normal">Thông thường</option>
                        <option value="urgent">Cần xử lý sớm (Khẩn cấp)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Học sinh liên quan (nếu có)</label>
                      <select
                        value={repStudentId}
                        onChange={(e) => setRepStudentId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
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
                    <label className="font-semibold text-slate-700 block mb-0.5">Tiêu đề báo cáo *</label>
                    <input
                      type="text"
                      required
                      value={repTitle}
                      onChange={(e) => setRepTitle(e.target.value)}
                      placeholder="VD: Em Cường bị sốt / Hỏng vòi nước..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Nội dung chi tiết *</label>
                    <textarea
                      rows={2}
                      required
                      value={repContent}
                      onChange={(e) => setRepContent(e.target.value)}
                      placeholder="Chi tiết diễn biến và biện pháp đã xử lý..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingReport(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold shadow-xs"
                    >
                      Gửi báo cáo
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks Section */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block text-xs">
                  1. Các việc tồn đọng cần tiếp tục xử lý ({roomTasks.length} việc):
                </span>
                <div className="space-y-2">
                  {roomTasks.length > 0 ? (
                    roomTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold text-sm ${
                                t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {t.title}
                            </span>
                            {t.priority === 'urgent' && (
                              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                Khẩn
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{t.description}</p>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Phụ trách: {t.assignedToTeacherName || 'Chưa giao'} • Tạo lúc: {t.createdAt}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => updateTaskStatus(t.id, 'pending')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              t.status === 'pending'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Chờ
                          </button>
                          <button
                            onClick={() => updateTaskStatus(t.id, 'in_progress')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              t.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Đang làm
                          </button>
                          <button
                            onClick={() => updateTaskStatus(t.id, 'completed')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              t.status === 'completed'
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Xong
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic text-center py-2">
                      Hiện không có công việc tồn đọng nào cho phòng này.
                    </div>
                  )}
                </div>
              </div>

              {/* Reports Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block text-xs">
                  2. Lịch sử các báo cáo nhanh ({roomReports.length} báo cáo):
                </span>
                <div className="space-y-2">
                  {roomReports.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              r.priority === 'urgent' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {r.priority === 'urgent' ? 'Khẩn' : 'Thường'}
                          </span>
                          <span className="font-bold text-slate-900">{r.title}</span>
                        </div>
                        <span className="text-slate-400 font-mono">{r.createdAt}</span>
                      </div>
                      <p className="text-slate-700 text-xs">{r.content}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <span>Người báo cáo: {r.reporterName}</span>
                        <span className="font-semibold text-emerald-800">Trạng thái: {r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 6: BÀN GIAO CA */}
          {/* ========================================================= */}
          {activeTab === 'handovers' && (
            <div className="space-y-3">
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                <Send className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Lịch sử bàn giao liên ca ghi nhận đầy đủ hiện trạng sĩ số, sức khỏe học sinh và cơ sở vật chất của phòng {room.code}. Công việc chưa hoàn thành được mang liên tục qua các ca để không bị đứt gãy thông tin.
                </p>
              </div>

              <div className="space-y-3">
                {roomHandovers.length > 0 ? (
                  roomHandovers.map((ho) => {
                    const roomStat = ho.roomStatuses.find((rs) => rs.roomId === room.id);

                    return (
                      <div key={ho.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{ho.code}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                ho.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {ho.status === 'accepted' ? 'Đã tiếp nhận bàn giao' : 'Chờ người nhận xác nhận'}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">{ho.createdAt}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Người giao (Ca trước):</span>
                            <span className="font-bold text-slate-800">{ho.fromTeacherName} ({ho.fromShiftCode})</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Người nhận (Ca sau):</span>
                            <span className="font-bold text-slate-800">{ho.toTeacherName} ({ho.toShiftCode})</span>
                          </div>
                        </div>

                        {/* Room Status inside this handover */}
                        {roomStat && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>Hiện trạng bàn giao phòng:</span>
                              <span className="text-emerald-700">
                                Sĩ số: {roomStat.presentStudents}/{roomStat.totalStudents} em
                                {roomStat.leaveStudents > 0 ? ` (${roomStat.leaveStudents} phép)` : ''}
                              </span>
                            </div>
                            <div className="text-slate-600">
                              <strong>Sức khỏe:</strong> {roomStat.healthNote}
                            </div>
                            <div className="text-slate-600">
                              <strong>Vệ sinh:</strong> {roomStat.hygieneStatus}
                            </div>
                            <div className="text-slate-600">
                              <strong>Cơ sở vật chất:</strong> {roomStat.equipmentStatus}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 italic">
                    Chưa có lịch sử bàn giao nào ghi nhận riêng cho phòng này.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500 hidden sm:block">
            Phòng <strong className="text-slate-800">{room.code}</strong> • Sức chứa {roomStudents.length}/{room.capacity} em
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL CON: SỬA CẤU HÌNH PHÒNG (BGH) */}
      {/* ========================================================= */}
      {isEditingConfig && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Chỉnh Sửa Cấu Hình Phòng {room.code}</h3>
              <button onClick={() => setIsEditingConfig(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {configError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {configError}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên phòng *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sức chứa (em) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Không cố định 8 em</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tầng</label>
                  <select
                    value={editFloor}
                    onChange={(e) => setEditFloor(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value={1}>Tầng 1</option>
                    <option value={2}>Tầng 2</option>
                    <option value={3}>Tầng 3</option>
                    <option value={0}>Chưa gán tầng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dãy nhà</label>
                <select
                  value={editBuilding}
                  onChange={(e) => setEditBuilding(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="U1">Dãy U1</option>
                  <option value="U2">Dãy U2</option>
                  <option value="U3">Dãy U3</option>
                  <option value="U4">Dãy U4</option>
                  <option value="unassigned">Chưa gán dãy/tầng</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingConfig(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CON: THAY ĐỔI 2 GIÁO VIÊN QUẢN LÝ CHÍNH */}
      {/* ========================================================= */}
      {isEditingManagers && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Phân Công 2 Giáo Viên Quản Lý Chính (Phòng {room.code})
              </h3>
              <button onClick={() => setIsEditingManagers(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Khi thay đổi, hệ thống sẽ tự động lưu lại lịch sử phân công người thực hiện và mốc thời gian.
            </p>

            {managerError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {managerError}
              </div>
            )}

            <form onSubmit={handleSaveManagers} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Giáo viên quản lý 1 *</label>
                <select
                  value={manager1Id}
                  onChange={(e) => setManager1Id(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Giáo viên quản lý 2 *</label>
                <select
                  value={manager2Id}
                  onChange={(e) => setManager2Id(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingManagers(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Lưu phân công & ghi lịch sử
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CON: BỔ NHIỆM BAN TỰ QUẢN HỌC SINH */}
      {/* ========================================================= */}
      {isEditingLeaders && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Bổ Nhiệm Ban Tự Quản Phòng {room.code}
              </h3>
              <button onClick={() => setIsEditingLeaders(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Quy tắc kiểm tra: Trưởng phòng và Phó phòng phải là <strong>hai học sinh khác nhau</strong> và <strong>thuộc phòng {room.code}</strong>.
            </p>

            {leaderError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {leaderError}
              </div>
            )}

            <form onSubmit={handleSaveLeaders} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Trưởng phòng</label>
                <select
                  value={leaderId}
                  onChange={(e) => setLeaderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {roomStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.className} - {st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phó phòng</label>
                <select
                  value={viceLeaderId}
                  onChange={(e) => setViceLeaderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {roomStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.className} - {st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingLeaders(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Lưu ban tự quản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CON: THÊM HỌC SINH MỚI VÀO PHÒNG */}
      {/* ========================================================= */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Thêm Học Sinh Vào Phòng {room.code}
              </h3>
              <button onClick={() => setIsAddingStudent(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Hiện có {roomStudents.length} / {room.capacity} em. Hệ thống sẽ kiểm tra trùng mã học sinh và chặn nếu phòng đã kín chỗ.
            </p>

            {addStudentError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {addStudentError}
              </div>
            )}

            <form onSubmit={handleSaveNewStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="VD: Vi Văn An"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Giới tính</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Lớp</label>
                  <input
                    type="text"
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Năm sinh</label>
                  <input
                    type="number"
                    value={newStudentBirthYear}
                    onChange={(e) => setNewStudentBirthYear(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Giáo viên chủ nhiệm</label>
                <input
                  type="text"
                  value={newStudentHomeroom}
                  onChange={(e) => setNewStudentHomeroom(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Lưu học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CON: CHUYỂN PHÒNG CHO HỌC SINH */}
      {/* ========================================================= */}
      {transferringStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Chuyển Phòng Học Sinh</h3>
            <p className="text-xs text-slate-500">
              Học sinh: <strong>{transferringStudent.fullName}</strong> ({transferringStudent.code})
            </p>

            <form onSubmit={handleConfirmTransfer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn phòng chuyển đến:</label>
                <select
                  value={transferTargetRoomId}
                  onChange={(e) => setTransferTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {rooms.map((r) => {
                    const count = students.filter((s) => s.roomId === r.id).length;
                    const isCurrent = r.id === transferringStudent.roomId;
                    const isFull = count >= r.capacity && !isCurrent;

                    return (
                      <option key={r.id} value={r.id} disabled={isFull}>
                        {r.code} - {r.name} ({count}/{r.capacity} chỗ) {isCurrent ? '(Hiện tại)' : ''}{' '}
                        {isFull ? '- ĐÃ KÍN' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Xác nhận chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
