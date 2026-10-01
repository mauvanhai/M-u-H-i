import React from 'react';
import { AlertCircle, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLE_DEFINITIONS } from '../services/permissions';

export const DemoBanner: React.FC = () => {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  const roleDef = ROLE_DEFINITIONS[currentUser.role];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Dữ liệu mô phỏng — Phục vụ nghiên cứu & kiểm thử
          </span>
          <span className="hidden sm:inline text-amber-700">|</span>
          <span className="hidden md:inline-flex items-center gap-1 text-slate-600">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Lưu tạm trong trình duyệt (LocalStorage), chưa đồng bộ thiết bị khác.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 hidden lg:inline">Chế độ vai trò thử nghiệm:</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border text-[11px] ${roleDef.badgeColor}`}>
            <ShieldAlert className="w-3 h-3" />
            {roleDef.title}: {currentUser.name}
          </span>
        </div>
      </div>
    </div>
  );
};
