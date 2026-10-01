import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Lock,
  Unlock,
  Edit2,
  Users,
  Search,
  History,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  FileCheck2,
  Phone,
  Mail,
  DoorClosed,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAccount, UserRole, RegistrationRequest } from '../../types';
import { ROLE_DEFINITIONS } from '../../services/permissions';

export const AccountsTab: React.FC = () => {
  const {
    accounts,
    rooms,
    students,
    currentUser,
    createAccount,
    updateAccount,
    toggleLockAccount,
    auditLogs,
    registrationRequests,
    approveRegistration,
    rejectRegistration,
    passwordResetRequests,
    adminResetPassword,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'requests' | 'reset_requests' | 'audit'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<UserAccount | null>(null);

  // Modal Reset Password (BGH admin workflow)
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminResetPwd, setShowAdminResetPwd] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Modal approve registration
  const [approvingReq, setApprovingReq] = useState<RegistrationRequest | null>(null);
  const [approveRole, setApproveRole] = useState<UserRole>('giao_vien');
  const [approveTitle, setApproveTitle] = useState('');
  const [approveRoomId, setApproveRoomId] = useState('');
  const [approveStudentId, setApproveStudentId] = useState('');
  const [approveError, setApproveError] = useState<string | null>(null);

  // Form fields for create/edit
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('giao_vien');
  const [formTitle, setFormTitle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formRoomId, setFormRoomId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const pendingRequests = registrationRequests.filter((r) => r.status === 'pending');

  const filteredAccounts = accounts.filter((a) => {
    const matchQuery =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone && a.phone.includes(searchQuery)) ||
      (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || a.role === filterRole;
    return matchQuery && matchRole;
  });

  const handleOpenAdd = () => {
    setEditingAcc(null);
    setFormUsername('');
    setFormPassword('');
    setFormName('');
    setFormRole('giao_vien');
    setFormTitle('Giáo viên bộ môn');
    setFormPhone('');
    setFormEmail('');
    setFormSubject('Toán học');
    setFormRoomId(rooms[0]?.id || '');
    setFormStudentId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: UserAccount) => {
    setEditingAcc(acc);
    setFormUsername(acc.username);
    setFormPassword('');
    setFormName(acc.name);
    setFormRole(acc.role);
    setFormTitle(acc.title);
    setFormPhone(acc.phone || '');
    setFormEmail(acc.email || '');
    setFormSubject(acc.subject || '');
    setFormRoomId(acc.studentRoomId || rooms[0]?.id || '');
    setFormStudentId(acc.studentId || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formName.trim()) {
      setFormError('Vui lòng điền đầy đủ tên đăng nhập và họ tên.');
      return;
    }
    if (!formPhone.trim() && !formEmail.trim()) {
      setFormError('Bắt buộc phải có Số điện thoại hoặc Gmail để liên lạc.');
      return;
    }

    if (formRole === 'truong_phong' && !formRoomId && !formStudentId) {
      setFormError('Tài khoản Trưởng phòng bắt buộc phải chọn phòng hoặc học sinh đại diện.');
      return;
    }

    if (editingAcc) {
      const res = updateAccount({
        ...editingAcc,
        username: formUsername.trim().toLowerCase(),
        password: formPassword.trim() ? formPassword.trim() : editingAcc.password,
        name: formName.trim(),
        role: formRole,
        title: formTitle.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        subject: formSubject.trim() || undefined,
        studentRoomId: formRole === 'truong_phong' ? formRoomId : undefined,
        studentId: formRole === 'truong_phong' ? formStudentId : undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi cập nhật tài khoản.');
        return;
      }
    } else {
      if (!formPassword.trim()) {
        setFormError('Vui lòng nhập mật khẩu cho tài khoản mới.');
        return;
      }
      const res = createAccount({
        code: `TK-${Date.now().toString().slice(-4)}`,
        username: formUsername.trim().toLowerCase(),
        password: formPassword.trim(),
        name: formName.trim(),
        role: formRole,
        title: formTitle.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        subject: formSubject.trim() || undefined,
        status: 'active',
        studentRoomId: formRole === 'truong_phong' ? formRoomId : undefined,
        studentId: formRole === 'truong_phong' ? formStudentId : undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Có lỗi khi tạo tài khoản.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleToggleLock = (acc: UserAccount) => {
    const actionText = acc.status === 'locked' ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Thầy/Cô có chắc chắn muốn ${actionText} tài khoản của ${acc.name} (${acc.username})?`)) {
      return;
    }
    const res = toggleLockAccount(acc.id);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleOpenApproveModal = (req: RegistrationRequest) => {
    setApprovingReq(req);
    setApproveRole(req.requestedRole);
    setApproveTitle(
      req.requestedRole === 'giao_vien'
        ? 'Giáo viên bộ môn'
        : req.requestedRole === 'quan_sinh'
        ? 'Cán bộ Quản sinh'
        : 'Trưởng phòng học sinh'
    );
    setApproveRoomId(rooms[0]?.id || '');
    setApproveStudentId('');
    setApproveError(null);
  };

  const handleSaveApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReq) return;

    if (approveRole === 'truong_phong' && !approveRoomId && !approveStudentId) {
      setApproveError('Tài khoản Trưởng phòng bắt buộc phải gắn với học sinh hoặc phòng nội trú cụ thể.');
      return;
    }

    const res = approveRegistration(approvingReq.id, {
      finalRole: approveRole,
      assignedTeacherTitle: approveTitle,
      assignedRoomId: approveRoomId || undefined,
      assignedStudentId: approveStudentId || undefined,
    });

    if (!res.success) {
      setApproveError(res.error || 'Lỗi khi phê duyệt.');
      return;
    }

    setApprovingReq(null);
  };

  const handleReject = (req: RegistrationRequest) => {
    const reason = window.prompt(`Nhập lý do từ chối đăng ký của ${req.fullName}:`, 'Thông tin chưa đủ điều kiện xác thực từ nhà trường.');
    if (reason === null) return;
    rejectRegistration(req.id, reason);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            Quản Lý Tài Khoản & Phê Duyệt Cấp Quyền
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Duy nhất Ban Giám Hiệu có thẩm quyền xem xét yêu cầu đăng ký, phê duyệt vai trò chính thức, gắn hồ sơ và khóa tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo tài khoản quản trị viên / GV</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'accounts'
              ? 'border-blue-700 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Tài Khoản Đang Hoạt Động ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'requests'
              ? 'border-blue-700 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Yêu Cầu Đăng Ký Chờ Duyệt</span>
          {pendingRequests.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('reset_requests')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'reset_requests'
              ? 'border-blue-700 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Yêu Cầu Quên Mật Khẩu ({passwordResetRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'audit'
              ? 'border-blue-700 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký Thao Tác (Audit Log)</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACCOUNTS LIST */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          {/* Filter and Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo Số điện thoại, Gmail, họ và tên hoặc tên đăng nhập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
              >
                <option value="all">Tất cả vai trò ({accounts.length})</option>
                <option value="bgh">Ban Giám Hiệu</option>
                <option value="quan_sinh">Quản Sinh</option>
                <option value="giao_vien">Giáo Viên</option>
                <option value="truong_phong">Trưởng Phòng HS</option>
              </select>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tên đăng nhập</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Vai trò chính thức</th>
                    <th className="py-3 px-4">Gắn hồ sơ / Phòng</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Gmail</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((acc) => {
                    const rDef = ROLE_DEFINITIONS[acc.role];
                    const isLocked = acc.status === 'locked';
                    const boundRoom = rooms.find((r) => r.id === acc.studentRoomId);

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">{acc.username}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{acc.name}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rDef.badgeColor}`}>
                            {rDef.title}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{acc.title}</div>
                          {boundRoom && (
                            <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                              <DoorClosed className="w-3 h-3" />
                              <span>{boundRoom.code} - {boundRoom.name}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">{acc.phone || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{acc.email || '—'}</td>
                        <td className="py-3 px-4">
                          {isLocked ? (
                            <span className="text-red-700 bg-red-100 border border-red-200 font-bold text-[10px] px-2 py-0.5 rounded">
                              Đã bị khóa
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 font-bold text-[10px] px-2 py-0.5 rounded">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(acc)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa thông tin và phân quyền"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setResettingUser(acc);
                                setNewAdminPassword('');
                                setConfirmAdminPassword('');
                                setResetError(null);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Khởi tạo đặt lại mật khẩu mới (BGH)"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            {currentUser?.id !== acc.id && (
                              <button
                                onClick={() => handleToggleLock(acc)}
                                className={`p-1.5 rounded ${
                                  isLocked
                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                    : 'text-amber-700 hover:bg-amber-50'
                                }`}
                                title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredAccounts.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Không tìm thấy tài khoản người dùng nào.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REGISTRATION REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Quy trình duyệt đăng ký của Ban Giám Hiệu:</span>
              <p className="mt-0.5 text-blue-800 text-[11px]">
                Người đăng ký từ bên ngoài không tự được cấp quyền. Ban Giám Hiệu xem xét hồ sơ, chỉ định vai trò chính thức (Quản sinh, Giáo viên hoặc Trưởng phòng), gắn với hồ sơ giáo viên/học sinh hoặc phân công phòng tương ứng.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Gmail</th>
                    <th className="py-3 px-4">Vai trò đề nghị</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Phê duyệt BGH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrationRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{req.createdAt}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{req.fullName}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{req.phone || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{req.email || '—'}</td>
                      <td className="py-3 px-4 font-medium text-blue-900">
                        {req.requestedRole === 'giao_vien'
                          ? 'Giáo viên'
                          : req.requestedRole === 'quan_sinh'
                          ? 'Quản sinh'
                          : 'Trưởng phòng HS'}
                      </td>
                      <td className="py-3 px-4">
                        {req.status === 'pending' ? (
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            Chờ duyệt
                          </span>
                        ) : req.status === 'approved' ? (
                          <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            Đã duyệt ({req.assignedRole})
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            Đã từ chối
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenApproveModal(req)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-2xs"
                            >
                              Duyệt & Cấp quyền
                            </button>
                            <button
                              onClick={() => handleReject(req)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-[11px]"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {req.reviewedBy} ({req.reviewedAt})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {registrationRequests.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Hiện không có yêu cầu đăng ký tài khoản nào.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-blue-700" />
            Nhật Ký Thao Tác Tài Khoản (Audit Log)
          </h3>
          <p className="text-xs text-slate-500">
            Mọi thao tác tạo mới, phê duyệt, sửa đổi quyền hoặc khóa tài khoản đều được ghi nhận chi tiết phục vụ kiểm tra an toàn.
          </p>

          <div className="space-y-2 mt-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.details}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Người thực hiện: <strong className="text-slate-700">{log.performedBy}</strong> • Đối tượng:{' '}
                  <strong className="text-slate-700">{log.targetUser}</strong>
                </div>
              </div>
            ))}
          </div>

          {auditLogs.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              Chưa có ghi chép thao tác nào trong hệ thống.
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPROVE REGISTRATION */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-700" />
                <span>Phê Duyệt Cấp Quyền: {approvingReq.fullName}</span>
              </h3>
              <button onClick={() => setApprovingReq(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {approveError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{approveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveApproval} className="mt-4 space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Xác định vai trò chính thức *</label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-blue-900"
                >
                  <option value="giao_vien">Giáo viên (Quản lý phòng & Trực ca)</option>
                  <option value="quan_sinh">Quản Sinh</option>
                  <option value="truong_phong">Trưởng phòng học sinh</option>
                  <option value="bgh">Ban Giám Hiệu (Bổ nhiệm thêm)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chức vụ / Tiêu đề hiển thị *</label>
                <input
                  type="text"
                  required
                  value={approveTitle}
                  onChange={(e) => setApproveTitle(e.target.value)}
                  placeholder="VD: Giáo viên Toán / Cán bộ Quản sinh..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {approveRole === 'truong_phong' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-950 block text-[11px]">
                    Gắn với phòng nội trú của Trưởng phòng học sinh:
                  </span>
                  <select
                    value={approveRoomId}
                    onChange={(e) => setApproveRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="">-- Chọn phòng quản lý --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovingReq(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Xác nhận duyệt & kích hoạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ACCOUNT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingAcc ? `Sửa Tài Khoản: ${editingAcc.username}` : 'Tạo Tài Khoản Người Dùng Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="VD: gv.hoa, bach.hv..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {editingAcc ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                  </label>
                  <input
                    type="password"
                    required={!editingAcc}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingAcc ? 'Giữ nguyên mật khẩu' : 'Nhập mật khẩu...'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vai trò hệ thống *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-blue-900"
                  >
                    <option value="bgh">Ban Giám Hiệu (Toàn quyền)</option>
                    <option value="quan_sinh">Quản Sinh</option>
                    <option value="giao_vien">Giáo Viên</option>
                    <option value="truong_phong">Trưởng Phòng Học Sinh</option>
                  </select>
                </div>
              </div>

              {formRole === 'truong_phong' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="font-bold text-amber-950 block text-[11px]">
                    Chọn phòng phụ trách (HS Trưởng phòng) *
                  </label>
                  <select
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chức danh / Tiêu đề</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: Giáo viên Toán / Phó Hiệu trưởng..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Môn chuyên môn (nếu có)</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="VD: Toán học, GDCD..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại đăng nhập</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="09xx..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Địa chỉ Gmail đăng nhập</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ten@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  {editingAcc ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
