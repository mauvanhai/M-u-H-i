import React, { useState } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Users,
  Eye,
  Trash2,
  Download,
  Info,
  KeyRound,
  Server,
  CloudOff,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS } from '../../services/permissions';

export const SettingsTab: React.FC = () => {
  const {
    currentUser,
    hasSimulatedData,
    loadSimulatedData,
    clearSimulatedData,
    clearAllUserDataWithConfirmation,
    rooms,
    students,
    accounts,
  } = useApp();

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleConfirmClearSimulated = () => {
    if (
      window.confirm(
        'Xác nhận dọn dẹp các mục dữ liệu mô phỏng? Lưu ý: Mọi dữ liệu do Ban Giám Hiệu nhập thực tế sẽ được bảo lưu an toàn.'
      )
    ) {
      clearSimulatedData();
    }
  };

  const handleConfirmResetAll = () => {
    const confirmation = window.prompt(
      'CẢNH BÁO: Thao tác này sẽ xóa toàn bộ dữ liệu (bao gồm cả tài khoản) về trạng thái khởi tạo ban đầu. Nhập chữ "XAC NHAN" để tiến hành:'
    );
    if (confirmation === 'XAC NHAN') {
      clearAllUserDataWithConfirmation();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            Cấu Hình Hệ Thống & Quản Lý Dữ Liệu Thực/Mô Phỏng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trường Phổ thông nội trú TH & THCS Mẫu Sơn — Quản lý trạng thái khởi tạo, quy trình xác thực và kiểm soát dữ liệu.
          </p>
        </div>

        {/* Data Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {!hasSimulatedData ? (
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-blue-700" />
              <span>Xem trước dữ liệu mô phỏng</span>
            </button>
          ) : (
            <button
              onClick={handleConfirmClearSimulated}
              className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-amber-700" />
              <span>Dọn dẹp dữ liệu mô phỏng</span>
            </button>
          )}

          <button
            onClick={handleConfirmResetAll}
            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs shadow-xs transition flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xóa trắng dữ liệu (Reset)</span>
          </button>
        </div>
      </div>

      {/* Transparency Status Card: Báo cáo rõ chức năng hoạt động thật vs mô phỏng */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
            Báo Cáo Minh Bạch Kiến Trúc: Chức Năng Thật & Dịch Vụ Cần Cấu Hình
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Col 1: Real features */}
          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2.5">
            <span className="font-bold text-emerald-300 uppercase tracking-wider block text-[11px] flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              1. Chức năng đã hoạt động thật (Real In-App Logic):
            </span>
            <ul className="space-y-1.5 text-slate-200 text-[11px] leading-relaxed">
              <li>• <strong>Khởi tạo dữ liệu sạch ban đầu:</strong> Mở ứng dụng không có GV/HS/phòng; chỉ số tổng quan ban đầu bằng 0, không tự tạo mock data.</li>
              <li>• <strong>Quy trình thiết lập ban đầu bảo vệ:</strong> Tạo tài khoản BGH đầu tiên duy nhất; không công khai đăng ký vai trò BGH.</li>
              <li>• <strong>Đăng nhập đa phương thức:</strong> Tra cứu theo Số điện thoại chuẩn hóa, địa chỉ Gmail, hoặc Họ tên; khi trùng họ tên yêu cầu bổ sung SĐT/Gmail, không lộ danh sách cá nhân.</li>
              <li>• <strong>Mã hóa mật khẩu:</strong> Sử dụng thuật toán băm SHA-256 an toàn, không lưu mật khẩu dạng văn bản trần (plain-text).</li>
              <li>• <strong>Phê duyệt đăng ký BGH:</strong> Thành viên đăng ký ở trạng thái chờ duyệt; BGH thẩm định và xác định vai trò chính thức.</li>
              <li>• <strong>Kiểm soát phân quyền nghiêm ngặt:</strong> Tài khoản chưa được phân công sẽ nhận thông báo rõ ràng và không thể truy cập dữ liệu phòng ngoài phạm vi.</li>
            </ul>
          </div>

          {/* Col 2: Simulated & Missing Infrastructure */}
          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2.5">
            <span className="font-bold text-amber-300 uppercase tracking-wider block text-[11px] flex items-center gap-1">
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              2. Phần còn mô phỏng & Dịch vụ máy chủ còn thiếu:
            </span>
            <ul className="space-y-1.5 text-slate-200 text-[11px] leading-relaxed">
              <li>• <strong>Cơ sở dữ liệu đám mây (Backend Database):</strong> Hiện tại lưu trữ trong LocalStorage trình duyệt cục bộ. Để dùng cho toàn trường trên nhiều máy tính/điện thoại, cần kết nối PostgreSQL (Cloud SQL) hoặc Firestore qua API máy chủ.</li>
              <li>• <strong>Cổng gửi SMS tự động (SMS Gateway):</strong> Chưa tích hợp dịch vụ SMS nhà mạng (Viettel/VNPT SMS Brandname), nên yêu cầu khôi phục mật khẩu qua SĐT được ghi nhận và cấp bởi BGH.</li>
              <li>• <strong>Máy chủ thư điện tử (SMTP Service):</strong> Chưa tích hợp SMTP server gửi mã OTP tự động đến Gmail.</li>
              <li>• <strong>Google OAuth 2.0 Client:</strong> "Đăng nhập bằng Gmail" hiện tại là dùng địa chỉ Gmail và mật khẩu ứng dụng. Nếu tích hợp nút "Đăng nhập bằng Google", cần cấu hình Google Cloud OAuth Client ID chính thức.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Role Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-700" />
          Bảng Phân Quyền Người Dùng Hệ Thống
        </h3>
        <p className="text-xs text-slate-500">
          Quy tắc phân quyền được tổ chức tách biệt tại <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">permissions.ts</code>, bảo đảm giáo viên không xem được phòng ngoài phân công.
        </p>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Phạm vi xem phòng</th>
                <th className="py-3 px-4">Quản lý HS / Phòng</th>
                <th className="py-3 px-4">Xếp ca trực 24h</th>
                <th className="py-3 px-4">Ghi nhật ký ca</th>
                <th className="py-3 px-4">Giao việc / Phân công</th>
                <th className="py-3 px-4">Duyệt tài khoản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(ROLE_DEFINITIONS).map((r) => {
                const isCurrent = currentUser?.role === r.code;
                return (
                  <tr
                    key={r.code}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCurrent ? 'bg-blue-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${r.badgeColor}`}>
                          {r.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-1.5 rounded">
                            Bạn đang dùng
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs">{r.description}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.canViewAllRooms ? (
                        <span className="text-emerald-700 font-semibold">Toàn bộ 4 dãy U1-U4</span>
                      ) : (
                        <span className="text-amber-800 font-medium">Chỉ phòng được phân công</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{r.canManageRooms ? 'Toàn quyền' : 'Không'}</td>
                    <td className="py-3 px-4 text-slate-700">{r.canManageShifts ? 'Có quyền' : 'Không'}</td>
                    <td className="py-3 px-4 text-slate-700">{r.code !== 'truong_phong' ? 'Được phép' : 'Không'}</td>
                    <td className="py-3 px-4 text-slate-700">{r.canAssignHandlers ? 'Có quyền' : 'Không'}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.canManageAccounts ? (
                        <span className="font-bold text-blue-700">Toàn quyền duyệt</span>
                      ) : (
                        'Không'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Simulated Data */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-700" />
                <span>Xem Trước Gói Dữ Liệu Mô Phỏng</span>
              </h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Theo yêu cầu, hệ thống ban đầu hoàn toàn sạch. Nếu Thầy/Cô cần xem thử mẫu cấu trúc 4 dãy phòng, phân công ca trực và mẫu học sinh để tham khảo giao diện, Thầy/Cô có thể kích hoạt gói xem trước này.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 space-y-1">
              <strong>Gói mô phỏng bao gồm:</strong>
              <div>• 3 phòng mẫu thuộc Dãy U1, U2 và 1 phòng chưa gán vị trí.</div>
              <div>• 24 học sinh mẫu (Tiểu học & THCS) chia đều các phòng.</div>
              <div>• Ca trực 24h mẫu, nhật ký ca, việc cần theo dõi và báo cáo nhanh.</div>
              <div className="text-amber-800 font-semibold pt-1">
                * Có thể dọn dẹp bất kỳ lúc nào mà không làm ảnh hưởng đến dữ liệu người dùng tự nhập.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  loadSimulatedData();
                  setIsPreviewModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
              >
                Tải gói mô phỏng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
