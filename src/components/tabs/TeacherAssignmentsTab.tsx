import React, { useState } from 'react';
import {
  Users,
  Shield,
  Phone,
  DoorClosed,
  Calendar,
  Clock,
  Edit2,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TeacherAssignmentsTab: React.FC = () => {
  const { teachers, rooms, currentShift } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            Đội Ngũ Giáo Viên & Phân Công Nhiệm Vụ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân biệt rõ ràng hai vai trò: Giáo viên quản lý phòng (dài hạn) và Giáo viên trực ca (24h).
          </p>
        </div>
      </div>

      {/* Teachers Grid */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Chưa có giáo viên.</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hệ thống chưa có hồ sơ giáo viên nào. Ban Giám Hiệu có thể phê duyệt yêu cầu đăng ký tài khoản của giáo viên hoặc thêm tài khoản trong mục "Tài khoản".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((t) => {
          // Rooms managed by this teacher
          const managedRooms = rooms.filter((r) => r.managerTeacherIds.includes(t.id));

          // Check if this teacher is on duty in ongoing shift
          const dutyAssignment = currentShift?.assignments.find((a) => a.teacherId === t.id);
          const dutyRooms = dutyAssignment ? rooms.filter((r) => dutyAssignment.roomIds.includes(r.id)) : [];

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-sm">{t.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">[{t.code}]</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{t.title} • {t.subject || 'Chuyên môn'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    {t.role === 'bgh' ? 'Ban Giám Hiệu' : t.role === 'quan_sinh' ? 'Quản Sinh' : 'Giáo Viên'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{t.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{t.email}</span>
                  </div>
                </div>

                {/* Role 1: GVQL */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Phòng Quản Lý Chính (Dài hạn):
                  </span>
                  {managedRooms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {managedRooms.map((r) => (
                        <span
                          key={r.id}
                          className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]"
                        >
                          {r.code} - {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Không phụ trách phòng nào</span>
                  )}
                </div>

                {/* Role 2: GVT */}
                <div className="mt-2 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">
                    Ca trực 24h hôm nay:
                  </span>
                  {dutyAssignment ? (
                    <div>
                      <span className="font-bold text-amber-950">
                        {currentShift?.code} ({currentShift?.startTime.split(' ')[1]} - {currentShift?.endTime.split(' ')[1]})
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dutyRooms.map((r) => (
                          <span
                            key={r.id}
                            className="bg-white text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300 text-[10px]"
                          >
                            Trực {r.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Không có ca trực hôm nay</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
