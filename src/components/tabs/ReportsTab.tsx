import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  PhoneCall,
  History,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReportPriority, ReportStatus, QuickReport, PendingTask } from '../../types';
import { canAssignTask, canUpdateReport } from '../../services/permissions';
import { ExportReportSection } from './ExportReportSection';

interface ReportsTabProps {
  onOpenQuickReportModal: (roomId?: string) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ onOpenQuickReportModal }) => {
  const {
    reports,
    pendingTasks,
    teachers,
    currentUser,
    assignReportHandler,
    updateReportStatus,
    updateTaskStatus,
  } = useApp();

  if (!currentUser) return null;

  const [activeView, setActiveView] = useState<'reports' | 'tasks' | 'export'>('reports');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal: Assign handler
  const [assigningReport, setAssigningReport] = useState<QuickReport | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState('');

  // Modal: Update status & resolution note
  const [updatingReport, setUpdatingReport] = useState<QuickReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('processing');
  const [resolutionNote, setResolutionNote] = useState('');

  // Modal: Status history log
  const [viewHistoryReport, setViewHistoryReport] = useState<QuickReport | null>(null);

  const canAssign = canAssignTask(currentUser.role);

  const filteredReports = reports.filter((rep) => {
    const matchPri = filterPriority === 'all' || rep.priority === filterPriority;
    const matchSta = filterStatus === 'all' || rep.status === filterStatus;
    return matchPri && matchSta;
  });

  const handleOpenAssignModal = (rep: QuickReport) => {
    setAssigningReport(rep);
    setSelectedTeacherId(rep.assignedToId || teachers[0]?.id || '');
    setAssignmentNote(rep.resolutionNote || '');
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReport || !selectedTeacherId) return;

    const res = assignReportHandler(assigningReport.id, selectedTeacherId, assignmentNote);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setAssigningReport(null);
  };

  const handleOpenUpdateStatusModal = (rep: QuickReport) => {
    setUpdatingReport(rep);
    setNewStatus(rep.status);
    setResolutionNote(rep.resolutionNote || '');
  };

  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingReport) return;

    const res = updateReportStatus(updatingReport.id, newStatus, resolutionNote);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setUpdatingReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Báo Cáo Nhanh & Điều Phối Công Việc
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp nhận sự vụ đột xuất, phân loại mức độ khẩn cấp, phân công người xử lý và theo dõi tiến độ giải quyết.
          </p>
        </div>

        <button
          onClick={() => onOpenQuickReportModal()}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo báo cáo nhanh mới</span>
        </button>
      </div>

      {/* Safety Notice Warning */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-xs text-red-900 flex items-start gap-3">
        <PhoneCall className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-red-950">Quy định an toàn & phản ứng nhanh:</strong>
          <p className="mt-0.5 text-red-800 leading-relaxed">
            Các trường hợp học sinh sốt cao, chấn thương hoặc sự cố an ninh nghiêm trọng cần được <strong>liên hệ trực tiếp qua điện thoại</strong> tới
            Ban giám hiệu, Cán bộ y tế hoặc Quản sinh trực để được cấp cứu kịp thời. Không coi ứng dụng là kênh đảm bảo phản ứng khẩn cấp tức thời!
          </p>
        </div>
      </div>

      {/* View Switcher: Reports vs Tasks */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveView('reports')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeView === 'reports'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Danh Sách Báo Cáo ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveView('tasks')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeView === 'tasks'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Công Việc Đang Theo Dõi ({pendingTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveView('export')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeView === 'export'
              ? 'border-blue-600 text-blue-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Báo Cáo Word / Excel & Zalo</span>
        </button>
      </div>

      {/* VIEW 1: REPORTS */}
      {activeView === 'reports' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lọc báo cáo:
            </span>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Tất cả mức ưu tiên</option>
              <option value="urgent">Cần xử lý sớm (Khẩn)</option>
              <option value="normal">Thông thường</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Mới gửi</option>
              <option value="accepted">Đã tiếp nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>

          {/* Reports Grid */}
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const isUrgent = report.priority === 'urgent';
              const canUpdate = canUpdateReport(currentUser, report);

              const statusBadge = {
                new: { label: 'Mới gửi', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                accepted: { label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-900 border-blue-300' },
                processing: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-900 border-purple-300' },
                completed: { label: 'Đã hoàn thành', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
              }[report.status];

              return (
                <div
                  key={report.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-3.5 ${
                    isUrgent && report.status !== 'completed'
                      ? 'border-red-300 ring-2 ring-red-50'
                      : 'border-slate-200/80'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-800">{report.code}</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {report.roomCode}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                          isUrgent ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isUrgent ? 'CẦN XỬ LÝ SỚM' : 'Thông thường'}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="text-slate-400 font-mono text-[11px]">
                      {report.createdAt}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{report.content}</p>
                  </div>

                  {/* Student & Reporter Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Học sinh liên quan:</span>
                      <span className="font-semibold text-slate-800">
                        {report.studentName || 'Không xác định / Sự cố chung'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Người báo cáo:</span>
                      <span className="font-semibold text-slate-800">
                        {report.reporterName} ({report.reporterRole})
                      </span>
                    </div>
                  </div>

                  {/* Assigned Handler & Resolution notes */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Người được giao phụ trách:</span>
                      <span className="font-bold text-slate-900">
                        {report.assignedToName || 'Chưa phân công'}
                      </span>
                    </div>

                    {report.resolutionNote && (
                      <div className="pt-1 text-slate-700">
                        <strong className="text-slate-900">Phản hồi / Ghi chú xử lý:</strong> {report.resolutionNote}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setViewHistoryReport(report)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Xem lịch sử ({report.statusHistory.length} mốc)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {canAssign && (
                        <button
                          onClick={() => handleOpenAssignModal(report)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                        >
                          Giao người xử lý
                        </button>
                      )}

                      {canUpdate && (
                        <button
                          onClick={() => handleOpenUpdateStatusModal(report)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                        >
                          Cập nhật tiến độ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Không tìm thấy báo cáo nào phù hợp với bộ lọc.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TASKS */}
      {activeView === 'tasks' && (
        <div className="space-y-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <strong>Ghi chú:</strong> Danh sách công việc chưa hoàn thành được tự động chuyển giao và liên kết sang các ca trực tiếp theo, đảm bảo lịch sử và không bị bỏ quên.
          </div>

          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {pendingTasks.map((task) => {
              const isDone = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <div key={task.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        {task.roomCode}
                      </span>
                      <span className={`font-bold text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                      {task.priority === 'urgent' && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Khẩn
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px]">{task.description}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Tạo lúc: {task.createdAt}</span>
                      {task.assignedToTeacherName && (
                        <span>• Phụ trách: <strong>{task.assignedToTeacherName}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'pending')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                        task.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Chờ xử lý
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                        isInProgress
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Đang xử lý
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                        isDone
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Hoàn thành
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: EXPORT WORD, EXCEL & ZALO */}
      {activeView === 'export' && <ExportReportSection />}

      {/* Modal: Assign Handler */}
      {assigningReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Giao Người Xử Lý Báo Cáo</h3>
            <p className="text-xs text-slate-500 mb-4">{assigningReport.title}</p>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn giáo viên / cán bộ:</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chỉ đạo / Hướng dẫn giải quyết:</label>
                <textarea
                  rows={3}
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="Ghi rõ yêu cầu xử lý..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Xác nhận giao việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Status */}
      {updatingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Cập Nhật Tiến Độ & Phản Hồi</h3>
            <p className="text-xs text-slate-500 mb-4">{updatingReport.title}</p>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Trạng thái mới:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="accepted">Đã tiếp nhận</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung phản hồi / kết quả xử lý:</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Ghi rõ hành động đã thực hiện hoặc kết quả theo dõi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Status History */}
      {viewHistoryReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Lịch Sử Cập Nhật Báo Cáo</h3>
              <button onClick={() => setViewHistoryReport(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
              {viewHistoryReport.statusHistory.map((h, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-emerald-800 uppercase font-bold">{h.status}</span>
                    <span className="text-slate-400 text-[11px]">{h.timestamp}</span>
                  </div>
                  <div className="text-slate-700">
                    Cập nhật bởi: <strong>{h.updatedBy}</strong>
                  </div>
                  {h.note && <div className="text-slate-500 italic mt-0.5">"{h.note}"</div>}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end mt-4">
              <button
                onClick={() => setViewHistoryReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
