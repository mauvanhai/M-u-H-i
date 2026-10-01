import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Share2,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  DoorClosed,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canViewRoom } from '../../services/permissions';
import {
  ReportFilterOptions,
  buildFilteredReportData,
  generateWordReportDocx,
} from '../../services/reportExportService';
import { generateExcelReportXlsx } from '../../services/excelReportService';
import { ZaloShareModal } from '../modals/ZaloShareModal';

export const ExportReportSection: React.FC = () => {
  const { rooms, students, shifts, reports, accounts, currentUser } = useApp();

  // Filter States
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Preview & Export States
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [previewSubTab, setPreviewSubTab] = useState<'summary' | 'rooms' | 'students' | 'reports'>('summary');

  if (!currentUser) return null;

  // 1. Enforce RBAC: Only include rooms that this user has permission to view
  const accessibleRooms = useApp().rooms.filter((r) => canViewRoom(currentUser, r, shifts.find((s) => s.status === 'ongoing'), shifts));

  // Build account name map for teacher lookups
  const accountNames: Record<string, string> = {};
  accounts.forEach((a) => {
    accountNames[a.id] = a.name;
    if (a.code) accountNames[a.code] = a.name;
  });

  const filterOptions: ReportFilterOptions = {
    dateRange: filterDateRange,
    building: filterBuilding,
    floor: filterFloor,
    roomId: filterRoomId,
    status: filterStatus,
  };

  // Build report data matching current filters and permissions
  const reportData = useMemo(() => {
    return buildFilteredReportData(
      filterOptions,
      {
        rooms: accessibleRooms,
        students,
        shifts,
        reports,
      },
      accountNames,
      `${currentUser.name} (${currentUser.title || currentUser.role})`
    );
  }, [filterDateRange, filterBuilding, filterFloor, filterRoomId, filterStatus, accessibleRooms, students, shifts, reports, accounts, currentUser]);

  // Handlers
  const handleExportWord = async () => {
    if (reportData.rooms.length === 0 && reportData.students.length === 0) {
      alert('Không có dữ liệu trong phạm vi bộ lọc đã chọn để xuất file Word.');
      return;
    }

    setIsExportingWord(true);
    try {
      const blob = await generateWordReportDocx(reportData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCao_NoiTru_MauSon_${Date.now().toString().slice(-4)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Không thể tạo file Word. Vui lòng kiểm tra lại trình duyệt.');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.rooms.length === 0 && reportData.students.length === 0) {
      alert('Không có dữ liệu trong phạm vi bộ lọc đã chọn để xuất file Excel.');
      return;
    }
    try {
      generateExcelReportXlsx(reportData);
    } catch (err) {
      console.error(err);
      alert('Không thể tạo file Excel. Vui lòng thử lại.');
    }
  };

  const handleOpenZaloShare = () => {
    setIsZaloModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>Xuất Báo Cáo & Chia Sẻ Khu Nội Trú</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lọc theo thời gian, dãy nhà, tầng, phòng và trạng thái. Xem trước số liệu trực tiếp, xuất file Word (.docx) hoặc Excel (.xlsx) chuẩn và chia sẻ tóm tắt qua Zalo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportWord}
            disabled={isExportingWord}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingWord ? 'Đang tạo Word...' : 'Xuất Word (.docx)'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleOpenZaloShare}
            className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ qua Zalo</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Bộ Lọc Dữ Liệu Báo Cáo:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* 1. Time Range */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Thời gian</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay (24h qua)</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
            </select>
          </div>

          {/* 2. Building */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Dãy nhà</label>
            <select
              value={filterBuilding}
              onChange={(e) => {
                setFilterBuilding(e.target.value);
                setFilterRoomId('all'); // Reset room selection
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="all">Tất cả dãy nhà (U1-U4)</option>
              <option value="U1">Dãy U1</option>
              <option value="U2">Dãy U2</option>
              <option value="U3">Dãy U3</option>
              <option value="U4">Dãy U4</option>
            </select>
          </div>

          {/* 3. Floor */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Tầng</label>
            <select
              value={filterFloor}
              onChange={(e) => {
                setFilterFloor(e.target.value);
                setFilterRoomId('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="all">Tất cả các tầng</option>
              <option value="1">Tầng 1</option>
              <option value="2">Tầng 2</option>
              <option value="3">Tầng 3</option>
            </select>
          </div>

          {/* 4. Room */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Phòng cụ thể</label>
            <select
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="all">Tất cả các phòng</option>
              {accessibleRooms
                .filter((r) => filterBuilding === 'all' || r.building === filterBuilding)
                .filter((r) => filterFloor === 'all' || r.floor === parseInt(filterFloor, 10))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
            </select>
          </div>

          {/* 5. Status */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Trạng thái phòng</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="maintenance">Đang bảo trì</option>
              <option value="empty">Chưa sử dụng</option>
            </select>
          </div>
        </div>

        {/* Current filter scope badge */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Phạm vi áp dụng: <strong className="text-slate-700">{reportData.scopeDescription}</strong>
          </span>
          <span>
            Khớp: <strong className="text-emerald-700">{reportData.rooms.length} phòng</strong> •{' '}
            <strong className="text-blue-700">{reportData.students.length} học sinh</strong>
          </span>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Preview Header & Sub-tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm">Xem Trước Dữ Liệu Báo Cáo</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPreviewSubTab('summary')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                previewSubTab === 'summary'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Chỉ số tổng hợp
            </button>
            <button
              onClick={() => setPreviewSubTab('rooms')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                previewSubTab === 'rooms'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Danh sách phòng ({reportData.rooms.length})
            </button>
            <button
              onClick={() => setPreviewSubTab('students')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                previewSubTab === 'students'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Học sinh ({reportData.students.length})
            </button>
            <button
              onClick={() => setPreviewSubTab('reports')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                previewSubTab === 'reports'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sự vụ ({reportData.quickReports.length})
            </button>
          </div>
        </div>

        {/* Sub-tab 1: Summary Cards */}
        {previewSubTab === 'summary' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Tổng số phòng</span>
                <span className="text-2xl font-black text-slate-900">{reportData.summary.totalRooms}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Sức chứa: {reportData.summary.totalCapacity} chỗ</span>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-800 block mb-1">Tổng số học sinh</span>
                <span className="text-2xl font-black text-blue-950">{reportData.summary.totalStudents}</span>
                <span className="text-[10px] text-blue-700 block mt-1">Lấp đầy: {reportData.summary.occupancyRate}</span>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-800 block mb-1">Học sinh có mặt</span>
                <span className="text-2xl font-black text-emerald-950">{reportData.summary.studentsPresent}</span>
                <span className="text-[10px] text-emerald-700 block mt-1">Nghỉ phép: {reportData.summary.studentsLeave} • Ốm: {reportData.summary.studentsSick}</span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-800 block mb-1">Sự vụ ghi nhận</span>
                <span className="text-2xl font-black text-amber-950">{reportData.summary.totalReports}</span>
                <span className="text-[10px] text-amber-700 block mt-1">{reportData.summary.urgentReports} cần xử lý sớm/khẩn</span>
              </div>
            </div>

            {/* Empty check */}
            {reportData.rooms.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 2: Rooms Table */}
        {previewSubTab === 'rooms' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mã phòng</th>
                  <th className="py-3 px-4">Tên phòng</th>
                  <th className="py-3 px-4">Dãy / Tầng</th>
                  <th className="py-3 px-4">Học sinh / Sức chứa</th>
                  <th className="py-3 px-4">Giáo viên quản lý chính</th>
                  <th className="py-3 px-4">Ban cán sự phòng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rooms.map((r) => (
                  <tr key={r.code} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.name}</td>
                    <td className="py-3 px-4 text-slate-600">{r.building} - T{r.floor}</td>
                    <td className="py-3 px-4 font-bold text-blue-900">
                      {r.studentCount} / {r.capacity}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{r.managerTeachers}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{r.roomLeaders}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab 3: Students Table */}
        {previewSubTab === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mã HS</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Cấp học</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Chức danh</th>
                  <th className="py-3 px-4">Điểm danh</th>
                  <th className="py-3 px-4">GV Chủ nhiệm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.students.map((s) => (
                  <tr key={s.code} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.educationLevel}</td>
                    <td className="py-3 px-4 text-slate-700">{s.className}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{s.roomCode}</td>
                    <td className="py-3 px-4 text-slate-700">{s.roleInRoom}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                        {s.boardingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{s.homeroomTeacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab 4: Reports Table */}
        {previewSubTab === 'reports' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Tiêu đề sự vụ</th>
                  <th className="py-3 px-4">Ưu tiên</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Người báo cáo</th>
                  <th className="py-3 px-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.quickReports.map((rep) => (
                  <tr key={rep.code} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{rep.code}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{rep.roomCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{rep.title}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rep.priority.includes('Khẩn') ? 'bg-red-100 text-red-900' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rep.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{rep.status}</td>
                    <td className="py-3 px-4 text-slate-600">{rep.reporter}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{rep.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zalo Share Modal */}
      <ZaloShareModal
        isOpen={isZaloModalOpen}
        onClose={() => setIsZaloModalOpen(false)}
        reportData={reportData}
      />
    </div>
  );
};
