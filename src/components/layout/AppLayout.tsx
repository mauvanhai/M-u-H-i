import React, { useState } from 'react';
import {
  School,
  LayoutDashboard,
  DoorClosed,
  GraduationCap,
  Users,
  CalendarDays,
  BookOpenCheck,
  AlertTriangle,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  ClipboardList,
  MessageSquare,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS } from '../../services/permissions';
import { DemoBanner } from '../DemoBanner';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const {
    currentUser,
    logout,
    lastUpdated,
    reports,
    pendingTasks,
    currentShift,
    rooms,
    toasts,
    removeToast,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!currentUser) return null;

  const roleDef = ROLE_DEFINITIONS[currentUser.role];
  const urgentReportsCount = reports.filter((r) => r.priority === 'urgent' && r.status !== 'completed').length;
  const pendingTasksCount = pendingTasks.filter((t) => t.status !== 'completed').length;

  // Determine user duty context string
  let userContextInfo = '';
  if (currentUser.role === 'truong_phong') {
    const room = rooms.find((r) => r.id === currentUser.studentRoomId);
    userContextInfo = room ? `Phòng ${room.code} - ${room.name}` : 'Trưởng phòng';
  } else if (currentUser.role === 'giao_vien') {
    const managedCodes = (currentUser.activeRoomsManaged || [])
      .map((rid) => rooms.find((r) => r.id === rid)?.code)
      .filter(Boolean);
    const isDutyToday = currentShift?.assignments.some((a) => a.teacherId === currentUser.id);

    const parts = [];
    if (managedCodes.length > 0) parts.push(`GVQL ${managedCodes.join(', ')}`);
    if (isDutyToday) parts.push(`Trực ca hôm nay (${currentShift?.code})`);
    userContextInfo = parts.join(' • ') || 'Giáo viên';
  } else if (currentUser.role === 'quan_sinh') {
    userContextInfo = 'Quản lý 4 dãy nhà U1-U4 & ca trực';
  } else if (currentUser.role === 'bgh') {
    userContextInfo = 'Quản trị viên toàn trường';
  }

  // Navigation Items per Role
  let navItems: { id: string; label: string; icon: any; badge?: number; badgeUrgent?: boolean }[] = [];

  if (currentUser.role === 'bgh') {
    navItems = [
      { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { id: 'rooms', label: 'Khu nội trú', icon: DoorClosed },
      { id: 'students', label: 'Học sinh', icon: GraduationCap },
      { id: 'teachers_assignment', label: 'Giáo viên & Phân công', icon: Users },
      { id: 'shifts', label: 'Ca trực & Bàn giao', icon: CalendarDays },
      {
        id: 'reports',
        label: 'Báo cáo & Công việc',
        icon: AlertTriangle,
        badge: urgentReportsCount > 0 ? urgentReportsCount : undefined,
        badgeUrgent: urgentReportsCount > 0,
      },
      { id: 'import_data', label: 'Nhập dữ liệu Excel', icon: Upload },
      { id: 'accounts', label: 'Tài khoản & Phân quyền', icon: ShieldCheck },
      { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
    ];
  } else if (currentUser.role === 'quan_sinh') {
    navItems = [
      { id: 'rooms', label: 'Khu nội trú', icon: DoorClosed },
      { id: 'students', label: 'Danh sách học sinh', icon: GraduationCap },
      { id: 'shifts', label: 'Ca trực & Bàn giao', icon: CalendarDays },
      {
        id: 'reports',
        label: 'Báo cáo & Theo dõi',
        icon: AlertTriangle,
        badge: urgentReportsCount > 0 ? urgentReportsCount : undefined,
      },
      { id: 'logs', label: 'Nhật ký ca', icon: BookOpenCheck },
    ];
  } else if (currentUser.role === 'giao_vien') {
    navItems = [
      { id: 'teacher_desk', label: 'Bàn làm việc của tôi', icon: LayoutDashboard },
      { id: 'rooms', label: 'Khu nội trú (Phân công)', icon: DoorClosed },
      { id: 'logs', label: 'Nhật kí ca trực', icon: BookOpenCheck },
      {
        id: 'reports',
        label: 'Báo cáo & Phối hợp',
        icon: AlertTriangle,
        badge: urgentReportsCount > 0 ? urgentReportsCount : undefined,
      },
      { id: 'shifts', label: 'Ca trực 24h & Bàn giao', icon: CalendarDays },
    ];
  } else if (currentUser.role === 'truong_phong') {
    navItems = [
      { id: 'student_captain', label: 'Bàn làm việc Trưởng phòng', icon: ClipboardList },
      { id: 'rooms', label: 'Khu nội trú (Phòng tôi)', icon: DoorClosed },
    ];
  }

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION (Thanh điều hướng bên trái) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-slate-200 flex-col shrink-0 sticky top-0 h-screen z-20 shadow-xs">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              PTDTNT MẪU SƠN
            </h1>
            <p className="text-[11px] text-blue-700 font-bold truncate">Quản Lý Nội Trú</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 my-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser.name.slice(-1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleDef.badgeColor}`}>
                {roleDef.title}
              </span>
            </div>
          </div>
          {userContextInfo && (
            <p className="text-[10px] text-blue-800 font-medium mt-2 pt-1.5 border-t border-blue-200/60 leading-tight">
              {userContextInfo}
            </p>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 px-2">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Cập nhật: {lastUpdated.split(' ')[0]}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE TOP BAR (Menu thu gọn trên điện thoại) */}
      {/* ========================================================================= */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">PTDTNT MẪU SƠN</h1>
            <p className="text-[10px] text-blue-700 font-semibold">{currentUser.name} • {roleDef.title}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-blue-800">MENU ĐIỀU HƯỚNG</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 text-xs space-y-1">
              <div className="font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500">{roleDef.title}</div>
              {userContextInfo && <div className="text-[10px] text-blue-700 font-medium">{userContextInfo}</div>}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto py-2 border-t border-slate-100 text-xs font-medium">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg ${
                      isActive ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto py-2.5 px-3 rounded-lg text-xs font-bold text-red-700 bg-red-50 border border-red-200 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <DemoBanner />

        {/* Floating Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl shadow-lg border text-xs flex items-start gap-2.5 pointer-events-auto transition-all animate-in slide-in-from-top-2 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-semibold">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 -mr-1 -mt-1 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
            <p className="text-xs text-slate-600 text-center mt-1.5 leading-relaxed">
              Thầy/Cô/Em có chắc chắn muốn đăng xuất khỏi tài khoản{' '}
              <strong className="text-slate-900">{currentUser.name}</strong> không?
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
