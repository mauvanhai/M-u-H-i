import React, { useState } from 'react';
import {
  DoorClosed,
  Building,
  Layers,
  Plus,
  Search,
  Filter,
  Users,
  Shield,
  Phone,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Clock,
  X,
  ChevronRight,
  Home,
  Lock,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Room, Student } from '../../types';
import { canEditRoom, canViewRoom } from '../../services/permissions';

interface RoomsTabProps {
  onOpenRoomDetail: (roomId: string) => void;
  onOpenQuickLogModal: (roomId: string) => void;
  onOpenQuickReportModal: (roomId: string) => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  onOpenRoomDetail,
  onOpenQuickLogModal,
  onOpenQuickReportModal,
}) => {
  const {
    rooms,
    students,
    teachers,
    shifts,
    currentUser,
    currentShift,
    pendingTasks,
    addRoom,
    updateRoom,
    deleteRoom,
  } = useApp();

  if (!currentUser) return null;

  // View state: 'hierarchy' (Dãy nhà -> Tầng -> Phòng) vs 'flat' (Tất cả phòng dạng lưới)
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');

  // Hierarchy Navigation Level:
  // selectedBlock: null (Tổng quan 4 dãy U1-U4) | 'U1' | 'U2' | 'U3' | 'U4' | 'unassigned'
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  // selectedFloor: null (Xem 3 tầng của dãy) | 1 | 2 | 3 | 0 (0 = chưa gán)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterEducationLevel, setFilterEducationLevel] = useState<string>('all'); // 'all' | 'tieu_hoc' | 'thcs' | 'both'
  const [filterManagerTeacher, setFilterManagerTeacher] = useState<string>('all');
  const [filterDutyTeacher, setFilterDutyTeacher] = useState<string>('all');
  const [onlyMyRooms, setOnlyMyRooms] = useState<boolean>(false);

  // Edit / Add Room modal state (BGH only)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState(8);
  const [formBuilding, setFormBuilding] = useState<'U1' | 'U2' | 'U3' | 'U4' | 'unassigned'>('U1');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<'active' | 'maintenance' | 'empty'>('active');
  const [formManager1, setFormManager1] = useState('');
  const [formManager2, setFormManager2] = useState('');
  const [formLeader, setFormLeader] = useState('');
  const [formViceLeader, setFormViceLeader] = useState('');
  const [formFacilityNotes, setFormFacilityNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Warning modal when unauthorized user tries to open a room
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const isBgh = canEditRoom(currentUser.role);
  const isGiaoVien = currentUser.role === 'giao_vien';
  const isTruongPhong = currentUser.role === 'truong_phong';

  // Helper check if current user can view a room
  const checkRoomPermission = (room: Room): boolean => {
    return canViewRoom(currentUser, room, currentShift, shifts);
  };

  // Safe handler to open room detail
  const handleRoomClick = (room: Room) => {
    if (!checkRoomPermission(room)) {
      setAccessDeniedMessage(
        `Thầy/Cô không được phân công quản lý hoặc trực ca tại phòng ${room.code} (${room.name}). Theo phân quyền, chỉ Giáo viên quản lý chính và Giáo viên trực ca được phân công mới có thể truy cập.`
      );
      return;
    }
    onOpenRoomDetail(room.id);
  };

  // 4 Buildings metadata
  const BLOCKS = [
    { id: 'U1', name: 'Dãy U1', description: 'Gồm 3 tầng (Tầng 1, Tầng 2, Tầng 3)' },
    { id: 'U2', name: 'Dãy U2', description: 'Gồm 3 tầng (Tầng 1, Tầng 2, Tầng 3)' },
    { id: 'U3', name: 'Dãy U3', description: 'Gồm 3 tầng (Tầng 1, Tầng 2, Tầng 3)' },
    { id: 'U4', name: 'Dãy U4', description: 'Gồm 3 tầng (Tầng 1, Tầng 2, Tầng 3)' },
  ];

  // Calculate statistics per block
  const getBlockStats = (blockId: string) => {
    const blockRooms = rooms.filter((r) => r.building === blockId);
    const roomIds = blockRooms.map((r) => r.id);
    const blockStudents = students.filter((s) => roomIds.includes(s.roomId));
    const unfinishedTasks = pendingTasks.filter(
      (t) => roomIds.includes(t.roomId) && t.status !== 'completed'
    );
    const tieuHocCount = blockStudents.filter((s) => s.educationLevel === 'tieu_hoc').length;
    const thcsCount = blockStudents.filter((s) => s.educationLevel === 'thcs').length;

    // Check how many rooms in this block the current user can access
    const accessibleRooms = blockRooms.filter(checkRoomPermission);

    return {
      totalRooms: blockRooms.length,
      accessibleRoomsCount: accessibleRooms.length,
      totalStudents: blockStudents.length,
      unfinishedTasksCount: unfinishedTasks.length,
      tieuHocCount,
      thcsCount,
      rooms: blockRooms,
    };
  };

  // Check if there are unassigned rooms
  const unassignedRooms = rooms.filter(
    (r) => r.building === 'unassigned' || !r.building || r.floor === 0
  );
  const unassignedAccessible = unassignedRooms.filter(checkRoomPermission);

  // Calculate statistics per floor within selected block
  const getFloorStats = (blockId: string, floorNum: number) => {
    const floorRooms = rooms.filter((r) => r.building === blockId && r.floor === floorNum);
    const roomIds = floorRooms.map((r) => r.id);
    const floorStudents = students.filter((s) => roomIds.includes(s.roomId));
    const unfinishedTasks = pendingTasks.filter(
      (t) => roomIds.includes(t.roomId) && t.status !== 'completed'
    );
    const tieuHocCount = floorStudents.filter((s) => s.educationLevel === 'tieu_hoc').length;
    const thcsCount = floorStudents.filter((s) => s.educationLevel === 'thcs').length;
    const accessibleRooms = floorRooms.filter(checkRoomPermission);

    return {
      totalRooms: floorRooms.length,
      accessibleRoomsCount: accessibleRooms.length,
      totalStudents: floorStudents.length,
      unfinishedTasksCount: unfinishedTasks.length,
      tieuHocCount,
      thcsCount,
      rooms: floorRooms,
    };
  };

  // Filter rooms for Flat view or Level 2 floor view
  const getFilteredRooms = () => {
    return rooms.filter((r) => {
      // 1. Search Query
      const matchesSearch =
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.building.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Block Filter
      let matchesBlock = true;
      if (filterBlock !== 'all') {
        matchesBlock = r.building === filterBlock;
      }

      // 3. Floor Filter
      let matchesFloor = true;
      if (filterFloor !== 'all') {
        matchesFloor = r.floor === Number(filterFloor);
      }

      // 4. Education Level Filter
      let matchesEdu = true;
      if (filterEducationLevel !== 'all') {
        const roomSts = students.filter((s) => s.roomId === r.id);
        const hasTieuHoc = roomSts.some((s) => s.educationLevel === 'tieu_hoc');
        const hasThcs = roomSts.some((s) => s.educationLevel === 'thcs');

        if (filterEducationLevel === 'tieu_hoc') {
          matchesEdu = hasTieuHoc;
        } else if (filterEducationLevel === 'thcs') {
          matchesEdu = hasThcs;
        } else if (filterEducationLevel === 'both') {
          matchesEdu = hasTieuHoc && hasThcs;
        }
      }

      // 5. Manager Teacher Filter
      let matchesManager = true;
      if (filterManagerTeacher !== 'all') {
        matchesManager = r.managerTeacherIds.includes(filterManagerTeacher);
      }

      // 6. Duty Teacher Filter
      let matchesDuty = true;
      if (filterDutyTeacher !== 'all') {
        const dutyAssignment = currentShift?.assignments.find((a) =>
          a.roomIds.includes(r.id)
        );
        matchesDuty = dutyAssignment?.teacherId === filterDutyTeacher;
      }

      // 7. My Rooms toggle
      const matchesMyRoom = !onlyMyRooms || checkRoomPermission(r);

      return (
        matchesSearch &&
        matchesBlock &&
        matchesFloor &&
        matchesEdu &&
        matchesManager &&
        matchesDuty &&
        matchesMyRoom
      );
    });
  };

  // Open Add Room Modal
  const handleOpenAddModal = (presetBlock?: string, presetFloor?: number) => {
    setEditingRoom(null);
    const b = (presetBlock as any) || (selectedBlock && selectedBlock !== 'unassigned' ? selectedBlock : 'U1');
    const f = presetFloor || selectedFloor || 1;
    setFormCode(`${b}-T${f}-P0${rooms.length + 1}`);
    setFormName(`Phòng ${rooms.length + 1}`);
    setFormCapacity(8);
    setFormBuilding(b);
    setFormFloor(f);
    setFormStatus('active');
    setFormManager1(teachers.filter((t) => t.role === 'giao_vien')[0]?.id || teachers[0]?.id || '');
    setFormManager2(teachers.filter((t) => t.role === 'giao_vien')[1]?.id || teachers[1]?.id || '');
    setFormLeader('');
    setFormViceLeader('');
    setFormFacilityNotes('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Room Modal
  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormCode(room.code);
    setFormName(room.name);
    setFormCapacity(room.capacity);
    setFormBuilding((room.building as any) || 'unassigned');
    setFormFloor(room.floor || 0);
    setFormStatus(room.status || 'active');
    setFormManager1(room.managerTeacherIds[0] || '');
    setFormManager2(room.managerTeacherIds[1] || '');
    setFormLeader(room.leaderStudentId || '');
    setFormViceLeader(room.viceLeaderStudentId || '');
    setFormFacilityNotes(room.facilityNotes || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Save Room (Add or Update)
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim() || !formName.trim()) {
      setFormError('Vui lòng nhập đầy đủ mã phòng và tên phòng.');
      return;
    }

    if (formCapacity <= 0) {
      setFormError('Sức chứa phòng phải lớn hơn 0.');
      return;
    }

    if (teachers.length >= 2) {
      if (!formManager1 || !formManager2) {
        setFormError('Bắt buộc phải chọn đủ 2 giáo viên quản lý chính.');
        return;
      }

      if (formManager1 === formManager2) {
        setFormError('Hai giáo viên quản lý chính phải là 2 thầy/cô khác nhau.');
        return;
      }
    }

    if (formLeader && formViceLeader && formLeader === formViceLeader) {
      setFormError('Trưởng phòng và Phó phòng không được là cùng một học sinh.');
      return;
    }

    if (editingRoom) {
      const res = updateRoom({
        ...editingRoom,
        code: formCode.trim(),
        name: formName.trim(),
        capacity: Number(formCapacity),
        building: formBuilding,
        floor: Number(formFloor),
        status: formStatus,
        managerTeacherIds: [formManager1, formManager2],
        leaderStudentId: formLeader || undefined,
        viceLeaderStudentId: formViceLeader || undefined,
        facilityNotes: formFacilityNotes.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi cập nhật phòng.');
        return;
      }
    } else {
      const res = addRoom({
        code: formCode.trim(),
        name: formName.trim(),
        capacity: Number(formCapacity),
        building: formBuilding,
        floor: Number(formFloor),
        status: formStatus,
        managerTeacherIds: [formManager1, formManager2],
        leaderStudentId: formLeader || undefined,
        viceLeaderStudentId: formViceLeader || undefined,
        facilityNotes: formFacilityNotes.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi thêm phòng.');
        return;
      }
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!window.confirm('Thầy/Cô có chắc chắn muốn xóa phòng này không? Các dữ liệu liên quan sẽ được cập nhật.')) return;
    const res = deleteRoom(roomId);
    if (!res.success) {
      alert(res.error);
    }
  };

  // Helper text for room status
  const getStatusBadge = (status: Room['status']) => {
    if (status === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-700" />
          <span>Đang bảo trì</span>
        </span>
      );
    }
    if (status === 'empty') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Phòng trống / Dự phòng</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
        <CheckCircle className="w-3 h-3 text-emerald-700" />
        <span>Đang hoạt động</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Khu Nội Trú Mẫu Sơn
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cấu trúc thực tế: <strong>Dãy nhà (U1, U2, U3, U4) → Tầng (1, 2, 3) → Phòng → Học sinh</strong>.
              Quản lý học sinh 2 cấp (Tiểu học & THCS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => {
                  setViewMode('hierarchy');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'hierarchy'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Theo Cấu trúc Dãy/Tầng</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('flat');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'flat'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Tất cả phòng & Bộ lọc</span>
              </button>
            </div>

            {/* Quick Filter: My Rooms */}
            {isGiaoVien && (
              <button
                onClick={() => setOnlyMyRooms(!onlyMyRooms)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  onlyMyRooms
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {onlyMyRooms ? '✓ Đang lọc: Phòng phân công' : 'Phòng tôi phụ trách'}
              </button>
            )}

            {/* Add room (BGH only) */}
            {isBgh && (
              <button
                onClick={() => handleOpenAddModal()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm phòng mới</span>
              </button>
            )}
          </div>
        </div>

        {/* BREADCRUMBS NAVIGATION (Đường dẫn điều hướng: Khu nội trú → U1 → Tầng 1 → Phòng …) */}
        {viewMode === 'hierarchy' && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-600 pt-3 border-t border-slate-100 flex-wrap">
            <button
              onClick={() => {
                setSelectedBlock(null);
                setSelectedFloor(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                !selectedBlock
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Khu nội trú</span>
            </button>

            {selectedBlock && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <button
                  onClick={() => setSelectedFloor(null)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedFloor === null
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedBlock === 'unassigned' ? 'Chưa gán dãy/tầng' : `Dãy ${selectedBlock}`}
                </button>
              </>
            )}

            {selectedBlock && selectedFloor !== null && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {selectedFloor === 0 ? 'Chưa gán tầng' : `Tầng ${selectedFloor}`}
                </span>
              </>
            )}

            {selectedBlock && (
              <button
                onClick={() => {
                  if (selectedFloor !== null) {
                    setSelectedFloor(null);
                  } else {
                    setSelectedBlock(null);
                  }
                }}
                className="ml-auto text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}
          </nav>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER TOOLBAR (Dãy nhà, Tầng, Cấp học, GVQL, GVT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            Bộ lọc khu nội trú:
          </span>
          {(searchQuery ||
            filterBlock !== 'all' ||
            filterFloor !== 'all' ||
            filterEducationLevel !== 'all' ||
            filterManagerTeacher !== 'all' ||
            filterDutyTeacher !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterBlock('all');
                setFilterFloor('all');
                setFilterEducationLevel('all');
                setFilterManagerTeacher('all');
                setFilterDutyTeacher('all');
              }}
              className="text-emerald-700 hover:underline text-[11px]"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã phòng, tên phòng (vd: U1-T1-P01, Sao Mai)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Filter Dãy nhà */}
          <div>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Tất cả dãy nhà</option>
              <option value="U1">Dãy U1</option>
              <option value="U2">Dãy U2</option>
              <option value="U3">Dãy U3</option>
              <option value="U4">Dãy U4</option>
              <option value="unassigned">Chưa gán dãy/tầng</option>
            </select>
          </div>

          {/* Filter Tầng */}
          <div>
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Tất cả các tầng</option>
              <option value="1">Tầng 1</option>
              <option value="2">Tầng 2</option>
              <option value="3">Tầng 3</option>
            </select>
          </div>

          {/* Filter Cấp học */}
          <div>
            <select
              value={filterEducationLevel}
              onChange={(e) => setFilterEducationLevel(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
            >
              <option value="all">Cấp học: Tất cả</option>
              <option value="tieu_hoc">Có học sinh Tiểu học</option>
              <option value="thcs">Có học sinh THCS</option>
              <option value="both">Hỗn hợp cả 2 cấp</option>
            </select>
          </div>

          {/* Filter GVQL chính */}
          <div>
            <select
              value={filterManagerTeacher}
              onChange={(e) => setFilterManagerTeacher(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Tất cả GVQL chính</option>
              {teachers
                .filter((t) => t.role === 'giao_vien' || t.role === 'quan_sinh')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    GVQL: {t.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Note on Data State & Permission Notice */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/60 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {rooms.length === 0 ? (
              <strong>Hệ thống chưa có phòng. Ban giám hiệu bấm "Thêm phòng mới" để bắt đầu thiết lập.</strong>
            ) : (
              <span>Cấu trúc thực tế: 4 Dãy (U1 - U4), mỗi dãy 3 tầng. Số phòng hiển thị tính từ dữ liệu thực đã khai báo.</span>
            )}
          </span>
        </span>
        {isGiaoVien && (
          <span className="font-semibold text-emerald-800 shrink-0">
            Phạm vi phân công: Bạn chỉ xem và thao tác tại các phòng được phân công (GVQL hoặc GVT).
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: HIERARCHY LEVEL 0 (4 THẺ DÃY NHÀ U1, U2, U3, U4) */}
      {/* ========================================================================= */}
      {viewMode === 'hierarchy' && selectedBlock === null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-700" />
              Các Dãy Nhà Nội Trú (4 Dãy: U1, U2, U3, U4)
            </h3>
            <span className="text-xs text-slate-500">
              Chọn dãy để xem 3 tầng
            </span>
          </div>

          {/* 4 Block Cards: Responsive for mobile (stacked vertically and easy to tap) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BLOCKS.map((block) => {
              const stats = getBlockStats(block.id);
              return (
                <div
                  key={block.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-lg flex items-center justify-center shadow-xs">
                        {block.id}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        3 Tầng (T1 - T3)
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{block.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{block.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Số phòng đã khai báo:</span>
                        <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                          {stats.totalRooms} phòng
                        </span>
                        {isGiaoVien && (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            (Được xem: {stats.accessibleRoomsCount})
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Số học sinh:</span>
                        <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                          {stats.totalStudents} em
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {stats.thcsCount} THCS • {stats.tieuHocCount} TH
                        </span>
                      </div>
                    </div>

                    {/* Pending tasks in this block */}
                    <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                        Việc chưa hoàn thành:
                      </span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          stats.unfinishedTasksCount > 0
                            ? 'bg-amber-100 text-amber-900 font-extrabold'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {stats.unfinishedTasksCount} việc
                      </span>
                    </div>
                  </div>

                  {/* Actions: Large touch-friendly button on mobile */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedBlock(block.id);
                        setSelectedFloor(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <span>Xem 3 tầng của {block.id}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {isBgh && (
                      <button
                        onClick={() => handleOpenAddModal(block.id, 1)}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-emerald-700" />
                        <span>Khai báo phòng vào {block.id}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section for Unassigned rooms (Chưa gán dãy/tầng) if any exist */}
          {unassignedRooms.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">
                      Phòng chưa xác định vị trí thực tế ({unassignedRooms.length} phòng được đánh dấu "Chưa gán dãy/tầng")
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Ban giám hiệu có thể gán dãy nhà (U1 - U4) và tầng (1 - 3) cụ thể cho các phòng này.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBlock('unassigned');
                    setSelectedFloor(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition shrink-0"
                >
                  Xem danh sách chưa gán ({unassignedRooms.length})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT: HIERARCHY LEVEL 1 (XEM 3 TẦNG CỦA DÃY ĐÃ CHỌN) */}
      {/* ========================================================================= */}
      {viewMode === 'hierarchy' && selectedBlock !== null && selectedFloor === null && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-emerald-950">
                  {selectedBlock === 'unassigned' ? 'Danh sách Chưa Gán Dãy/Tầng' : `Dãy Nhà ${selectedBlock}`}
                </h3>
                <span className="text-xs font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                  {selectedBlock === 'unassigned' ? 'Chưa phân vị trí' : '3 Tầng: Tầng 1, Tầng 2, Tầng 3'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Chọn một tầng bên dưới để xem danh sách phòng chi tiết, hoặc thêm phòng mới vào tầng.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chọn Dãy khác</span>
              </button>
            </div>
          </div>

          {selectedBlock !== 'unassigned' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((floorNum) => {
                const floorStats = getFloorStats(selectedBlock, floorNum);
                return (
                  <div
                    key={floorNum}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-extrabold text-base flex items-center justify-center shadow-xs">
                            T{floorNum}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">Tầng {floorNum}</h4>
                            <p className="text-[11px] text-slate-500">Dãy {selectedBlock}</p>
                          </div>
                        </div>

                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {floorStats.totalRooms} phòng
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">Số học sinh:</span>
                          <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                            {floorStats.totalStudents} em
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {floorStats.thcsCount} THCS • {floorStats.tieuHocCount} TH
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">Việc tồn đọng:</span>
                          <span
                            className={`text-xs font-bold mt-0.5 block ${
                              floorStats.unfinishedTasksCount > 0 ? 'text-amber-800' : 'text-emerald-700'
                            }`}
                          >
                            {floorStats.unfinishedTasksCount} việc
                          </span>
                        </div>
                      </div>

                      {/* Preview Room Codes */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Phòng đã khai báo:
                        </span>
                        {floorStats.rooms.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {floorStats.rooms.map((r) => {
                              const canView = checkRoomPermission(r);
                              return (
                                <span
                                  key={r.id}
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                    canView
                                      ? 'bg-slate-100 text-slate-800 border-slate-200'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}
                                  title={canView ? r.name : 'Không thuộc phạm vi phân công'}
                                >
                                  {r.code} {!canView && '🔒'}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Chưa có phòng nào được khai báo ở tầng này.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedFloor(floorNum)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <span>Xem các phòng Tầng {floorNum}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {isBgh && (
                        <button
                          onClick={() => handleOpenAddModal(selectedBlock, floorNum)}
                          className="w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                          <span>Thêm phòng vào Tầng {floorNum}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Unassigned rooms list */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                Dưới đây là các phòng chưa được gán Dãy nhà và Tầng cụ thể trong hệ thống. Ban giám hiệu có thể chỉnh sửa để đưa vào đúng Dãy U1 - U4 và Tầng 1 - 3.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-2xl border border-amber-300 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          {room.code}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">{room.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Chưa gán dãy/tầng
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {room.facilityNotes || 'Chưa có ghi chú vị trí'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      {isBgh && (
                        <button
                          onClick={() => handleOpenEditModal(room)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Gán Dãy & Tầng</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleRoomClick(room)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MAIN CONTENT: HIERARCHY LEVEL 2 (CÁC PHÒNG TRONG TẦNG ĐÃ CHỌN) */}
      {/* OR FLAT LIST MODE (TẤT CẢ PHÒNG THEO BỘ LỌC) */}
      {/* ========================================================================= */}
      {((viewMode === 'hierarchy' && selectedBlock !== null && selectedFloor !== null) ||
        viewMode === 'flat') && (
        <div className="space-y-4">
          {viewMode === 'hierarchy' && selectedBlock && selectedFloor !== null && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
                  {selectedBlock}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Dãy {selectedBlock} → Tầng {selectedFloor}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Danh sách phòng thuộc Tầng {selectedFloor} của Dãy {selectedBlock}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFloor(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Xem tầng khác</span>
                </button>

                {isBgh && (
                  <button
                    onClick={() => handleOpenAddModal(selectedBlock, selectedFloor)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm phòng tại đây</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Room Cards Grid */}
          {(() => {
            const displayRooms =
              viewMode === 'hierarchy' && selectedBlock && selectedFloor !== null
                ? rooms.filter(
                    (r) =>
                      r.building === selectedBlock &&
                      r.floor === selectedFloor &&
                      (!onlyMyRooms || checkRoomPermission(r))
                  )
                : getFilteredRooms();

            if (displayRooms.length === 0) {
              return (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <DoorClosed className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Không tìm thấy phòng phù hợp</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {viewMode === 'hierarchy'
                      ? 'Tầng này chưa có phòng nào được khai báo.'
                      : 'Vui lòng điều chỉnh lại từ khóa hoặc bộ lọc tìm kiếm.'}
                  </p>
                  {isBgh && viewMode === 'hierarchy' && selectedBlock && selectedFloor !== null && (
                    <button
                      onClick={() => handleOpenAddModal(selectedBlock, selectedFloor)}
                      className="mt-3 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                    >
                      Khai báo phòng mới tại Tầng {selectedFloor}
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayRooms.map((room) => {
                  const roomStudents = students.filter((s) => s.roomId === room.id);
                  const presentCount = roomStudents.filter((s) => s.boardingStatus === 'present').length;
                  const sickCount = roomStudents.filter((s) => s.boardingStatus === 'sick').length;
                  const onLeaveCount = roomStudents.filter((s) => s.boardingStatus === 'on_leave').length;

                  // Education level statistics calculated directly from actual student data
                  const tieuHocStudents = roomStudents.filter((s) => s.educationLevel === 'tieu_hoc');
                  const thcsStudents = roomStudents.filter((s) => s.educationLevel === 'thcs');

                  const leader = roomStudents.find((s) => s.id === room.leaderStudentId);
                  const viceLeader = roomStudents.find((s) => s.id === room.viceLeaderStudentId);

                  const manager1 = teachers.find((t) => t.id === room.managerTeacherIds[0]);
                  const manager2 = teachers.find((t) => t.id === room.managerTeacherIds[1]);

                  const dutyAssignment = currentShift?.assignments.find((a) => a.roomIds.includes(room.id));

                  const isOverCapacity = roomStudents.length > room.capacity;
                  const isFull = roomStudents.length === room.capacity;

                  const isMyManagedRoom = room.managerTeacherIds.includes(currentUser.id);
                  const isMyDutyRoom = dutyAssignment?.teacherId === currentUser.id;
                  const canView = checkRoomPermission(room);

                  // Pending tasks for this room
                  const unfinishedTasks = pendingTasks.filter(
                    (t) => t.roomId === room.id && t.status !== 'completed'
                  );
                  const urgentCount = unfinishedTasks.filter((t) => t.priority === 'urgent').length;

                  return (
                    <div
                      key={room.id}
                      className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                        !canView
                          ? 'border-slate-200 bg-slate-50/70 opacity-90'
                          : isOverCapacity
                          ? 'border-red-300 ring-2 ring-red-100'
                          : isMyManagedRoom || isMyDutyRoom
                          ? 'border-emerald-300 ring-2 ring-emerald-50'
                          : 'border-slate-200/80'
                      }`}
                    >
                      {/* Card Header: Uses Text Not Just Colors */}
                      <div className="p-4 sm:p-5 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                                {room.code}
                              </h3>
                              <span className="font-semibold text-slate-700 text-xs sm:text-sm truncate">
                                {room.name}
                              </span>
                              {!canView && (
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>Không thuộc phân công</span>
                                </span>
                              )}
                              {isMyManagedRoom && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  GVQL chính
                                </span>
                              )}
                              {isMyDutyRoom && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  GVT ca hôm nay
                                </span>
                              )}
                            </div>

                            {/* Location by Text: Dãy nhà + Tầng */}
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                              {room.building === 'unassigned' || !room.building ? (
                                <span className="text-amber-800 font-bold">Chưa gán dãy/tầng</span>
                              ) : (
                                <span>Dãy {room.building} • Tầng {room.floor || 'Chưa gán'}</span>
                              )}
                            </p>
                          </div>

                          {/* Capacity Tag with Text */}
                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                                isOverCapacity
                                  ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                                  : isFull
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {roomStudents.length} / {room.capacity} em
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              {isOverCapacity ? 'VƯỢT SỨC CHỨA' : isFull ? 'Đã đủ chỗ' : 'Còn chỗ trống'}
                            </p>
                          </div>
                        </div>

                        {/* Text Status Badge: Đang hoạt động / Bảo trì / Trống */}
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <div>{getStatusBadge(room.status)}</div>

                          {/* Thành phần Cấp học trong phòng (Text & Tag) */}
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            <span className="text-slate-500">Cấp học:</span>
                            {roomStudents.length === 0 ? (
                              <span className="text-slate-400 italic">Chưa có học sinh</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {thcsStudents.length > 0 && (
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {thcsStudents.length} THCS
                                  </span>
                                )}
                                {tieuHocStudents.length > 0 && (
                                  <span className="bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {tieuHocStudents.length} Tiểu học
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 space-y-3 text-xs flex-1">
                        {/* 2 Giáo viên quản lý chính */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="font-bold text-[10px] text-slate-600 uppercase tracking-wider block mb-1">
                            Hai Giáo viên Quản lý chính:
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-slate-800">
                              <span className="font-semibold truncate">1. {manager1?.name || 'Chưa phân công'}</span>
                              <span className="text-[11px] text-slate-500 shrink-0">{manager1?.phone}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-800">
                              <span className="font-semibold truncate">2. {manager2?.name || 'Chưa phân công'}</span>
                              <span className="text-[11px] text-slate-500 shrink-0">{manager2?.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ban cán sự học sinh: Trưởng phòng & Phó phòng */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-500 block font-medium">Trưởng phòng (HS):</span>
                            <span className="font-bold text-slate-800 truncate block mt-0.5">
                              {leader ? leader.fullName : 'Chưa chỉ định'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {leader ? `${leader.className} (${leader.educationLevel === 'tieu_hoc' ? 'TH' : 'THCS'})` : ''}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-500 block font-medium">Phó phòng (HS):</span>
                            <span className="font-bold text-slate-800 truncate block mt-0.5">
                              {viceLeader ? viceLeader.fullName : 'Chưa chỉ định'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {viceLeader ? `${viceLeader.className} (${viceLeader.educationLevel === 'tieu_hoc' ? 'TH' : 'THCS'})` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Giáo viên trực ca hôm nay */}
                        <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-900 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              Giáo viên trực ca:
                            </span>
                            <span className="font-extrabold text-amber-950">
                              {dutyAssignment ? dutyAssignment.teacherName : 'Chưa phân công ca'}
                            </span>
                          </div>
                          {currentShift && dutyAssignment ? (
                            <div className="text-[11px] text-amber-800 flex items-center justify-between pt-0.5 border-t border-amber-200/50">
                              <span>Ca trực: {currentShift.code}</span>
                              <span className="font-mono text-[10px]">24h liên tục</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 italic">Hiện không có ca trực hoạt động</div>
                          )}
                        </div>

                        {/* Công việc chưa hoàn thành */}
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            unfinishedTasks.length > 0
                              ? urgentCount > 0
                                ? 'bg-red-50/90 border-red-200 text-red-900'
                                : 'bg-amber-50/80 border-amber-200 text-amber-900'
                              : 'bg-emerald-50/60 border-emerald-200/60 text-emerald-800'
                          }`}
                        >
                          <span className="font-semibold flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Việc chưa hoàn thành:
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              unfinishedTasks.length > 0
                                ? urgentCount > 0
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-500 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {unfinishedTasks.length} việc {urgentCount > 0 ? `(${urgentCount} khẩn)` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 sm:px-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => handleRoomClick(room)}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition ${
                            canView
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          {canView ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{canView ? 'Chi tiết phòng' : 'Không có quyền'}</span>
                        </button>

                        {canView && (
                          <>
                            <button
                              onClick={() => onOpenQuickLogModal(room.id)}
                              title="Ghi nhật ký ca cho phòng này"
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <FileText className="w-4 h-4 text-emerald-700" />
                            </button>

                            <button
                              onClick={() => onOpenQuickReportModal(room.id)}
                              title="Báo cáo nhanh cho phòng này"
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </button>
                          </>
                        )}

                        {isBgh && (
                          <button
                            onClick={() => handleOpenEditModal(room)}
                            title="Chỉnh sửa cấu hình phòng"
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: ADD / EDIT ROOM (BGH ONLY) */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-700" />
                <span>{editingRoom ? `Cấu Hình Phòng ${editingRoom.code}` : 'Thêm Phòng Nội Trú Mới'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoom} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã phòng duy nhất *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: U1-T1-P01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Đề xuất: U1-T1-P01</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên/Số phòng thực tế *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Phòng Sao Mai hoặc P.101"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Theo bảng tên thực tế</span>
                </div>
              </div>

              {/* Dãy nhà, Tầng, Sức chứa, Trạng thái */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dãy nhà *</label>
                  <select
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="U1">Dãy U1</option>
                    <option value="U2">Dãy U2</option>
                    <option value="U3">Dãy U3</option>
                    <option value="U4">Dãy U4</option>
                    <option value="unassigned">Chưa gán dãy</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tầng *</label>
                  <select
                    value={formFloor}
                    onChange={(e) => setFormFloor(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value={1}>Tầng 1</option>
                    <option value={2}>Tầng 2</option>
                    <option value={3}>Tầng 3</option>
                    <option value={0}>Chưa gán tầng</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sức chứa *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trạng thái</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="empty">Phòng trống</option>
                  </select>
                </div>
              </div>

              {/* 2 Main Managing Teachers */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                <span className="font-bold text-emerald-950 block">Phân công 2 Giáo viên Quản lý chính *:</span>
                <p className="text-[11px] text-emerald-800">
                  Mỗi phòng bắt buộc có đủ 2 giáo viên phụ trách tiếp nhận thông tin, kết nối phụ huynh và GVCN.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Giáo viên quản lý 1 *
                    </label>
                    <select
                      value={formManager1}
                      onChange={(e) => setFormManager1(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Chọn giáo viên 1 --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Giáo viên quản lý 2 *
                    </label>
                    <select
                      value={formManager2}
                      onChange={(e) => setFormManager2(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Chọn giáo viên 2 --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.title})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ban cán sự học sinh trong phòng */}
              {editingRoom && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="font-bold text-slate-800 block">Ban cán sự tự quản (Học sinh trong phòng):</span>
                  <p className="text-[11px] text-slate-500">
                    Trưởng phòng và Phó phòng phải là 2 học sinh khác nhau đang ở phòng này.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Trưởng phòng</label>
                      <select
                        value={formLeader}
                        onChange={(e) => setFormLeader(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">-- Chọn trưởng phòng --</option>
                        {students
                          .filter((s) => s.roomId === editingRoom.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.className})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Phó phòng</label>
                      <select
                        value={formViceLeader}
                        onChange={(e) => setFormViceLeader(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">-- Chọn phó phòng --</option>
                        {students
                          .filter((s) => s.roomId === editingRoom.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.className})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Facility notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú cơ sở vật chất</label>
                <textarea
                  rows={2}
                  value={formFacilityNotes}
                  onChange={(e) => setFormFacilityNotes(e.target.value)}
                  placeholder="VD: Số giường tầng, quạt trần, tủ cá nhân..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {editingRoom && isBgh && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(editingRoom.id)}
                    className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa phòng</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                  >
                    {editingRoom ? 'Lưu thay đổi' : 'Tạo phòng'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. WARNING MODAL: ACCESS DENIED */}
      {/* ========================================================================= */}
      {accessDeniedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Không có quyền truy cập</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {accessDeniedMessage}
              </p>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
