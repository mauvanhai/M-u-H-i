import { UserRole, QuickReport, Shift, Room, UserAccount } from '../types';

/**
 * QUY TẮC PHÂN QUYỀN HỆ THỐNG NỘI TRÚ
 * Trường Phổ thông nội trú TH & THCS Mẫu Sơn
 * 
 * 4 Nhóm đối tượng tài khoản:
 * 1. Ban giám hiệu (Toàn bộ quyền trong ứng dụng)
 * 2. Quản sinh (Xem tất cả các phòng, theo dõi ca trực & báo cáo)
 * 3. Giáo viên (Bao gồm cả nhiệm vụ Quản lý phòng và Trực ca theo phân công)
 * 4. Trưởng phòng học sinh (Chỉ xem nhiệm vụ, thông báo và báo cáo phòng mình)
 */

export interface RoleDefinition {
  code: UserRole;
  title: string;
  description: string;
  badgeColor: string;
  canViewAllRooms: boolean;
  canManageRooms: boolean;
  canManageStudents: boolean;
  canAssignTeachersToRooms: boolean;
  canManageShifts: boolean;
  canAssignHandlers: boolean;
  canManageAccounts: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  bgh: {
    code: 'bgh',
    title: 'Ban Giám Hiệu',
    description: 'Cấp quản trị cao nhất: toàn quyền truy cập, phân công giáo viên, quản lý tài khoản, phòng và ca trực.',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    canViewAllRooms: true,
    canManageRooms: true,
    canManageStudents: true,
    canAssignTeachersToRooms: true,
    canManageShifts: true,
    canAssignHandlers: true,
    canManageAccounts: true,
  },
  quan_sinh: {
    code: 'quan_sinh',
    title: 'Quản Sinh',
    description: 'Theo dõi toàn bộ các phòng, danh sách học sinh và giáo viên trực; theo dõi bàn giao và báo cáo.',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    canViewAllRooms: true,
    canManageRooms: false,
    canManageStudents: true,
    canAssignTeachersToRooms: false,
    canManageShifts: false,
    canAssignHandlers: false,
    canManageAccounts: false,
  },
  giao_vien: {
    code: 'giao_vien',
    title: 'Giáo Viên',
    description: 'Đảm nhận nhiệm vụ quản lý phòng (GVQL) và/hoặc trực ca 24h (GVT) theo phân công thực tế của trường.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    canViewAllRooms: false,
    canManageRooms: false,
    canManageStudents: false,
    canAssignTeachersToRooms: false,
    canManageShifts: false,
    canAssignHandlers: false,
    canManageAccounts: false,
  },
  truong_phong: {
    code: 'truong_phong',
    title: 'Trưởng Phòng Học Sinh',
    description: 'Học sinh trưởng phòng: nhận nhiệm vụ giáo viên giao, cập nhật tiến độ và báo cáo tình hình phòng mình.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    canViewAllRooms: false,
    canManageRooms: false,
    canManageStudents: false,
    canAssignTeachersToRooms: false,
    canManageShifts: false,
    canAssignHandlers: false,
    canManageAccounts: false,
  },
};

/**
 * Kiểm tra xem người dùng có được phép xem phòng cụ thể không
 */
export function canViewRoom(
  user: UserAccount,
  room: Room,
  currentShift?: Shift,
  allShifts?: Shift[]
): boolean {
  if (user.role === 'bgh' || user.role === 'quan_sinh') {
    return true;
  }

  if (user.role === 'truong_phong') {
    return user.studentRoomId === room.id;
  }

  if (user.role === 'giao_vien') {
    // 1. Giáo viên quản lý chính của phòng này (GVQL)
    if (room.managerTeacherIds.includes(user.id)) return true;

    // 2. Giáo viên trực ca hôm nay được phân công phòng này (GVT)
    if (currentShift) {
      const assignment = currentShift.assignments.find((a) => a.teacherId === user.id);
      if (assignment && assignment.roomIds.includes(room.id)) return true;
    }

    // 3. Giáo viên được phân công trong ca trực đang diễn ra hoặc sắp tới
    if (allShifts) {
      const isAssigned = allShifts.some(
        (s) =>
          (s.status === 'ongoing' || s.status === 'scheduled') &&
          s.assignments.some((a) => a.teacherId === user.id && a.roomIds.includes(room.id))
      );
      if (isAssigned) return true;
    }

    return false;
  }

  return false;
}

/**
 * Kiểm tra quyền xem mục Phối Hợp (chỉ BGH, Quản sinh, và GVQL phòng)
 * Trưởng phòng HS TUYỆT ĐỐI không được xem thông tin gia đình/phối hợp riêng
 */
export function canViewCoordination(user: UserAccount, room: Room): boolean {
  if (user.role === 'bgh' || user.role === 'quan_sinh') return true;
  if (user.role === 'giao_vien') {
    return room.managerTeacherIds.includes(user.id);
  }
  return false;
}

/**
 * Kiểm tra quyền ghi nhật ký ca trực
 */
export function canCreateDutyLog(
  user: UserAccount,
  room: Room,
  currentShift?: Shift
): { allowed: boolean; reason?: string } {
  if (user.role === 'bgh' || user.role === 'quan_sinh') {
    return { allowed: true };
  }

  if (user.role === 'truong_phong') {
    return { allowed: false, reason: 'Học sinh trưởng phòng không thực hiện ghi nhật ký giáo viên.' };
  }

  if (user.role === 'giao_vien') {
    // Is on duty supervising this room?
    if (currentShift && currentShift.status === 'ongoing') {
      const assignment = currentShift.assignments.find((a) => a.teacherId === user.id);
      if (assignment && assignment.roomIds.includes(room.id)) {
        return { allowed: true };
      }
    }

    // Is GVQL of this room?
    if (room.managerTeacherIds.includes(user.id)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Phòng này không thuộc phạm vi ca trực hoặc quản lý chính được phân công của thầy/cô.',
    };
  }

  return { allowed: false, reason: 'Không có quyền ghi nhật ký.' };
}

/**
 * Kiểm tra quyền quản lý học sinh (thêm, sửa, xóa, chuyển phòng)
 */
export function canManageStudents(role: UserRole): boolean {
  return role === 'bgh' || role === 'quan_sinh';
}

/**
 * Kiểm tra quyền khởi tạo lập phiếu bàn giao ca
 */
export function canInitiateHandover(
  role: UserRole,
  currentShift?: Shift,
  userId?: string
): boolean {
  if (role === 'bgh' || role === 'quan_sinh') return true;
  if (role === 'giao_vien' && currentShift && currentShift.status === 'ongoing' && userId) {
    return currentShift.assignments.some((a) => a.teacherId === userId);
  }
  return false;
}

/**
 * Kiểm tra quyền tiếp nhận biên bản bàn giao ca
 */
export function canAcceptHandover(
  role: UserRole,
  nextShift?: Shift,
  userId?: string
): boolean {
  if (role === 'bgh' || role === 'quan_sinh') return true;
  if (role === 'giao_vien' && userId) {
    if (nextShift && nextShift.assignments.some((a) => a.teacherId === userId)) return true;
    return true;
  }
  return false;
}

/**
 * Kiểm tra quyền quản lý tài khoản & phân quyền (Chỉ BGH)
 */
export function canManageAccounts(role: UserRole): boolean {
  return role === 'bgh';
}

/**
 * Kiểm tra quyền chỉnh sửa cấu hình phòng (Chỉ BGH)
 */
export function canEditRoom(role: UserRole): boolean {
  return role === 'bgh';
}

/**
 * Kiểm tra quyền quản lý ca trực (Chỉ BGH)
 */
export function canManageShifts(role: UserRole): boolean {
  return role === 'bgh';
}

/**
 * Kiểm tra quyền giao người xử lý báo cáo
 */
export function canAssignTask(role: UserRole): boolean {
  return role === 'bgh';
}

/**
 * Kiểm tra quyền cập nhật trạng thái báo cáo
 */
export function canUpdateReport(user: UserAccount, report: QuickReport): boolean {
  if (user.role === 'bgh' || user.role === 'quan_sinh') return true;
  if (report.assignedToId === user.id) return true;
  if (report.reporterId === user.id) return true;
  return false;
}
