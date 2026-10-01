import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Bell,
  Send,
  AlertTriangle,
  Users,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StudentCaptainTab: React.FC = () => {
  const {
    currentUser,
    rooms,
    students,
    pendingTasks,
    notices,
    updateTaskStatus,
    createReport,
  } = useApp();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [repTitle, setRepTitle] = useState('');
  const [repContent, setRepContent] = useState('');
  const [repPriority, setRepPriority] = useState<'normal' | 'urgent'>('normal');

  // Find room of current student captain
  const myRoom = rooms.find((r) => r.id === currentUser?.studentRoomId);
  const myRoomStudents = myRoom ? students.filter((s) => s.roomId === myRoom.id) : [];
  const myRoomTasks = myRoom ? pendingTasks.filter((t) => t.roomId === myRoom.id) : [];
  const myRoomNotices = myRoom ? notices.filter((n) => n.roomId === myRoom.id) : [];

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRoom || !repTitle.trim() || !repContent.trim()) return;

    createReport({
      title: `[Học sinh báo cáo] ${repTitle.trim()}`,
      content: repContent.trim(),
      roomId: myRoom.id,
      priority: repPriority,
    });

    setRepTitle('');
    setRepContent('');
    setIsReportModalOpen(false);
  };

  if (!myRoom) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Bạn chưa được phân công phòng hoặc ca trực.</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Tài khoản Trưởng phòng học sinh của em chưa được Ban Giám Hiệu gắn vào phòng nội trú cụ thể. Vui lòng liên hệ Thầy/Cô Ban Giám Hiệu hoặc Quản sinh để được thiết lập phòng.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white font-bold text-xs px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Trưởng Phòng Tự Quản
              </span>
              <span className="text-blue-200 text-xs">•</span>
              <span className="text-xs text-blue-100">
                {myRoom.building === 'unassigned' || !myRoom.building
                  ? 'Chưa gán dãy/tầng'
                  : `Dãy ${myRoom.building} • Tầng ${myRoom.floor || 0}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Xin chào Trưởng phòng {currentUser?.name}!
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Em đang quản lý phòng <strong>{myRoom.code} - {myRoom.name}</strong> ({myRoomStudents.length} bạn).
              Hãy kiểm tra nhiệm vụ được thầy cô giao và đôn đốc các bạn trong phòng thực hiện tốt nếp sống nội trú nhé!
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <AlertTriangle className="w-4 h-4 text-slate-950" />
            <span>Báo cáo sự việc cho thầy/cô</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Tasks assigned to room */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Tasks assigned by teachers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Nhiệm Vụ Giáo Viên Giao Cho Phòng</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {myRoomTasks.filter((t) => t.status !== 'completed').length} việc cần làm
              </span>
            </div>

            <div className="space-y-3">
              {myRoomTasks.length > 0 ? (
                myRoomTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  const isInProgress = task.status === 'in_progress';

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-slate-50 border-slate-200 opacity-80'
                          : 'bg-white border-blue-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.priority === 'urgent' && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.2 rounded">
                                Việc gấp
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{task.description}</p>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Giao lúc: {task.createdAt}</span>
                          </div>
                        </div>

                        {/* Progress update buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              isInProgress
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            Đang thực hiện
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã xong</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  Hiện tại phòng em chưa có nhiệm vụ nào tồn đọng.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Room Members list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Các Bạn Trong Phòng {myRoom.code}</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{myRoomStudents.length} bạn</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {myRoomStudents.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {idx + 1}. {st.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {st.className} • Mã HS: {st.code}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      st.boardingStatus === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : st.boardingStatus === 'sick'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {st.boardingStatus === 'present'
                      ? 'Có mặt'
                      : st.boardingStatus === 'sick'
                      ? 'Đang sốt/ốm'
                      : 'Nghỉ phép'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Notices for Room */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Thông Báo Cho Phòng Ở</h3>
            </div>

            <div className="space-y-3">
              {myRoomNotices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                    n.priority === 'important'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.postedDate}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{n.content}</p>
                  <div className="text-[10px] text-slate-400 pt-1">Người gửi: {n.postedBy}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Info className="w-4 h-4 text-blue-700" />
              <span>Ghi nhớ của Trưởng phòng:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800">
              <li>Đôn đốc các bạn xếp chăn màn vuông vắn trước 06:45 sáng.</li>
              <li>Nhắc các bạn học bài nghiêm túc từ 19:30 đến 21:00.</li>
              <li>Báo ngay cho thầy cô nếu bạn nào bị nóng sốt, đau bụng.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Student Captain Reports an Issue */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Báo Cáo Tình Hình Phòng Cho Giáo Viên</h3>
            <p className="text-[11px] text-slate-500">
              Báo cáo của em sẽ được gửi ngay đến 2 Giáo viên quản lý phòng và Giáo viên đang trực ca hôm nay.
            </p>

            <form onSubmit={handleSendReport} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mức độ việc</label>
                <select
                  value={repPriority}
                  onChange={(e) => setRepPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="normal">Thông thường (đồ dùng hỏng, vệ sinh...)</option>
                  <option value="urgent">Gấp / Khẩn (bạn bị sốt cao, mất điện/nước...)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tóm tắt sự việc *</label>
                <input
                  type="text"
                  required
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  placeholder="VD: Bóng điện bàn học bị chập / Bạn Lâm bị đau đầu..."
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung chi tiết *</label>
                <textarea
                  rows={3}
                  required
                  value={repContent}
                  onChange={(e) => setRepContent(e.target.value)}
                  placeholder="Ghi rõ thời gian xảy ra và hiện trạng..."
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
