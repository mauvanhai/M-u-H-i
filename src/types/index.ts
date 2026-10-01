export type UserRole = 'bgh' | 'quan_sinh' | 'giao_vien' | 'truong_phong';

export interface UserAccount {
  id: string;
  code: string;
  username: string;
  password?: string; // Optional/hashed or simulated
  passwordHash?: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  title: string;
  subject?: string;
  status: 'active' | 'locked';
  studentRoomId?: string; // ID phòng nếu là trưởng phòng học sinh
  studentId?: string;
  activeRoomsManaged?: string[]; // IDs of rooms where they are main manager
  createdAt?: string;
}

export type RegistrationRole = 'quan_sinh' | 'giao_vien' | 'truong_phong';

export interface RegistrationRequest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  requestedRole: RegistrationRole;
  passwordHash: string; // Stored hash (not plain text)
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  assignedRole?: UserRole;
  assignedStudentId?: string;
  assignedTeacherTitle?: string;
  rejectionReason?: string;
}

export interface PasswordResetRequest {
  id: string;
  accountIdentifier: string; // phone or email
  matchedUserId?: string;
  contactType: 'phone' | 'email';
  contactValue: string;
  status: 'pending_simulation' | 'completed';
  createdAt: string;
  notes: string;
}

export type EducationLevel = 'tieu_hoc' | 'thcs';
export type BuildingBlock = 'U1' | 'U2' | 'U3' | 'U4' | 'unassigned';

export interface Student {
  id: string;
  code: string; // Unique student code, e.g. HS-MS001
  fullName: string;
  gender: 'nam' | 'nu';
  birthYear: number;
  educationLevel: EducationLevel; // 'tieu_hoc' (Tiểu học) hoặc 'thcs' (Trung học cơ sở)
  className: string;
  roomId: string;
  homeroomTeacherName: string;
  roleInRoom: 'leader' | 'vice_leader' | 'member';
  boardingStatus: 'present' | 'on_leave' | 'absent' | 'sick';
  note?: string;
}

export interface RoomAssignmentHistory {
  id: string;
  timestamp: string;
  changedBy: string;
  type: 'manager_teachers' | 'leaders' | 'capacity' | 'general';
  description: string;
  previousValues?: string;
  newValues?: string;
}

export interface Room {
  id: string;
  code: string; // Mã phòng duy nhất, ví dụ U1-T1-P01, P.101...
  name: string; // Tên hoặc số phòng thực tế, ví dụ Phòng Sao Mai, P.101...
  capacity: number; // Sức chứa cấu hình được
  building: string; // 'U1' | 'U2' | 'U3' | 'U4' | 'unassigned' (Chưa gán dãy/tầng)
  floor: number; // 1 | 2 | 3 | 0 (0 = Chưa gán tầng)
  managerTeacherIds: [string, string]; // Hai giáo viên quản lý chính
  leaderStudentId?: string; // Trưởng phòng
  viceLeaderStudentId?: string; // Phó phòng
  status: 'active' | 'maintenance' | 'empty'; // 'active' (Hoạt động) | 'maintenance' (Bảo trì) | 'empty' (Trống / Chưa dùng)
  facilityNotes?: string;
  assignmentHistory?: RoomAssignmentHistory[];
}

export interface ShiftAssignment {
  teacherId: string;
  teacherName: string;
  roomIds: string[];
}

export interface Shift {
  id: string;
  code: string; // CA-20260930
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. 2026-09-30 07:00
  endTime: string;   // e.g. 2026-10-01 07:00 (24h default)
  status: 'scheduled' | 'ongoing' | 'completed';
  assignments: ShiftAssignment[];
  notes?: string;
}

export type LogCategory = 'hoc_tap' | 'sinh_hoat' | 'kiem_tra_phong' | 'khac';

export interface DutyLog {
  id: string;
  shiftId: string;
  roomId: string;
  roomCode: string;
  teacherId: string;
  teacherName: string;
  timestamp: string;
  category: LogCategory;
  content: string;
  actionTaken: string;
  followUpNeeded: string;
}

export interface RoomHandoverStatus {
  roomId: string;
  roomCode: string;
  totalStudents: number;
  presentStudents: number;
  leaveStudents: number;
  healthNote: string;
  hygieneStatus: string;
  equipmentStatus: string;
}

export interface HandoverNote {
  id: string;
  code: string;
  fromShiftId: string;
  fromShiftCode: string;
  toShiftId: string;
  toShiftCode: string;
  fromTeacherId: string;
  fromTeacherName: string;
  toTeacherId: string;
  toTeacherName: string;
  createdAt: string;
  acceptedAt?: string;
  status: 'draft' | 'pending' | 'accepted';
  roomStatuses: RoomHandoverStatus[];
  pendingTaskIds: string[];
  generalNotes: string;
}

export type ReportPriority = 'normal' | 'urgent';
export type ReportStatus = 'new' | 'accepted' | 'processing' | 'completed';

export interface StatusHistoryEntry {
  status: ReportStatus;
  updatedBy: string;
  timestamp: string;
  note?: string;
}

export interface QuickReport {
  id: string;
  code: string;
  title: string;
  content: string;
  roomId: string;
  roomCode: string;
  studentId?: string;
  studentName?: string;
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  createdAt: string;
  priority: ReportPriority;
  status: ReportStatus;
  assignedToId?: string;
  assignedToName?: string;
  resolutionNote?: string;
  statusHistory: StatusHistoryEntry[];
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  roomId: string;
  roomCode: string;
  studentId?: string;
  sourceReportId?: string;
  sourceShiftId: string;
  assignedToTeacherId?: string;
  assignedToTeacherName?: string;
  priority: ReportPriority;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  notes?: string;
  deadline?: string;
}

export interface RoomCoordination {
  id: string;
  roomId: string;
  roomCode: string;
  studentId?: string;
  studentName?: string;
  targetParty: 'gia_dinh' | 'gvcn' | 'y_te' | 'bgh' | 'khac';
  targetPartyName: string;
  content: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  recordedDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  resultNote?: string;
}

export interface RoomNotice {
  id: string;
  roomId: string;
  roomCode: string;
  title: string;
  content: string;
  postedBy: string;
  postedDate: string;
  priority: 'normal' | 'important';
}

export interface UserAuditEntry {
  id: string;
  timestamp: string;
  action: 'create_account' | 'update_account' | 'lock_account' | 'unlock_account' | 'change_role';
  performedBy: string;
  targetUser: string;
  details: string;
}

export type ImportDataType = 'teachers' | 'students' | 'rooms' | 'room_assignments' | 'shifts';

export interface ImportHistoryEntry {
  id: string;
  timestamp: string;
  importedBy: string;
  dataType: ImportDataType;
  dataTypeLabel: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  duplicateAction: 'skip' | 'update';
  details?: string;
}

