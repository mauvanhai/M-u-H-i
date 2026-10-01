import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  DoorClosed,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  ArrowRightLeft,
  CheckCircle,
  HeartPulse,
  UserCheck,
  Building,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, EducationLevel } from '../../types';
import { canManageStudents } from '../../services/permissions';

function detectEducationLevel(className: string): EducationLevel {
  const match = className.match(/\d+/);
  if (match) {
    const grade = parseInt(match[0], 10);
    if (grade <= 5) return 'tieu_hoc';
    return 'thcs';
  }
  return 'thcs';
}

export const StudentsTab: React.FC = () => {
  const {
    students,
    rooms,
    currentUser,
    addStudent,
    updateStudent,
    deleteStudent,
    changeStudentRoom,
  } = useApp();

  if (!currentUser) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterEducationLevel, setFilterEducationLevel] = useState<string>('all'); // 'all' | 'tieu_hoc' | 'thcs'

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Transfer room modal
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('');

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formGender, setFormGender] = useState<'nam' | 'nu'>('nam');
  const [formBirthYear, setFormBirthYear] = useState(2013);
  const [formClassName, setFormClassName] = useState('Lớp 6A');
  const [formEducationLevel, setFormEducationLevel] = useState<EducationLevel>('thcs');
  const [formRoomId, setFormRoomId] = useState(rooms[0]?.id || '');
  const [formHomeroomTeacher, setFormHomeroomTeacher] = useState('Thầy Hoàng Văn Bách');
  const [formRoleInRoom, setFormRoleInRoom] = useState<'leader' | 'vice_leader' | 'member'>('member');
  const [formBoardingStatus, setFormBoardingStatus] = useState<Student['boardingStatus']>('present');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = canManageStudents(currentUser.role);

  // Statistics
  const totalStudents = students.length;
  const tieuHocCount = students.filter((s) => s.educationLevel === 'tieu_hoc').length;
  const thcsCount = students.filter((s) => s.educationLevel === 'thcs').length;
  const presentCount = students.filter((s) => s.boardingStatus === 'present').length;
  const sickCount = students.filter((s) => s.boardingStatus === 'sick').length;
  const onLeaveCount = students.filter((s) => s.boardingStatus === 'on_leave').length;

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.homeroomTeacherName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoom = filterRoomId === 'all' || st.roomId === filterRoomId;
    const matchesStatus = filterStatus === 'all' || st.boardingStatus === filterStatus;
    const matchesRole = filterRole === 'all' || st.roleInRoom === filterRole;
    const matchesEdu =
      filterEducationLevel === 'all' || st.educationLevel === filterEducationLevel;

    return matchesSearch && matchesRoom && matchesStatus && matchesRole && matchesEdu;
  });

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    const nextNum = students.length + 1;
    setFormCode(`HS-MS${nextNum.toString().padStart(3, '0')}`);
    setFormFullName('');
    setFormGender('nam');
    setFormBirthYear(2014);
    setFormClassName('Lớp 6A');
    setFormEducationLevel('thcs');
    setFormRoomId(rooms[0]?.id || '');
    setFormHomeroomTeacher('Cô Nông Thị Lan');
    setFormRoleInRoom('member');
    setFormBoardingStatus('present');
    setFormNote('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: Student) => {
    setEditingStudent(st);
    setFormCode(st.code);
    setFormFullName(st.fullName);
    setFormGender(st.gender);
    setFormBirthYear(st.birthYear);
    setFormClassName(st.className);
    setFormEducationLevel(st.educationLevel || detectEducationLevel(st.className));
    setFormRoomId(st.roomId);
    setFormHomeroomTeacher(st.homeroomTeacherName);
    setFormRoleInRoom(st.roleInRoom);
    setFormBoardingStatus(st.boardingStatus);
    setFormNote(st.note || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleClassChange = (newClass: string) => {
    setFormClassName(newClass);
    setFormEducationLevel(detectEducationLevel(newClass));
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim() || !formFullName.trim()) {
      setFormError('Vui lòng nhập đầy đủ mã học sinh và họ tên.');
      return;
    }

    if (editingStudent) {
      const res = updateStudent({
        ...editingStudent,
        code: formCode.trim().toUpperCase(),
        fullName: formFullName.trim(),
        gender: formGender,
        birthYear: Number(formBirthYear),
        className: formClassName.trim(),
        educationLevel: formEducationLevel,
        roomId: formRoomId,
        homeroomTeacherName: formHomeroomTeacher.trim(),
        roleInRoom: formRoleInRoom,
        boardingStatus: formBoardingStatus,
        note: formNote.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi cập nhật học sinh.');
        return;
      }
    } else {
      const res = addStudent({
        code: formCode.trim().toUpperCase(),
        fullName: formFullName.trim(),
        gender: formGender,
        birthYear: Number(formBirthYear),
        className: formClassName.trim(),
        educationLevel: formEducationLevel,
        roomId: formRoomId,
        homeroomTeacherName: formHomeroomTeacher.trim(),
        roleInRoom: formRoleInRoom,
        boardingStatus: formBoardingStatus,
        note: formNote.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi thêm học sinh.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = (studentId: string, name: string) => {
    if (!window.confirm(`Xác nhận xóa học sinh "${name}" khỏi hệ thống?`)) return;
    const res = deleteStudent(studentId);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleTransferRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !targetRoomId) return;

    const res = changeStudentRoom(transferringStudent.id, targetRoomId);
    if (!res.success) {
      alert(res.error);
      return;
    }

    setTransferringStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Hồ Sơ Học Sinh Nội Trú
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý học sinh 2 cấp (Tiểu học & THCS), mã định danh, phân chia phòng ở và ban tự quản.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học sinh mới</span>
          </button>
        )}
      </div>

      {/* Summary Statistics Cards: Breakdown by Education Level & Boarding Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Tổng số học sinh
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{totalStudents} em</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Dữ liệu mô phỏng</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
            Cấp THCS (Lớp 6 - 9)
          </span>
          <div className="text-xl font-extrabold text-indigo-900 mt-1">{thcsCount} em</div>
          <span className="text-[10px] text-indigo-600 block mt-0.5">
            {totalStudents > 0 ? Math.round((thcsCount / totalStudents) * 100) : 0}% tổng sĩ số
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-sky-200 shadow-xs">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
            Cấp Tiểu học (Lớp 1 - 5)
          </span>
          <div className="text-xl font-extrabold text-sky-900 mt-1">{tieuHocCount} em</div>
          <span className="text-[10px] text-sky-600 block mt-0.5">
            {totalStudents > 0 ? Math.round((tieuHocCount / totalStudents) * 100) : 0}% tổng sĩ số
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Tình trạng hôm nay
          </span>
          <div className="text-sm font-extrabold text-emerald-900 mt-1">
            {presentCount} có mặt
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {sickCount > 0 && <span className="text-red-600 font-bold">{sickCount} ốm • </span>}
            {onLeaveCount} phép
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm họ tên, mã HS, lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Filter Cấp học (Education Level) */}
          <div>
            <select
              value={filterEducationLevel}
              onChange={(e) => setFilterEducationLevel(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
            >
              <option value="all">Tất cả cấp học</option>
              <option value="tieu_hoc">Cấp Tiểu học (Lớp 1 - 5)</option>
              <option value="thcs">Cấp THCS (Lớp 6 - 9)</option>
            </select>
          </div>

          {/* Filter Room */}
          <div>
            <select
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Tất cả các phòng ({rooms.length} phòng)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Tất cả tình trạng nội trú</option>
              <option value="present">Đang có mặt tại trường</option>
              <option value="sick">Đang sốt / ốm theo dõi</option>
              <option value="on_leave">Nghỉ phép về gia đình</option>
            </select>
          </div>

          {/* Filter Role */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            >
              <option value="all">Tất cả chức danh phòng</option>
              <option value="leader">Trưởng phòng</option>
              <option value="vice_leader">Phó phòng</option>
              <option value="member">Thành viên</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> học sinh
          </span>
          {(searchQuery ||
            filterEducationLevel !== 'all' ||
            filterRoomId !== 'all' ||
            filterStatus !== 'all' ||
            filterRole !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterEducationLevel('all');
                setFilterRoomId('all');
                setFilterStatus('all');
                setFilterRole('all');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Cấp học</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Phòng ở</th>
                <th className="py-3 px-4">Chức danh phòng</th>
                <th className="py-3 px-4">GV Chủ Nhiệm</th>
                <th className="py-3 px-4">Tình trạng</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const room = rooms.find((r) => r.id === st.roomId);
                const isLeader = st.roleInRoom === 'leader';
                const isViceLeader = st.roleInRoom === 'vice_leader';
                const isTieuHoc = st.educationLevel === 'tieu_hoc';

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student code */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{st.code}</td>

                    {/* Name & gender */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{st.fullName}</div>
                      <div className="text-[10px] text-slate-400">
                        {st.gender === 'nam' ? 'Nam' : 'Nữ'} • Năm sinh: {st.birthYear}
                      </div>
                    </td>

                    {/* Education Level Badge */}
                    <td className="py-3 px-4">
                      {isTieuHoc ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                          Tiểu học
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                          THCS
                        </span>
                      )}
                    </td>

                    {/* Class */}
                    <td className="py-3 px-4 font-semibold text-slate-700">{st.className}</td>

                    {/* Room */}
                    <td className="py-3 px-4">
                      {room ? (
                        <div>
                          <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {room.code}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {room.building === 'unassigned' || !room.building
                              ? 'Chưa gán dãy'
                              : `Dãy ${room.building} - T${room.floor}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa xếp</span>
                      )}
                    </td>

                    {/* Role in room */}
                    <td className="py-3 px-4">
                      {isLeader ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          <UserCheck className="w-3 h-3 text-amber-700" />
                          Trưởng phòng
                        </span>
                      ) : isViceLeader ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                          <UserCheck className="w-3 h-3 text-blue-700" />
                          Phó phòng
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Thành viên</span>
                      )}
                    </td>

                    {/* GVCN */}
                    <td className="py-3 px-4 text-slate-600">{st.homeroomTeacherName}</td>

                    {/* Boarding status */}
                    <td className="py-3 px-4">
                      {st.boardingStatus === 'present' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Có mặt
                        </span>
                      ) : st.boardingStatus === 'sick' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-300">
                          <HeartPulse className="w-3 h-3 text-red-600" />
                          Sốt / Mệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Nghỉ phép
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setTransferringStudent(st);
                              setTargetRoomId(st.roomId);
                            }}
                            title="Chuyển phòng ở"
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            title="Sửa thông tin"
                            className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(st.id, st.fullName)}
                            title="Xóa học sinh"
                            className="p-1 rounded text-slate-500 hover:text-red-700 hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 px-4">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {students.length === 0 ? 'Chưa có học sinh.' : 'Không tìm thấy học sinh nào phù hợp.'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {students.length === 0
                ? 'Hệ thống khởi tạo chưa có hồ sơ học sinh. Bấm "Thêm học sinh mới" để lập danh sách theo cấp học (Tiểu học hoặc THCS).'
                : 'Vui lòng thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.'}
            </p>
            {canManage && students.length === 0 && (
              <button
                onClick={handleOpenAddModal}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                Thêm học sinh đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent ? `Chỉnh Sửa Hồ Sơ: ${editingStudent.fullName}` : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="VD: HS-MS024"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="VD: Lăng Văn Nam"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gender, BirthYear, Class, Education Level */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giới tính</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Năm sinh</label>
                  <input
                    type="number"
                    min="2005"
                    max="2022"
                    value={formBirthYear}
                    onChange={(e) => setFormBirthYear(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lớp</label>
                  <input
                    type="text"
                    value={formClassName}
                    onChange={(e) => handleClassChange(e.target.value)}
                    placeholder="VD: Lớp 6A"
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp học *</label>
                  <select
                    value={formEducationLevel}
                    onChange={(e) => setFormEducationLevel(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-indigo-900"
                  >
                    <option value="tieu_hoc">Tiểu học (1 - 5)</option>
                    <option value="thcs">THCS (6 - 9)</option>
                  </select>
                </div>
              </div>

              {/* Room & Role in room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phòng nội trú *</label>
                  <select
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {rooms.map((r) => {
                      const count = students.filter((s) => s.roomId === r.id).length;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.code} - {r.name} ({count}/{r.capacity} chỗ)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chức danh trong phòng</label>
                  <select
                    value={formRoleInRoom}
                    onChange={(e) => setFormRoleInRoom(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="member">Thành viên phòng</option>
                    <option value="leader">Trưởng phòng</option>
                    <option value="vice_leader">Phó phòng</option>
                  </select>
                </div>
              </div>

              {/* Homeroom teacher & Boarding Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giáo viên chủ nhiệm</label>
                  <input
                    type="text"
                    value={formHomeroomTeacher}
                    onChange={(e) => setFormHomeroomTeacher(e.target.value)}
                    placeholder="VD: Thầy Hoàng Văn Bách"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tình trạng nội trú</label>
                  <select
                    value={formBoardingStatus}
                    onChange={(e) => setFormBoardingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="present">Đang có mặt tại trường</option>
                    <option value="sick">Đang sốt / ốm theo dõi</option>
                    <option value="on_leave">Tạm nghỉ phép</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú sinh hoạt (nếu có)</label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ghi chú về sức khỏe, nề nếp cần hỗ trợ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Room */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Chuyển Phòng Học Sinh</h3>
            <p className="text-xs text-slate-500 mb-4">
              Học sinh: <strong>{transferringStudent.fullName}</strong> ({transferringStudent.code})
            </p>

            <form onSubmit={handleTransferRoom} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn phòng mới:</label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {rooms.map((r) => {
                    const count = students.filter((s) => s.roomId === r.id).length;
                    const isCurrent = r.id === transferringStudent.roomId;
                    const isFull = count >= r.capacity && !isCurrent;

                    return (
                      <option key={r.id} value={r.id} disabled={isFull}>
                        {r.code} - {r.name} ({count}/{r.capacity} chỗ) {isCurrent ? '(Phòng hiện tại)' : ''}{' '}
                        {isFull ? '- ĐÃ KÍN' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Khi chuyển phòng, chức vụ cán sự (nếu có) sẽ được chuyển về thành viên.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
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
