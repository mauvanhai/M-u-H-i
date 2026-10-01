import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserAccount,
  Room,
  Student,
  Shift,
  DutyLog,
  HandoverNote,
  QuickReport,
  PendingTask,
  UserRole,
  ReportPriority,
  ReportStatus,
  LogCategory,
  RoomCoordination,
  RoomNotice,
  UserAuditEntry,
  RegistrationRequest,
  PasswordResetRequest,
  RegistrationRole,
  ImportHistoryEntry,
  ImportDataType,
} from '../types';
import { DEMO_DATA } from '../data/mockData';
import {
  normalizePhoneNumber,
  normalizeEmail,
  normalizeFullName,
  isEmailFormat,
  isPhoneFormat,
  hashPassword,
  verifyPassword,
} from '../services/authUtils';

const STORAGE_KEY = 'mauson_boarding_app_v5_clean';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Authentication & Session
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  teachers: UserAccount[];
  hasAdminAccount: boolean;

  // Login & Session Actions
  loginWithIdentifier: (identifier: string, passwordInput: string) => Promise<{ success: boolean; error?: string; requireClarification?: boolean }>;
  logout: () => void;

  // Initial BGH Setup (One-time, protected setup when no admin exists)
  setupFirstAdminAccount: (data: {
    fullName: string;
    phone: string;
    email: string;
    passwordInput: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Registration Flow (Sign up requests requiring BGH approval)
  submitRegistration: (data: {
    fullName: string;
    phone: string;
    email: string;
    requestedRole: RegistrationRole;
    passwordInput: string;
  }) => Promise<{ success: boolean; error?: string }>;

  registrationRequests: RegistrationRequest[];
  approveRegistration: (
    requestId: string,
    details: {
      finalRole: UserRole;
      assignedTeacherTitle?: string;
      assignedStudentId?: string;
      assignedRoomId?: string;
    }
  ) => { success: boolean; error?: string };
  rejectRegistration: (requestId: string, reason?: string) => { success: boolean; error?: string };

  // Password Recovery
  passwordResetRequests: PasswordResetRequest[];
  requestPasswordReset: (identifier: string) => { success: boolean; message: string; contactHint?: string };
  adminResetPassword: (
    userId: string,
    newPasswordInput: string
  ) => { success: boolean; error?: string };

  // Data entities (All initially empty)
  rooms: Room[];
  students: Student[];
  shifts: Shift[];
  dutyLogs: DutyLog[];
  reports: QuickReport[];
  pendingTasks: PendingTask[];
  handovers: HandoverNote[];
  coordinations: RoomCoordination[];
  notices: RoomNotice[];
  auditLogs: UserAuditEntry[];
  lastUpdated: string;

  // Active / Ongoing Shift helper
  currentShift?: Shift;
  nextShift?: Shift;
  previousShift?: Shift;

  // Actions - Room
  addRoom: (room: Omit<Room, 'id'>) => { success: boolean; error?: string };
  updateRoom: (room: Room) => { success: boolean; error?: string };
  deleteRoom: (roomId: string) => { success: boolean; error?: string };

  // Actions - Student
  addStudent: (student: Omit<Student, 'id'>) => { success: boolean; error?: string };
  updateStudent: (student: Student) => { success: boolean; error?: string };
  deleteStudent: (studentId: string) => { success: boolean; error?: string };
  changeStudentRoom: (studentId: string, newRoomId: string) => { success: boolean; error?: string };

  // Actions - Shifts & Assignments
  createShift: (shift: Omit<Shift, 'id'>) => { success: boolean; error?: string };
  updateShift: (shift: Shift) => { success: boolean; error?: string };
  checkShiftOverlap: (teacherId: string, startTime: string, endTime: string, excludeShiftId?: string) => string | null;

  // Actions - Duty Logs
  addDutyLog: (log: {
    roomId: string;
    category: LogCategory;
    content: string;
    actionTaken: string;
    followUpNeeded: string;
  }) => { success: boolean; error?: string };

  // Actions - Quick Reports & Tasks
  createReport: (report: {
    title: string;
    content: string;
    roomId: string;
    studentId?: string;
    priority: ReportPriority;
  }) => { success: boolean; error?: string; reportId?: string };

  assignReportHandler: (
    reportId: string,
    handlerTeacherId: string,
    note?: string
  ) => { success: boolean; error?: string };

  updateReportStatus: (
    reportId: string,
    newStatus: ReportStatus,
    note?: string
  ) => { success: boolean; error?: string };

  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void;

  // Actions - Handover
  createHandover: (note: {
    fromShiftId: string;
    toShiftId: string;
    toTeacherId: string;
    roomStatuses: HandoverNote['roomStatuses'];
    pendingTaskIds: string[];
    generalNotes: string;
  }) => { success: boolean; error?: string };

  acceptHandover: (handoverId: string) => { success: boolean; error?: string };

  // Actions - Coordination (Phối hợp)
  addCoordination: (coord: Omit<RoomCoordination, 'id' | 'recordedDate'>) => { success: boolean; error?: string };
  updateCoordinationStatus: (id: string, status: RoomCoordination['status'], resultNote?: string) => void;

  // Actions - Notices (Thông báo phòng)
  addNotice: (notice: Omit<RoomNotice, 'id' | 'postedDate'>) => { success: boolean; error?: string };

  // Actions - Account Management (BGH)
  createAccount: (acc: Omit<UserAccount, 'id'>) => { success: boolean; error?: string };
  updateAccount: (acc: UserAccount) => { success: boolean; error?: string };
  toggleLockAccount: (userId: string) => { success: boolean; error?: string };

  // Data Import Management
  importHistory: ImportHistoryEntry[];
  executeExcelImport: (
    dataType: ImportDataType,
    rows: any[],
    duplicateAction: 'skip' | 'update'
  ) => { success: boolean; successCount: number; failedCount: number; message: string };

  // Feedback Notifications (Toast)
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // System Data Management (Preview & Clear Simulated Data)
  hasSimulatedData: boolean;
  loadSimulatedData: () => void;
  clearSimulatedData: () => void;
  clearAllUserDataWithConfirmation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          accounts: parsed.accounts || [],
          currentUserId: parsed.currentUserId || null,
          rooms: parsed.rooms || [],
          students: parsed.students || [],
          shifts: parsed.shifts || [],
          dutyLogs: parsed.dutyLogs || [],
          reports: parsed.reports || [],
          pendingTasks: parsed.pendingTasks || [],
          handovers: parsed.handovers || [],
          coordinations: parsed.coordinations || [],
          notices: parsed.notices || [],
          auditLogs: parsed.auditLogs || [],
          registrationRequests: parsed.registrationRequests || [],
          passwordResetRequests: parsed.passwordResetRequests || [],
          importHistory: parsed.importHistory || [],
          hasSimulatedData: Boolean(parsed.hasSimulatedData),
          lastUpdated: parsed.lastUpdated || new Date().toLocaleString('vi-VN'),
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }

    // Default clean state: ZERO mock data!
    return {
      accounts: [],
      currentUserId: null,
      rooms: [],
      students: [],
      shifts: [],
      dutyLogs: [],
      reports: [],
      pendingTasks: [],
      handovers: [],
      coordinations: [],
      notices: [],
      auditLogs: [],
      registrationRequests: [],
      passwordResetRequests: [],
      importHistory: [],
      hasSimulatedData: false,
      lastUpdated: new Date().toLocaleString('vi-VN'),
    };
  };

  const initialState = loadState();

  const [accounts, setAccounts] = useState<UserAccount[]>(initialState.accounts);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialState.currentUserId);
  const [rooms, setRooms] = useState<Room[]>(initialState.rooms);
  const [students, setStudents] = useState<Student[]>(initialState.students);
  const [shifts, setShifts] = useState<Shift[]>(initialState.shifts);
  const [dutyLogs, setDutyLogs] = useState<DutyLog[]>(initialState.dutyLogs);
  const [reports, setReports] = useState<QuickReport[]>(initialState.reports);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>(initialState.pendingTasks);
  const [handovers, setHandovers] = useState<HandoverNote[]>(initialState.handovers);
  const [coordinations, setCoordinations] = useState<RoomCoordination[]>(initialState.coordinations);
  const [notices, setNotices] = useState<RoomNotice[]>(initialState.notices);
  const [auditLogs, setAuditLogs] = useState<UserAuditEntry[]>(initialState.auditLogs);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>(initialState.registrationRequests);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>(initialState.passwordResetRequests);
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>(initialState.importHistory);
  const [hasSimulatedData, setHasSimulatedData] = useState<boolean>(initialState.hasSimulatedData);
  const [lastUpdated, setLastUpdated] = useState<string>(initialState.lastUpdated);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage whenever state changes
  useEffect(() => {
    try {
      const stateToSave = {
        accounts,
        currentUserId,
        rooms,
        students,
        shifts,
        dutyLogs,
        reports,
        pendingTasks,
        handovers,
        coordinations,
        notices,
        auditLogs,
        registrationRequests,
        passwordResetRequests,
        importHistory,
        hasSimulatedData,
        lastUpdated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [
    accounts,
    currentUserId,
    rooms,
    students,
    shifts,
    dutyLogs,
    reports,
    pendingTasks,
    handovers,
    coordinations,
    notices,
    auditLogs,
    registrationRequests,
    passwordResetRequests,
    importHistory,
    hasSimulatedData,
    lastUpdated,
  ]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random()}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTimestamp = () => {
    const now = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    setLastUpdated(now);
  };

  // Has at least one active BGH administrator?
  const hasAdminAccount = accounts.some((a) => a.role === 'bgh' && a.status === 'active');

  // Currently logged in user
  const currentUser = currentUserId ? accounts.find((a) => a.id === currentUserId) || null : null;
  const teachers = accounts.filter((a) => a.role === 'giao_vien' || a.role === 'bgh' || a.role === 'quan_sinh');

  // Helper shifts
  const currentShift = shifts.find((s) => s.status === 'ongoing');
  const nextShift = shifts.find((s) => s.status === 'scheduled');
  const previousShift = shifts.find((s) => s.status === 'completed');

  // One-time Setup of first BGH Admin Account
  const setupFirstAdminAccount = async (data: {
    fullName: string;
    phone: string;
    email: string;
    passwordInput: string;
  }) => {
    if (hasAdminAccount) {
      return { success: false, error: 'Hệ thống đã có tài khoản Ban Giám Hiệu quản trị. Quy trình thiết lập ban đầu đã kết thúc.' };
    }

    const normName = normalizeFullName(data.fullName);
    const normPhone = normalizePhoneNumber(data.phone);
    const normEmail = normalizeEmail(data.email);

    if (!normName) return { success: false, error: 'Vui lòng nhập họ và tên của cán bộ Ban Giám Hiệu.' };
    if (!normPhone && !normEmail) {
      return { success: false, error: 'Bắt buộc phải có ít nhất Số điện thoại hoặc Gmail để liên hệ và phục hồi tài khoản.' };
    }
    if (data.passwordInput.length < 6) {
      return { success: false, error: 'Mật khẩu khởi tạo phải có độ dài tối thiểu từ 6 ký tự.' };
    }

    const pwdHash = await hashPassword(data.passwordInput);
    const usernameProposal = normEmail ? normEmail.split('@')[0] : `bgh.${normPhone.slice(-4)}`;

    const newAdmin: UserAccount = {
      id: `admin_${Date.now()}`,
      code: 'BGH-001',
      username: usernameProposal,
      passwordHash: pwdHash,
      password: '', // Không lưu mật khẩu plain-text
      name: normName,
      role: 'bgh',
      phone: normPhone,
      email: normEmail,
      title: 'Hiệu trưởng (Quản trị viên khởi tạo)',
      status: 'active',
      createdAt: new Date().toLocaleString('vi-VN'),
    };

    setAccounts([newAdmin]);
    setCurrentUserId(newAdmin.id);

    const auditEntry: UserAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: 'create_account',
      performedBy: 'Thiết lập ban đầu bảo vệ (Initial Setup)',
      targetUser: `${newAdmin.name} (${newAdmin.username})`,
      details: 'Khởi tạo tài khoản Ban Giám Hiệu đầu tiên làm Quản trị viên hệ thống.',
    };
    setAuditLogs([auditEntry]);

    updateTimestamp();
    showToast(`Chào mừng ${newAdmin.name}! Thiết lập tài khoản Ban Giám Hiệu thành công.`);
    return { success: true };
  };

  /**
   * Đăng nhập thông minh:
   * - Bằng Số điện thoại (chuẩn hóa số điện thoại)
   * - Bằng Gmail (loại bỏ khoảng trắng, chuẩn hóa email)
   * - Bằng Họ và Tên (nếu trùng họ tên, yêu cầu cung cấp Số điện thoại hoặc Gmail, không tự chọn tài khoản đầu)
   * - Bằng username hệ thống nếu có
   */
  const loginWithIdentifier = async (
    identifierInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string; requireClarification?: boolean }> => {
    const raw = (identifierInput || '').trim();
    const cleanPass = (passwordInput || '').trim();

    if (!raw || !cleanPass) {
      return { success: false, error: 'Vui lòng nhập thông tin đăng nhập và mật khẩu.' };
    }

    if (accounts.length === 0) {
      return {
        success: false,
        error: 'Hệ thống chưa có tài khoản nào. Vui lòng thực hiện Thiết lập tài khoản Ban Giám Hiệu ban đầu.',
      };
    }

    let matchedAccount: UserAccount | null = null;

    // 1. Kiểm tra nếu nhập Email/Gmail
    if (isEmailFormat(raw)) {
      const normEmail = normalizeEmail(raw);
      matchedAccount = accounts.find((a) => normalizeEmail(a.email) === normEmail) || null;
      if (!matchedAccount) {
        return { success: false, error: `Không tìm thấy tài khoản gắn với địa chỉ Gmail: "${normEmail}".` };
      }
    }
    // 2. Kiểm tra nếu nhập Số điện thoại
    else if (isPhoneFormat(raw) || /^[0-9\+\.\-\s]{8,15}$/.test(raw)) {
      const normPhone = normalizePhoneNumber(raw);
      matchedAccount = accounts.find((a) => normalizePhoneNumber(a.phone) === normPhone) || null;
      if (!matchedAccount) {
        return { success: false, error: `Không tìm thấy tài khoản gắn với số điện thoại: "${raw}".` };
      }
    }
    // 3. Tra cứu theo Họ và tên hoặc Tên đăng nhập
    else {
      // Thử tìm theo username chính xác trước
      const exactUsernameMatch = accounts.find((a) => a.username.toLowerCase() === raw.toLowerCase());
      if (exactUsernameMatch) {
        matchedAccount = exactUsernameMatch;
      } else {
        // Tìm theo họ tên
        const nameMatches = accounts.filter(
          (a) => a.name.trim().toLowerCase() === raw.toLowerCase()
        );

        if (nameMatches.length === 0) {
          return {
            success: false,
            error: `Không tìm thấy tài khoản nào khớp với tên hoặc thông tin: "${raw}". Vui lòng kiểm tra lại hoặc dùng Gmail / Số điện thoại.`,
          };
        }

        // Nếu trùng họ tên: KHÔNG tự chọn tài khoản đầu tiên, KHÔNG lộ danh sách thông tin cá nhân của người trùng tên
        if (nameMatches.length > 1) {
          return {
            success: false,
            requireClarification: true,
            error: `Hệ thống ghi nhận có ${nameMatches.length} tài khoản trùng họ và tên "${raw}". Để bảo mật và tránh nhầm lẫn, vui lòng đăng nhập bằng Số điện thoại hoặc Gmail đã đăng ký của bạn.`,
          };
        }

        matchedAccount = nameMatches[0];
      }
    }

    if (!matchedAccount) {
      return { success: false, error: 'Không tìm thấy tài khoản người dùng.' };
    }

    // Kiểm tra trạng thái khóa
    if (matchedAccount.status === 'locked') {
      return {
        success: false,
        error: 'Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Ban Giám Hiệu nhà trường để mở lại.',
      };
    }

    // Kiểm tra mật khẩu (so khớp hash bảo mật hoặc plain demo ban đầu)
    const storedHash = matchedAccount.passwordHash || matchedAccount.password || '';
    const isPasswordValid = await verifyPassword(cleanPass, storedHash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc sử dụng tính năng "Quên mật khẩu".',
      };
    }

    // Đăng nhập thành công
    setCurrentUserId(matchedAccount.id);
    updateTimestamp();
    showToast(`Đăng nhập thành công: ${matchedAccount.name} (${matchedAccount.title || matchedAccount.role})`, 'success');
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    updateTimestamp();
    showToast('Đã đăng xuất khỏi hệ thống an toàn.', 'info');
  };

  // Registration Request (User signs up, enters pending state waiting for BGH approval)
  const submitRegistration = async (data: {
    fullName: string;
    phone: string;
    email: string;
    requestedRole: RegistrationRole;
    passwordInput: string;
  }) => {
    const normName = normalizeFullName(data.fullName);
    const normPhone = normalizePhoneNumber(data.phone);
    const normEmail = normalizeEmail(data.email);

    if (!normName) return { success: false, error: 'Vui lòng nhập họ và tên của bạn.' };
    if (!normPhone && !normEmail) {
      return { success: false, error: 'Bắt buộc phải nhập ít nhất Số điện thoại hoặc Gmail để liên lạc.' };
    }
    if (data.passwordInput.length < 6) {
      return { success: false, error: 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.' };
    }

    // Check duplicate phone or email in existing accounts or pending requests
    if (normPhone && accounts.some((a) => normalizePhoneNumber(a.phone) === normPhone)) {
      return { success: false, error: `Số điện thoại ${normPhone} đã được đăng ký trên hệ thống.` };
    }
    if (normEmail && accounts.some((a) => normalizeEmail(a.email) === normEmail)) {
      return { success: false, error: `Địa chỉ Gmail ${normEmail} đã được đăng ký trên hệ thống.` };
    }

    const pwdHash = await hashPassword(data.passwordInput);

    const newReq: RegistrationRequest = {
      id: `req_${Date.now()}`,
      fullName: normName,
      phone: normPhone,
      email: normEmail,
      requestedRole: data.requestedRole,
      passwordHash: pwdHash,
      status: 'pending',
      createdAt: new Date().toLocaleString('vi-VN'),
    };

    setRegistrationRequests((prev) => [newReq, ...prev]);
    updateTimestamp();
    showToast('Đã gửi yêu cầu đăng ký tài khoản! Ban Giám Hiệu sẽ phê duyệt trước khi kích hoạt.', 'info');
    return { success: true };
  };

  // BGH Approves Registration
  const approveRegistration = (
    requestId: string,
    details: {
      finalRole: UserRole;
      assignedTeacherTitle?: string;
      assignedStudentId?: string;
      assignedRoomId?: string;
    }
  ) => {
    const req = registrationRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Không tìm thấy yêu cầu đăng ký.' };
    if (req.status !== 'pending') return { success: false, error: 'Yêu cầu này đã được xử lý trước đó.' };

    const authorName = currentUser ? `${currentUser.name} (Ban Giám Hiệu)` : 'Ban Giám Hiệu';
    const nowStr = new Date().toLocaleString('vi-VN');

    // Generate unique code & username
    const usernameProposal = req.email
      ? req.email.split('@')[0].toLowerCase()
      : `user.${req.phone.slice(-4)}`;
    
    // Check if trưởng phòng is bound to an actual student leader
    let studentRoomId = details.assignedRoomId;
    if (details.finalRole === 'truong_phong' && !details.assignedStudentId && !details.assignedRoomId) {
      return {
        success: false,
        error: 'Tài khoản Trưởng phòng học sinh bắt buộc phải gắn với một học sinh hoặc phòng nội trú cụ thể!',
      };
    }

    const newAccount: UserAccount = {
      id: `user_${Date.now()}`,
      code: details.finalRole === 'giao_vien' || details.finalRole === 'quan_sinh'
        ? `GV-${(teachers.length + 1).toString().padStart(3, '0')}`
        : details.finalRole === 'truong_phong'
        ? `HS-TP${Date.now().toString().slice(-3)}`
        : `BGH-${Date.now().toString().slice(-3)}`,
      username: usernameProposal,
      passwordHash: req.passwordHash,
      password: '', // Secure hash stored, not plain text
      name: req.fullName,
      role: details.finalRole,
      phone: req.phone,
      email: req.email,
      title: details.assignedTeacherTitle || (details.finalRole === 'quan_sinh' ? 'Cán bộ Quản sinh' : details.finalRole === 'giao_vien' ? 'Giáo viên bộ môn' : 'Trưởng phòng học sinh'),
      status: 'active',
      studentRoomId: studentRoomId,
      studentId: details.assignedStudentId,
      activeRoomsManaged: details.assignedRoomId ? [details.assignedRoomId] : [],
      createdAt: nowStr,
    };

    setAccounts((prev) => [...prev, newAccount]);

    setRegistrationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              reviewedAt: nowStr,
              reviewedBy: authorName,
              assignedRole: details.finalRole,
            }
          : r
      )
    );

    const auditEntry: UserAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: nowStr,
      action: 'create_account',
      performedBy: authorName,
      targetUser: `${newAccount.name} (${newAccount.username})`,
      details: `Ban Giám Hiệu phê duyệt đăng ký: Cấp vai trò ${details.finalRole} (${newAccount.title}).`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    updateTimestamp();
    showToast(`Đã duyệt và kích hoạt tài khoản cho ${newAccount.name}!`);
    return { success: true };
  };

  // BGH Rejects Registration
  const rejectRegistration = (requestId: string, reason?: string) => {
    const req = registrationRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Không tìm thấy yêu cầu đăng ký.' };

    const authorName = currentUser ? `${currentUser.name} (Ban Giám Hiệu)` : 'Ban Giám Hiệu';
    const nowStr = new Date().toLocaleString('vi-VN');

    setRegistrationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              reviewedAt: nowStr,
              reviewedBy: authorName,
              rejectionReason: reason || 'Thông tin chưa đủ điều kiện xác thực từ nhà trường.',
            }
          : r
      )
    );

    updateTimestamp();
    showToast(`Đã từ chối yêu cầu đăng ký của ${req.fullName}.`, 'info');
    return { success: true };
  };

  // Password Recovery Request
  const requestPasswordReset = (identifier: string) => {
    const raw = (identifier || '').trim();
    if (!raw) return { success: false, message: 'Vui lòng nhập Số điện thoại hoặc Gmail cần khôi phục mật khẩu.' };

    let matched: UserAccount | undefined;
    let contactType: 'phone' | 'email' = 'phone';
    let contactVal = '';

    if (isEmailFormat(raw)) {
      contactType = 'email';
      contactVal = normalizeEmail(raw);
      matched = accounts.find((a) => normalizeEmail(a.email) === contactVal);
    } else {
      contactType = 'phone';
      contactVal = normalizePhoneNumber(raw);
      matched = accounts.find((a) => normalizePhoneNumber(a.phone) === contactVal);
    }

    if (!matched) {
      return {
        success: false,
        message: `Không tìm thấy tài khoản gắn với ${contactType === 'email' ? 'Gmail' : 'số điện thoại'}: "${raw}". Vui lòng liên hệ Ban Giám Hiệu để được cấp lại trực tiếp.`,
      };
    }

    // Masked contact for privacy
    let contactHint = '';
    if (contactType === 'email') {
      const parts = contactVal.split('@');
      contactHint = `${parts[0].slice(0, 3)}***@${parts[1]}`;
    } else {
      contactHint = `${contactVal.slice(0, 4)}***${contactVal.slice(-3)}`;
    }

    const newReq: PasswordResetRequest = {
      id: `pr_${Date.now()}`,
      accountIdentifier: raw,
      matchedUserId: matched.id,
      contactType,
      contactValue: contactVal,
      status: 'pending_simulation',
      createdAt: new Date().toLocaleString('vi-VN'),
      notes: 'Yêu cầu khôi phục mật khẩu đã được ghi nhận. Nhà trường chưa tích hợp dịch vụ SMS Gateway hoặc SMTP thực tế để gửi mã tự động.',
    };

    setPasswordResetRequests((prev) => [newReq, ...prev]);

    return {
      success: true,
      contactHint,
      message: `Đã ghi nhận yêu cầu khôi phục cho tài khoản của ${matched.name}. (Lưu ý: Dịch vụ gửi SMS/Email tự động chưa được cấu hình. Vui lòng liên hệ Ban Giám Hiệu để được cấp lại mật khẩu).`,
    };
  };

  /**
   * Quản trị viên (BGH) khởi tạo quy trình đặt lại mật khẩu mới cho người dùng
   * KHÔNG ĐƯỢC XEM MẬT KHẨU CŨ (Mật khẩu cũ mã hóa một chiều, không bao giờ lộ)
   * Không hiển thị mã xác minh công khai trên giao diện
   */
  const adminResetPassword = (
    userId: string,
    newPasswordInput: string
  ): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'bgh') {
      return { success: false, error: 'Chỉ Ban Giám Hiệu mới có quyền đặt lại mật khẩu người dùng.' };
    }

    const target = accounts.find((a) => a.id === userId);
    if (!target) {
      return { success: false, error: 'Không tìm thấy tài khoản người dùng.' };
    }

    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
    }

    const nowStr = new Date().toLocaleString('vi-VN');

    // Update with new password hash asynchronously or sync state
    // We update both password and passwordHash
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === userId
          ? {
              ...a,
              password: newPasswordInput.trim(),
            }
          : a
      )
    );

    // Update password reset request status if one exists for this user
    setPasswordResetRequests((prev) =>
      prev.map((pr) =>
        pr.matchedUserId === userId
          ? {
              ...pr,
              status: 'completed',
              notes: `Ban Giám Hiệu (${currentUser.name}) đã cấp lại mật khẩu mới trực tiếp vào ${nowStr}.`,
            }
          : pr
      )
    );

    const auditEntry: UserAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: nowStr,
      action: 'update_account',
      performedBy: `${currentUser.name} (${currentUser.title || 'BGH'})`,
      targetUser: `${target.name} (${target.username})`,
      details: 'Ban Giám Hiệu khởi tạo đặt lại mật khẩu mới cho người dùng (Không xem mật khẩu cũ).',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    updateTimestamp();
    showToast(`Đã đặt lại mật khẩu mới an toàn cho ${target.name}.`);
    return { success: true };
  };

  // Shift overlap check
  const checkShiftOverlap = (
    teacherId: string,
    startTime: string,
    endTime: string,
    excludeShiftId?: string
  ): string | null => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (isNaN(start) || isNaN(end) || start >= end) {
      return 'Thời gian bắt đầu và kết thúc không hợp lệ.';
    }

    const teacher = accounts.find((t) => t.id === teacherId);
    const teacherName = teacher ? teacher.name : 'Giáo viên';

    for (const shift of shifts) {
      if (excludeShiftId && shift.id === excludeShiftId) continue;
      if (shift.status === 'completed') continue;

      const isTeacherInShift = shift.assignments.some((a) => a.teacherId === teacherId);
      if (!isTeacherInShift) continue;

      const shiftStart = new Date(shift.startTime).getTime();
      const shiftEnd = new Date(shift.endTime).getTime();

      if (start < shiftEnd && end > shiftStart) {
        return `Trùng ca trực: ${teacherName} đã được xếp ca ${shift.code} (${shift.startTime} đến ${shift.endTime}). Vui lòng kiểm tra lại.`;
      }
    }

    return null;
  };

  // Room CRUD
  const addRoom = (newRoomData: Omit<Room, 'id'>) => {
    if (rooms.some((r) => r.code.trim().toLowerCase() === newRoomData.code.trim().toLowerCase())) {
      return { success: false, error: `Mã phòng "${newRoomData.code}" đã tồn tại.` };
    }

    // If school already has teachers, enforce 2 managers
    if (teachers.length >= 2 && (!newRoomData.managerTeacherIds || newRoomData.managerTeacherIds.length < 2)) {
      return { success: false, error: 'Mỗi phòng nội trú bắt buộc phải phân công đủ 2 giáo viên quản lý chính.' };
    }

    const newRoom: Room = {
      ...newRoomData,
      managerTeacherIds: newRoomData.managerTeacherIds || ['', ''],
      id: `room_${Date.now()}`,
      assignmentHistory: [
        {
          id: `hist_${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          changedBy: currentUser ? `${currentUser.name} (${currentUser.title})` : 'Ban Giám Hiệu',
          type: 'general',
          description: `Khởi tạo phòng mới ${newRoomData.code} - ${newRoomData.name}. Sức chứa: ${newRoomData.capacity} em.`,
        },
      ],
    };

    setRooms((prev) => [...prev, newRoom]);
    updateTimestamp();
    showToast(`Đã thêm phòng ${newRoom.code} thành công!`);
    return { success: true };
  };

  const updateRoom = (updatedRoom: Room) => {
    if (
      rooms.some(
        (r) => r.id !== updatedRoom.id && r.code.trim().toLowerCase() === updatedRoom.code.trim().toLowerCase()
      )
    ) {
      return { success: false, error: `Mã phòng "${updatedRoom.code}" bị trùng với phòng khác.` };
    }

    if (!updatedRoom.managerTeacherIds || updatedRoom.managerTeacherIds.length < 2) {
      return { success: false, error: 'Phòng phải có đủ 2 giáo viên quản lý chính phụ trách.' };
    }

    if (
      updatedRoom.leaderStudentId &&
      updatedRoom.viceLeaderStudentId &&
      updatedRoom.leaderStudentId === updatedRoom.viceLeaderStudentId
    ) {
      return { success: false, error: 'Trưởng phòng và Phó phòng phải là 2 học sinh khác nhau trong phòng.' };
    }

    const currentOccupants = students.filter((s) => s.roomId === updatedRoom.id).length;
    if (updatedRoom.capacity < currentOccupants) {
      return {
        success: false,
        error: `Sức chứa mới (${updatedRoom.capacity}) không thể nhỏ hơn số học sinh đang ở (${currentOccupants} em).`,
      };
    }

    const oldRoom = rooms.find((r) => r.id === updatedRoom.id);
    const newHistoryEntries = oldRoom?.assignmentHistory ? [...oldRoom.assignmentHistory] : [];
    const nowStr = new Date().toLocaleString('vi-VN');
    const authorName = currentUser ? `${currentUser.name} (${currentUser.title || currentUser.role})` : 'Hệ thống';

    if (
      oldRoom &&
      (oldRoom.managerTeacherIds[0] !== updatedRoom.managerTeacherIds[0] ||
        oldRoom.managerTeacherIds[1] !== updatedRoom.managerTeacherIds[1])
    ) {
      const m1 = accounts.find((t) => t.id === updatedRoom.managerTeacherIds[0])?.name || 'Chưa chọn';
      const m2 = accounts.find((t) => t.id === updatedRoom.managerTeacherIds[1])?.name || 'Chưa chọn';
      newHistoryEntries.unshift({
        id: `hist_${Date.now()}_m`,
        timestamp: nowStr,
        changedBy: authorName,
        type: 'manager_teachers',
        description: `Thay đổi 2 GVQL chính: 1. ${m1} • 2. ${m2}`,
      });
    }

    if (
      oldRoom &&
      (oldRoom.leaderStudentId !== updatedRoom.leaderStudentId ||
        oldRoom.viceLeaderStudentId !== updatedRoom.viceLeaderStudentId)
    ) {
      const l = students.find((s) => s.id === updatedRoom.leaderStudentId)?.fullName || 'Chưa chọn';
      const vl = students.find((s) => s.id === updatedRoom.viceLeaderStudentId)?.fullName || 'Chưa chọn';
      newHistoryEntries.unshift({
        id: `hist_${Date.now()}_l`,
        timestamp: nowStr,
        changedBy: authorName,
        type: 'leaders',
        description: `Cập nhật Ban cán sự: Trưởng phòng: ${l}, Phó phòng: ${vl}`,
      });
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === updatedRoom.id ? { ...updatedRoom, assignmentHistory: newHistoryEntries } : r))
    );
    updateTimestamp();
    showToast(`Đã cập nhật phòng ${updatedRoom.code}!`);
    return { success: true };
  };

  const deleteRoom = (roomId: string) => {
    const occupants = students.filter((s) => s.roomId === roomId);
    if (occupants.length > 0) {
      return {
        success: false,
        error: `Không thể xóa phòng đang có ${occupants.length} học sinh ở. Vui lòng chuyển các em sang phòng khác trước.`,
      };
    }

    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    updateTimestamp();
    showToast('Đã xóa phòng thành công.');
    return { success: true };
  };

  // Student CRUD
  const addStudent = (studentData: Omit<Student, 'id'>) => {
    if (students.some((s) => s.code.trim().toUpperCase() === studentData.code.trim().toUpperCase())) {
      return { success: false, error: `Mã học sinh "${studentData.code}" đã tồn tại.` };
    }

    if (studentData.roomId) {
      const room = rooms.find((r) => r.id === studentData.roomId);
      if (room) {
        const countInRoom = students.filter((s) => s.roomId === room.id).length;
        if (countInRoom >= room.capacity) {
          return {
            success: false,
            error: `Phòng ${room.code} đã đạt sức chứa tối đa (${room.capacity} em). Vui lòng chọn phòng khác.`,
          };
        }
      }
    }

    const newStudent: Student = {
      ...studentData,
      id: `hs_${Date.now()}`,
      code: studentData.code.trim().toUpperCase(),
    };

    setStudents((prev) => [...prev, newStudent]);
    updateTimestamp();
    showToast(`Đã thêm học sinh ${newStudent.fullName} (${newStudent.code})!`);
    return { success: true };
  };

  const updateStudent = (updatedStudent: Student) => {
    if (
      students.some(
        (s) => s.id !== updatedStudent.id && s.code.trim().toUpperCase() === updatedStudent.code.trim().toUpperCase()
      )
    ) {
      return { success: false, error: `Mã học sinh "${updatedStudent.code}" bị trùng.` };
    }

    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    updateTimestamp();
    showToast(`Đã cập nhật hồ sơ học sinh ${updatedStudent.fullName}!`);
    return { success: true };
  };

  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        leaderStudentId: r.leaderStudentId === studentId ? undefined : r.leaderStudentId,
        viceLeaderStudentId: r.viceLeaderStudentId === studentId ? undefined : r.viceLeaderStudentId,
      }))
    );
    updateTimestamp();
    showToast('Đã xóa học sinh khỏi danh sách.');
    return { success: true };
  };

  const changeStudentRoom = (studentId: string, newRoomId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return { success: false, error: 'Không tìm thấy học sinh.' };

    const targetRoom = rooms.find((r) => r.id === newRoomId);
    if (!targetRoom) return { success: false, error: 'Phòng đích không tồn tại.' };

    const targetCount = students.filter((s) => s.roomId === newRoomId).length;
    if (targetCount >= targetRoom.capacity) {
      return {
        success: false,
        error: `Phòng ${targetRoom.code} đã kín chỗ (${targetRoom.capacity} em).`,
      };
    }

    return updateStudent({
      ...student,
      roomId: newRoomId,
      roleInRoom: 'member',
    });
  };

  // Shifts
  const createShift = (shiftData: Omit<Shift, 'id'>) => {
    for (const assignment of shiftData.assignments) {
      const overlapError = checkShiftOverlap(
        assignment.teacherId,
        shiftData.startTime,
        shiftData.endTime
      );
      if (overlapError) {
        return { success: false, error: overlapError };
      }
    }

    const newShift: Shift = {
      ...shiftData,
      id: `shift_${Date.now()}`,
    };

    setShifts((prev) => [newShift, ...prev]);
    updateTimestamp();
    showToast(`Đã tạo ca trực ${newShift.code}!`);
    return { success: true };
  };

  const updateShift = (updatedShift: Shift) => {
    for (const assignment of updatedShift.assignments) {
      const overlapError = checkShiftOverlap(
        assignment.teacherId,
        updatedShift.startTime,
        updatedShift.endTime,
        updatedShift.id
      );
      if (overlapError) {
        return { success: false, error: overlapError };
      }
    }

    setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
    updateTimestamp();
    showToast(`Đã cập nhật ca trực ${updatedShift.code}!`);
    return { success: true };
  };

  // Duty Logs
  const addDutyLog = (logData: {
    roomId: string;
    category: LogCategory;
    content: string;
    actionTaken: string;
    followUpNeeded: string;
  }) => {
    const room = rooms.find((r) => r.id === logData.roomId);
    if (!room) return { success: false, error: 'Không tìm thấy phòng.' };

    const author = currentUser || accounts[0];

    const newLog: DutyLog = {
      id: `log_${Date.now()}`,
      shiftId: currentShift ? currentShift.id : 'shift_manual',
      roomId: room.id,
      roomCode: room.code,
      teacherId: author?.id || 'unknown',
      teacherName: author?.name || 'Giáo viên',
      timestamp: new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      category: logData.category,
      content: logData.content,
      actionTaken: logData.actionTaken,
      followUpNeeded: logData.followUpNeeded,
    };

    setDutyLogs((prev) => [newLog, ...prev]);

    if (logData.followUpNeeded.trim()) {
      const newTask: PendingTask = {
        id: `task_${Date.now()}`,
        title: `Theo dõi [${room.code}]: ${logData.followUpNeeded.slice(0, 50)}...`,
        description: logData.followUpNeeded,
        roomId: room.id,
        roomCode: room.code,
        sourceShiftId: currentShift ? currentShift.id : 'manual',
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toLocaleString('vi-VN'),
      };
      setPendingTasks((prev) => [newTask, ...prev]);
    }

    updateTimestamp();
    showToast(`Đã lưu nhật ký ca trực phòng ${room.code}!`);
    return { success: true };
  };

  // Quick Reports
  const createReport = (reportData: {
    title: string;
    content: string;
    roomId: string;
    studentId?: string;
    priority: ReportPriority;
  }) => {
    const room = rooms.find((r) => r.id === reportData.roomId);
    if (!room) return { success: false, error: 'Không tìm thấy thông tin phòng.' };

    const student = reportData.studentId ? students.find((s) => s.id === reportData.studentId) : undefined;
    const author = currentUser || accounts[0];
    const reportCode = `BC-${Date.now().toString().slice(-4)}`;
    const nowStr = new Date().toLocaleString('vi-VN');

    const newReport: QuickReport = {
      id: `rep_${Date.now()}`,
      code: reportCode,
      title: reportData.title,
      content: reportData.content,
      roomId: room.id,
      roomCode: room.code,
      studentId: student?.id,
      studentName: student?.fullName,
      reporterId: author?.id || 'unknown',
      reporterName: author?.name || 'Người dùng',
      reporterRole: author?.title || author?.role || 'Thành viên',
      createdAt: nowStr,
      priority: reportData.priority,
      status: 'new',
      statusHistory: [
        {
          status: 'new',
          updatedBy: author?.name || 'Hệ thống',
          timestamp: nowStr,
          note: 'Báo cáo được khởi tạo.',
        },
      ],
    };

    setReports((prev) => [newReport, ...prev]);

    const newTask: PendingTask = {
      id: `task_${Date.now()}`,
      title: `[${reportData.priority === 'urgent' ? 'KHẨN CẤP' : 'Cần xử lý'}] ${reportData.title}`,
      description: reportData.content,
      roomId: room.id,
      roomCode: room.code,
      studentId: student?.id,
      sourceReportId: newReport.id,
      sourceShiftId: currentShift ? currentShift.id : 'manual',
      priority: reportData.priority,
      status: 'pending',
      createdAt: nowStr,
    };
    setPendingTasks((prev) => [newTask, ...prev]);

    updateTimestamp();
    showToast(`Đã gửi báo cáo nhanh ${reportCode}!`, reportData.priority === 'urgent' ? 'error' : 'success');
    return { success: true, reportId: newReport.id };
  };

  const assignReportHandler = (reportId: string, handlerTeacherId: string, note?: string) => {
    const teacher = accounts.find((t) => t.id === handlerTeacherId);
    if (!teacher) return { success: false, error: 'Không tìm thấy giáo viên được giao.' };

    const nowStr = new Date().toLocaleString('vi-VN');
    const author = currentUser || accounts[0];

    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          status: r.status === 'new' ? 'accepted' : r.status,
          assignedToId: teacher.id,
          assignedToName: teacher.name,
          resolutionNote: note || r.resolutionNote,
          statusHistory: [
            {
              status: 'accepted',
              updatedBy: `${author?.name || 'Ban Giám Hiệu'} (Chỉ đạo)`,
              timestamp: nowStr,
              note: `Giao cho: ${teacher.name} (${teacher.title}). Ghi chú: ${note || 'Không có'}`,
            },
            ...r.statusHistory,
          ],
        };
      })
    );

    setPendingTasks((prev) =>
      prev.map((t) => {
        if (t.sourceReportId === reportId) {
          return {
            ...t,
            assignedToTeacherId: teacher.id,
            assignedToTeacherName: teacher.name,
            status: t.status === 'pending' ? 'in_progress' : t.status,
          };
        }
        return t;
      })
    );

    updateTimestamp();
    showToast(`Đã phân công ${teacher.name} xử lý báo cáo!`);
    return { success: true };
  };

  const updateReportStatus = (reportId: string, newStatus: ReportStatus, note?: string) => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const author = currentUser || accounts[0];

    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          status: newStatus,
          resolutionNote: note || r.resolutionNote,
          statusHistory: [
            {
              status: newStatus,
              updatedBy: author?.name || 'Hệ thống',
              timestamp: nowStr,
              note: note || `Chuyển trạng thái sang "${newStatus}"`,
            },
            ...r.statusHistory,
          ],
        };
      })
    );

    if (newStatus === 'completed') {
      setPendingTasks((prev) =>
        prev.map((t) => {
          if (t.sourceReportId === reportId) {
            return { ...t, status: 'completed', completedAt: nowStr };
          }
          return t;
        })
      );
    }

    updateTimestamp();
    showToast('Đã cập nhật tiến độ báo cáo!');
    return { success: true };
  };

  const updateTaskStatus = (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const nowStr = new Date().toLocaleString('vi-VN');
    setPendingTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status,
          completedAt: status === 'completed' ? nowStr : undefined,
        };
      })
    );
    updateTimestamp();
    showToast('Đã cập nhật trạng thái công việc.');
  };

  // Handover
  const createHandover = (noteData: {
    fromShiftId: string;
    toShiftId: string;
    toTeacherId: string;
    roomStatuses: HandoverNote['roomStatuses'];
    pendingTaskIds: string[];
    generalNotes: string;
  }) => {
    const fromShift = shifts.find((s) => s.id === noteData.fromShiftId);
    const toShift = shifts.find((s) => s.id === noteData.toShiftId);
    const toTeacher = accounts.find((t) => t.id === noteData.toTeacherId);
    const author = currentUser || accounts[0];

    if (!fromShift || !toShift || !toTeacher) {
      return { success: false, error: 'Thông tin ca trực hoặc giáo viên nhận ca không hợp lệ.' };
    }

    const newHandover: HandoverNote = {
      id: `ho_${Date.now()}`,
      code: `BG-${Date.now().toString().slice(-6)}`,
      fromShiftId: fromShift.id,
      fromShiftCode: fromShift.code,
      toShiftId: toShift.id,
      toShiftCode: toShift.code,
      fromTeacherId: author?.id || 'unknown',
      fromTeacherName: author?.name || 'Giáo viên',
      toTeacherId: toTeacher.id,
      toTeacherName: toTeacher.name,
      createdAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      roomStatuses: noteData.roomStatuses,
      pendingTaskIds: noteData.pendingTaskIds,
      generalNotes: noteData.generalNotes,
    };

    setHandovers((prev) => [newHandover, ...prev]);
    updateTimestamp();
    showToast('Đã lập phiếu bàn giao ca! Chờ người nhận xác nhận.');
    return { success: true };
  };

  const acceptHandover = (handoverId: string) => {
    const handover = handovers.find((h) => h.id === handoverId);
    if (!handover) return { success: false, error: 'Không tìm thấy biên bản bàn giao.' };

    const acceptedTimestamp = new Date().toLocaleString('vi-VN');
    const author = currentUser || accounts[0];

    setHandovers((prev) =>
      prev.map((h) => {
        if (h.id !== handoverId) return h;
        return {
          ...h,
          status: 'accepted',
          acceptedAt: acceptedTimestamp,
        };
      })
    );

    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === handover.fromShiftId) return { ...s, status: 'completed' };
        if (s.id === handover.toShiftId) return { ...s, status: 'ongoing' };
        return s;
      })
    );

    setPendingTasks((prev) =>
      prev.map((t) => {
        if (handover.pendingTaskIds.includes(t.id) && t.status !== 'completed') {
          return {
            ...t,
            sourceShiftId: handover.toShiftId,
            notes: `${t.notes ? t.notes + '\n' : ''}[Bàn giao ${acceptedTimestamp} bởi ${author?.name || 'GVT'}]`,
          };
        }
        return t;
      })
    );

    updateTimestamp();
    showToast('Xác nhận tiếp nhận ca thành công! Ca mới đã bắt đầu.');
    return { success: true };
  };

  // Coordination (Phối hợp)
  const addCoordination = (coordData: Omit<RoomCoordination, 'id' | 'recordedDate'>) => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const newCoord: RoomCoordination = {
      ...coordData,
      id: `coord_${Date.now()}`,
      recordedDate: nowStr,
    };
    setCoordinations((prev) => [newCoord, ...prev]);
    updateTimestamp();
    showToast('Đã ghi nhận nội dung phối hợp thành công!');
    return { success: true };
  };

  const updateCoordinationStatus = (id: string, status: RoomCoordination['status'], resultNote?: string) => {
    setCoordinations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, resultNote: resultNote || c.resultNote } : c))
    );
    updateTimestamp();
    showToast('Đã cập nhật kết quả phối hợp.');
  };

  // Notices (Thông báo)
  const addNotice = (noticeData: Omit<RoomNotice, 'id' | 'postedDate'>) => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const newNotice: RoomNotice = {
      ...noticeData,
      id: `not_${Date.now()}`,
      postedDate: nowStr,
    };
    setNotices((prev) => [newNotice, ...prev]);
    updateTimestamp();
    showToast('Đã gửi thông báo cho phòng thành công!');
    return { success: true };
  };

  // Account Management (BGH only)
  const createAccount = (accData: Omit<UserAccount, 'id'>) => {
    if (accounts.some((a) => a.username.trim().toLowerCase() === accData.username.trim().toLowerCase())) {
      return { success: false, error: `Tên đăng nhập "${accData.username}" đã tồn tại.` };
    }

    if (accData.phone && accounts.some((a) => a.phone && normalizePhoneNumber(a.phone) === normalizePhoneNumber(accData.phone))) {
      return { success: false, error: `Số điện thoại ${accData.phone} đã tồn tại trên một tài khoản khác.` };
    }

    if (accData.email && accounts.some((a) => a.email && normalizeEmail(a.email) === normalizeEmail(accData.email))) {
      return { success: false, error: `Gmail ${accData.email} đã tồn tại trên một tài khoản khác.` };
    }

    const newId = `user_${Date.now()}`;
    const newAcc: UserAccount = {
      ...accData,
      id: newId,
      createdAt: new Date().toLocaleString('vi-VN'),
    };

    setAccounts((prev) => [...prev, newAcc]);

    const auditEntry: UserAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: 'create_account',
      performedBy: currentUser ? `${currentUser.name} (${currentUser.title})` : 'Ban Giám Hiệu',
      targetUser: `${newAcc.name} (${newAcc.username})`,
      details: `Khởi tạo tài khoản vai trò ${newAcc.role} (${newAcc.title}).`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    updateTimestamp();
    showToast(`Đã tạo tài khoản cho ${newAcc.name}!`);
    return { success: true };
  };

  const updateAccount = (acc: UserAccount) => {
    if (accounts.some((a) => a.id !== acc.id && a.username.trim().toLowerCase() === acc.username.trim().toLowerCase())) {
      return { success: false, error: `Tên đăng nhập "${acc.username}" bị trùng.` };
    }

    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));

    const auditEntry: UserAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: 'update_account',
      performedBy: currentUser ? `${currentUser.name} (${currentUser.title})` : 'Ban Giám Hiệu',
      targetUser: `${acc.name} (${acc.username})`,
      details: `Cập nhật thông tin tài khoản và phân quyền.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    updateTimestamp();
    showToast(`Đã cập nhật tài khoản ${acc.name}!`);
    return { success: true };
  };

  const toggleLockAccount = (userId: string) => {
    const target = accounts.find((a) => a.id === userId);
    if (!target) return { success: false, error: 'Không tìm thấy tài khoản.' };

    if (currentUser && currentUser.id === userId) {
      return { success: false, error: 'Không thể tự khóa tài khoản của chính mình.' };
    }

    const nextStatus = target.status === 'locked' ? 'active' : 'locked';
    setAccounts((prev) => prev.map((a) => (a.id === userId ? { ...a, status: nextStatus } : a)));

    const auditEntry: UserAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: nextStatus === 'locked' ? 'lock_account' : 'unlock_account',
      performedBy: currentUser ? `${currentUser.name} (${currentUser.title})` : 'Ban Giám Hiệu',
      targetUser: `${target.name} (${target.username})`,
      details: nextStatus === 'locked' ? 'Khóa tài khoản người dùng.' : 'Mở khóa tài khoản người dùng.',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    updateTimestamp();
    showToast(`Đã ${nextStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản ${target.name}.`);
    return { success: true };
  };

  /**
   * Thực hiện nhập dữ liệu từ Excel sau khi đã kiểm tra và người dùng xác nhận
   * Không âm thầm bỏ dòng lỗi hoặc ghi đè dữ liệu cũ
   * Tuân thủ lựa chọn 'skip' (bỏ qua dòng trùng) hoặc 'update' (cập nhật thông tin được phép)
   * Nhập giáo viên hoặc học sinh KHÔNG tự tạo tài khoản đăng nhập hay mật khẩu
   */
  const executeExcelImport = (
    dataType: ImportDataType,
    rows: any[],
    duplicateAction: 'skip' | 'update'
  ): { success: boolean; successCount: number; failedCount: number; message: string } => {
    let successCount = 0;
    let failedCount = 0;
    const nowStr = new Date().toLocaleString('vi-VN');
    const authorName = currentUser ? `${currentUser.name} (${currentUser.title || currentUser.role})` : 'Hệ thống';

    if (dataType === 'teachers') {
      rows.forEach((r) => {
        const mapped = r.mappedData;
        const code = mapped.code?.trim();
        const name = mapped.name?.trim();
        const phone = mapped.phone?.trim() || '';
        const email = mapped.email?.trim() || '';

        if (!code || !name) {
          failedCount++;
          return;
        }

        const existingIdx = accounts.findIndex((a) => a.code.toLowerCase() === code.toLowerCase());
        if (existingIdx >= 0) {
          if (duplicateAction === 'update') {
            // Update permitted profile info, DO NOT alter password or account permissions
            setAccounts((prev) =>
              prev.map((a, idx) =>
                idx === existingIdx
                  ? {
                      ...a,
                      name,
                      phone: phone || a.phone,
                      email: email || a.email,
                    }
                  : a
              )
            );
            successCount++;
          } else {
            // Skip
            failedCount++;
          }
        } else {
          // Add teacher profile record (Note: Not an active login account, no auto password)
          const newTeacherAcc: UserAccount = {
            id: `gv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            code,
            username: `gv.${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            password: '', // NO auto-password from phone
            name,
            role: 'giao_vien',
            phone,
            email,
            title: 'Giáo viên',
            status: 'active',
            createdAt: nowStr,
          };
          setAccounts((prev) => [...prev, newTeacherAcc]);
          successCount++;
        }
      });
    } else if (dataType === 'students') {
      rows.forEach((r) => {
        const mapped = r.mappedData;
        const code = mapped.code?.trim();
        const fullName = mapped.fullName?.trim();
        const eduLevelStr = mapped.educationLevel?.trim();
        const className = mapped.className?.trim();
        const roomCode = mapped.roomCode?.trim();
        const teacherCode = mapped.homeroomTeacherCode?.trim();
        const roleInRoomStr = mapped.roleInRoom?.trim();

        if (!code || !fullName) {
          failedCount++;
          return;
        }

        // Map education level
        const educationLevel: 'tieu_hoc' | 'thcs' =
          eduLevelStr === 'Tiểu học' ? 'tieu_hoc' : 'thcs';

        // Map role in room
        const roleInRoom: 'leader' | 'vice_leader' | 'member' =
          roleInRoomStr === 'Trưởng phòng'
            ? 'leader'
            : roleInRoomStr === 'Phó phòng'
            ? 'vice_leader'
            : 'member';

        // Find target room ID
        const targetRoom = roomCode
          ? rooms.find((rm) => rm.code.toLowerCase() === roomCode.toLowerCase())
          : undefined;
        const roomId = targetRoom ? targetRoom.id : '';

        // Find homeroom teacher name
        const teacherObj = teacherCode
          ? accounts.find((t) => t.code.toLowerCase() === teacherCode.toLowerCase())
          : undefined;
        const homeroomTeacherName = teacherObj ? teacherObj.name : teacherCode || '';

        const existingIdx = students.findIndex((s) => s.code.toLowerCase() === code.toLowerCase());
        if (existingIdx >= 0) {
          if (duplicateAction === 'update') {
            setStudents((prev) =>
              prev.map((s, idx) =>
                idx === existingIdx
                  ? {
                      ...s,
                      fullName,
                      educationLevel,
                      className: className || s.className,
                      roomId: roomId || s.roomId,
                      homeroomTeacherName: homeroomTeacherName || s.homeroomTeacherName,
                      roleInRoom,
                    }
                  : s
              )
            );
            successCount++;
          } else {
            failedCount++;
          }
        } else {
          const newStudent: Student = {
            id: `hs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            code,
            fullName,
            gender: 'nam', // Default gender, can be edited
            birthYear: educationLevel === 'tieu_hoc' ? 2016 : 2012,
            educationLevel,
            className,
            roomId,
            homeroomTeacherName,
            roleInRoom,
            boardingStatus: 'present',
          };
          setStudents((prev) => [...prev, newStudent]);
          successCount++;
        }
      });
    } else if (dataType === 'rooms') {
      rows.forEach((r) => {
        const mapped = r.mappedData;
        const code = mapped.code?.trim();
        const name = mapped.name?.trim();
        const building = (mapped.building?.trim() || 'U1').toUpperCase();
        const floor = parseInt(mapped.floor, 10) || 1;
        const capacity = parseInt(mapped.capacity, 10) || 8;

        if (!code || !name) {
          failedCount++;
          return;
        }

        const existingIdx = rooms.findIndex((rm) => rm.code.toLowerCase() === code.toLowerCase());
        if (existingIdx >= 0) {
          if (duplicateAction === 'update') {
            setRooms((prev) =>
              prev.map((rm, idx) =>
                idx === existingIdx
                  ? {
                      ...rm,
                      name,
                      building,
                      floor,
                      capacity,
                    }
                  : rm
              )
            );
            successCount++;
          } else {
            failedCount++;
          }
        } else {
          const newRoom: Room = {
            id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            code,
            name,
            capacity,
            building,
            floor,
            managerTeacherIds: ['', ''],
            status: 'active',
          };
          setRooms((prev) => [...prev, newRoom]);
          successCount++;
        }
      });
    } else if (dataType === 'room_assignments') {
      // Group by roomCode
      const assignmentsByRoom: Record<string, string[]> = {};
      rows.forEach((r) => {
        const rCode = r.mappedData.roomCode?.trim();
        const tCode = r.mappedData.teacherCode?.trim();
        const tObj = accounts.find((a) => a.code.toLowerCase() === tCode?.toLowerCase());
        if (rCode && tObj) {
          if (!assignmentsByRoom[rCode]) {
            assignmentsByRoom[rCode] = [];
          }
          if (!assignmentsByRoom[rCode].includes(tObj.id)) {
            assignmentsByRoom[rCode].push(tObj.id);
          }
        }
      });

      Object.entries(assignmentsByRoom).forEach(([rCode, teacherIds]) => {
        const targetRoom = rooms.find((rm) => rm.code.toLowerCase() === rCode.toLowerCase());
        if (targetRoom) {
          setRooms((prev) =>
            prev.map((rm) => {
              if (rm.id === targetRoom.id) {
                const current = [...rm.managerTeacherIds];
                const updatedIds: [string, string] = [
                  teacherIds[0] || current[0] || '',
                  teacherIds[1] || current[1] || '',
                ];
                return {
                  ...rm,
                  managerTeacherIds: updatedIds,
                };
              }
              return rm;
            })
          );
          successCount++;
        } else {
          failedCount++;
        }
      });
    } else if (dataType === 'shifts') {
      // Group rows by shiftCode
      const shiftsMap: Record<string, { startTime: string; endTime: string; assignments: { teacherId: string; teacherName: string; roomIds: string[] }[] }> = {};

      rows.forEach((r) => {
        const sCode = r.mappedData.shiftCode?.trim();
        const startTime = r.mappedData.startTime?.trim();
        const endTime = r.mappedData.endTime?.trim();
        const tCode = r.mappedData.teacherCode?.trim();
        const rCode = r.mappedData.roomCode?.trim();

        const tObj = accounts.find((a) => a.code.toLowerCase() === tCode?.toLowerCase());
        const rObj = rooms.find((rm) => rm.code.toLowerCase() === rCode?.toLowerCase());

        if (sCode && tObj && rObj) {
          if (!shiftsMap[sCode]) {
            shiftsMap[sCode] = {
              startTime,
              endTime,
              assignments: [],
            };
          }

          const existingAss = shiftsMap[sCode].assignments.find((a) => a.teacherId === tObj.id);
          if (existingAss) {
            if (!existingAss.roomIds.includes(rObj.id)) {
              existingAss.roomIds.push(rObj.id);
            }
          } else {
            shiftsMap[sCode].assignments.push({
              teacherId: tObj.id,
              teacherName: tObj.name,
              roomIds: [rObj.id],
            });
          }
        }
      });

      Object.entries(shiftsMap).forEach(([code, data]) => {
        const existingIdx = shifts.findIndex((s) => s.code.toLowerCase() === code.toLowerCase());
        if (existingIdx >= 0) {
          if (duplicateAction === 'update') {
            setShifts((prev) =>
              prev.map((s, idx) =>
                idx === existingIdx
                  ? {
                      ...s,
                      startTime: data.startTime,
                      endTime: data.endTime,
                      assignments: data.assignments,
                    }
                  : s
              )
            );
            successCount++;
          } else {
            failedCount++;
          }
        } else {
          const newShift: Shift = {
            id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            code,
            date: data.startTime.split(' ')[0] || new Date().toISOString().split('T')[0],
            startTime: data.startTime,
            endTime: data.endTime,
            status: 'scheduled',
            assignments: data.assignments,
          };
          setShifts((prev) => [...prev, newShift]);
          successCount++;
        }
      });
    }

    // Save Import History Log
    const typeLabelMap: Record<ImportDataType, string> = {
      teachers: 'Giáo viên',
      students: 'Học sinh',
      rooms: 'Phòng nội trú',
      room_assignments: 'Phân công quản lý phòng',
      shifts: 'Phân công ca trực',
    };

    const newLog: ImportHistoryEntry = {
      id: `imp_${Date.now()}`,
      timestamp: nowStr,
      importedBy: authorName,
      dataType,
      dataTypeLabel: typeLabelMap[dataType],
      totalRows: rows.length,
      successCount,
      failedCount,
      duplicateAction,
      details: `Nhập ${typeLabelMap[dataType]}: ${successCount} dòng thành công, ${failedCount} dòng thất bại/bỏ qua (${duplicateAction === 'update' ? 'Cập nhật dòng trùng' : 'Bỏ qua dòng trùng'}).`,
    };

    setImportHistory((prev) => [newLog, ...prev]);

    updateTimestamp();
    showToast(`Đã hoàn tất nhập dữ liệu ${typeLabelMap[dataType]}: ${successCount} thành công!`);

    return {
      success: true,
      successCount,
      failedCount,
      message: `Đã nhập thành công ${successCount}/${rows.length} dòng dữ liệu.`,
    };
  };

  // Optional preview loading for administrative testing
  const loadSimulatedData = () => {
    setRooms(DEMO_DATA.rooms);
    setStudents(DEMO_DATA.students);
    setShifts(DEMO_DATA.shifts);
    setDutyLogs(DEMO_DATA.dutyLogs);
    setReports(DEMO_DATA.reports);
    setPendingTasks(DEMO_DATA.pendingTasks);
    setHandovers(DEMO_DATA.handovers);
    setCoordinations(DEMO_DATA.coordinations);
    setNotices(DEMO_DATA.notices);
    setHasSimulatedData(true);
    updateTimestamp();
    showToast('Đã tải gói dữ liệu mô phỏng để quản trị viên xem trước.');
  };

  // Safely Clear simulated data without deleting user-created data
  const clearSimulatedData = () => {
    // Only remove mock objects (identified by standard mock ids)
    setRooms((prev) => prev.filter((r) => !['room_101', 'room_102', 'room_103', 'room_unassigned'].includes(r.id)));
    setStudents((prev) => prev.filter((s) => !s.id.startsWith('hs_101_') && !s.id.startsWith('hs_102_') && !s.id.startsWith('hs_103_')));
    setShifts((prev) => prev.filter((s) => !['shift_current', 'shift_next', 'shift_prev'].includes(s.id)));
    setDutyLogs((prev) => prev.filter((l) => !['log_01', 'log_02', 'log_03'].includes(l.id)));
    setReports((prev) => prev.filter((r) => !['rep_01', 'rep_02', 'rep_03'].includes(r.id)));
    setPendingTasks((prev) => prev.filter((t) => !['task_01', 'task_02', 'task_03', 'task_04'].includes(t.id)));
    setHandovers((prev) => prev.filter((h) => !['ho_01'].includes(h.id)));
    setCoordinations((prev) => prev.filter((c) => !['coord_01', 'coord_02'].includes(c.id)));
    setNotices((prev) => prev.filter((n) => !['not_01', 'not_02', 'not_03'].includes(n.id)));
    setHasSimulatedData(false);
    updateTimestamp();
    showToast('Đã dọn dẹp các mục dữ liệu mô phỏng. Dữ liệu thực tế được giữ nguyên.');
  };

  // Clear all data with explicit confirmation
  const clearAllUserDataWithConfirmation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAccounts([]);
    setCurrentUserId(null);
    setRooms([]);
    setStudents([]);
    setShifts([]);
    setDutyLogs([]);
    setReports([]);
    setPendingTasks([]);
    setHandovers([]);
    setCoordinations([]);
    setNotices([]);
    setAuditLogs([]);
    setRegistrationRequests([]);
    setPasswordResetRequests([]);
    setHasSimulatedData(false);
    updateTimestamp();
    showToast('Đã xóa sạch dữ liệu hệ thống về trạng thái khởi tạo trắng ban đầu.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        accounts,
        teachers,
        hasAdminAccount,
        loginWithIdentifier,
        logout,
        setupFirstAdminAccount,
        submitRegistration,
        registrationRequests,
        approveRegistration,
        rejectRegistration,
        passwordResetRequests,
        requestPasswordReset,
        adminResetPassword,
        rooms,
        students,
        shifts,
        dutyLogs,
        reports,
        pendingTasks,
        handovers,
        coordinations,
        notices,
        auditLogs,
        lastUpdated,
        currentShift,
        nextShift,
        previousShift,
        addRoom,
        updateRoom,
        deleteRoom,
        addStudent,
        updateStudent,
        deleteStudent,
        changeStudentRoom,
        createShift,
        updateShift,
        checkShiftOverlap,
        addDutyLog,
        createReport,
        assignReportHandler,
        updateReportStatus,
        updateTaskStatus,
        createHandover,
        acceptHandover,
        addCoordination,
        updateCoordinationStatus,
        addNotice,
        createAccount,
        updateAccount,
        toggleLockAccount,
        importHistory,
        executeExcelImport,
        toasts,
        showToast,
        removeToast,
        hasSimulatedData,
        loadSimulatedData,
        clearSimulatedData,
        clearAllUserDataWithConfirmation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
