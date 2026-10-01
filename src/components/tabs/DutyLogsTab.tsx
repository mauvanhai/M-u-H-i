import React, { useState } from 'react';
import {
  BookOpenCheck,
  FileText,
  Send,
  Plus,
  Filter,
  Clock,
  DoorClosed,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LogCategory, HandoverNote } from '../../types';
import { canCreateDutyLog, canInitiateHandover, canAcceptHandover } from '../../services/permissions';

interface DutyLogsTabProps {
  onOpenQuickLogModal: (roomId?: string) => void;
  onOpenHandoverModal: () => void;
}

export const DutyLogsTab: React.FC<DutyLogsTabProps> = ({
  onOpenQuickLogModal,
  onOpenHandoverModal,
}) => {
  const {
    dutyLogs,
    handovers,
    rooms,
    shifts,
    currentShift,
    nextShift,
    currentUser,
    pendingTasks,
    acceptHandover,
  } = useApp();

  if (!currentUser) return null;

  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'handover'>('logs');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredLogs = dutyLogs.filter((log) => {
    const matchRoom = filterRoom === 'all' || log.roomId === filterRoom;
    const matchCat = filterCategory === 'all' || log.category === filterCategory;
    return matchRoom && matchCat;
  });

  const canAccept = canAcceptHandover(currentUser.role, nextShift, currentUser.id);

  const handleAccept = (handoverId: string) => {
    if (!window.confirm('Xác nhận tiếp nhận bàn giao ca và bắt đầu ca trực mới?')) return;
    const res = acceptHandover(handoverId);
    if (!res.success) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-tab switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-emerald-700" />
            Nhật Ký Ca Trực & Bàn Giao Ca 24 Giờ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi chép diễn biến học tập, sinh hoạt, kiểm tra phòng và thủ tục bàn giao liên ca bảo đảm không đứt gãy thông tin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'logs' ? (
            <button
              onClick={() => onOpenQuickLogModal()}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhật ký mới</span>
            </button>
          ) : (
            <button
              onClick={onOpenHandoverModal}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Lập phiếu bàn giao ca</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'logs'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sổ Nhật Ký Ca Trực ({dutyLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('handover')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'handover'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Biên Bản Bàn Giao Ca ({handovers.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: LOGS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lọc nhật ký:
            </span>

            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Tất cả các phòng ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="hoc_tap">Học tập (Giờ tự học tối, bài vở)</option>
              <option value="sinh_hoat">Sinh hoạt (Ăn uống, ngủ nghỉ, vệ sinh)</option>
              <option value="kiem_tra_phong">Kiểm tra phòng (Nề nếp, cơ sở vật chất)</option>
              <option value="khac">Việc khác</option>
            </select>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const categoryBadge = {
                hoc_tap: { label: 'Học tập', color: 'bg-blue-100 text-blue-900 border-blue-200' },
                sinh_hoat: { label: 'Sinh hoạt', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
                kiem_tra_phong: { label: 'Kiểm tra phòng', color: 'bg-purple-100 text-purple-900 border-purple-200' },
                khac: { label: 'Việc khác', color: 'bg-slate-100 text-slate-900 border-slate-200' },
              }[log.category];

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {log.roomCode}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] border ${categoryBadge.color}`}>
                        {categoryBadge.label}
                      </span>
                      <span className="text-slate-600">
                        Người ghi: <strong className="text-slate-900">{log.teacherName}</strong>
                      </span>
                    </div>

                    <div className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  {/* Log Content */}
                  <div className="text-xs text-slate-800 font-medium leading-relaxed">
                    {log.content}
                  </div>

                  {/* Actions Taken & Follow-up Needed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {log.actionTaken && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900">
                        <span className="font-bold text-[11px] block uppercase text-emerald-950 mb-0.5">
                          ✓ Việc đã thực hiện tại chỗ:
                        </span>
                        {log.actionTaken}
                      </div>
                    )}

                    {log.followUpNeeded && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-950">
                        <span className="font-bold text-[11px] block uppercase text-amber-900 mb-0.5">
                          ⚠ Việc cần tiếp tục theo dõi:
                        </span>
                        {log.followUpNeeded}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Không tìm thấy nhật ký phù hợp với bộ lọc.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HANDOVER */}
      {activeSubTab === 'handover' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">Quy Trình Bàn Giao Ca 24 Giờ</h4>
              <p className="mt-0.5 leading-relaxed">
                Người bàn giao lập biên bản tổng kết tình hình các phòng và các công việc còn tồn đọng. Ca kế tiếp bắt buộc
                phải có người nhận xác nhận thời điểm tiếp nhận. Toàn bộ công việc chưa hoàn thành sẽ tự động được mang
                sang ca tiếp theo để duy trì liên tục.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {handovers.map((ho) => {
              const isPending = ho.status === 'pending';
              const isAccepted = ho.status === 'accepted';

              return (
                <div
                  key={ho.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-4 ${
                    isPending ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{ho.code}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                            isAccepted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                          }`}
                        >
                          {isAccepted ? 'Đã tiếp nhận bàn giao' : 'Chờ người nhận xác nhận'}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Chuyển tiếp từ ca: <strong>{ho.fromShiftCode}</strong> sang ca: <strong>{ho.toShiftCode}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Lập phiếu lúc: {ho.createdAt}</div>
                      {ho.acceptedAt && (
                        <div className="text-[11px] font-semibold text-emerald-700">
                          Xác nhận nhận ca lúc: {ho.acceptedAt}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Người bàn giao (Ca trước):</span>
                      <span className="font-bold text-slate-900 text-sm">{ho.fromTeacherName}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Người nhận (Ca sau):</span>
                        <span className="font-bold text-slate-900 text-sm">{ho.toTeacherName}</span>
                      </div>

                      {isPending && (
                        <button
                          onClick={() => handleAccept(ho.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                        >
                          Xác nhận tiếp nhận
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Room Status Table */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 mb-2 uppercase tracking-wider">
                      Tình hình bàn giao chi tiết các phòng:
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Phòng</th>
                            <th className="py-2.5 px-3">Sĩ số</th>
                            <th className="py-2.5 px-3">Tình hình sức khỏe</th>
                            <th className="py-2.5 px-3">Vệ sinh phòng</th>
                            <th className="py-2.5 px-3">Cơ sở vật chất / Thiết bị</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ho.roomStatuses.map((rs, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{rs.roomCode}</td>
                              <td className="py-2.5 px-3 font-semibold text-emerald-800">
                                {rs.presentStudents}/{rs.totalStudents} em
                                {rs.leaveStudents > 0 && (
                                  <span className="text-amber-600 text-[10px] ml-1">({rs.leaveStudents} phép)</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{rs.healthNote}</td>
                              <td className="py-2.5 px-3 text-slate-700">{rs.hygieneStatus}</td>
                              <td className="py-2.5 px-3 text-slate-700">{rs.equipmentStatus}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Carried Forward Tasks */}
                  {ho.pendingTaskIds.length > 0 && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs">
                      <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        Các việc tồn đọng được liên kết sang ca kế tiếp:
                      </h4>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-900 mt-1">
                        {ho.pendingTaskIds.map((tid) => {
                          const task = pendingTasks.find((t) => t.id === tid);
                          return (
                            <li key={tid} className="font-medium">
                              {task ? `[${task.roomCode}] ${task.title}` : tid}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {ho.generalNotes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <strong>Nhận xét chung:</strong> {ho.generalNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
