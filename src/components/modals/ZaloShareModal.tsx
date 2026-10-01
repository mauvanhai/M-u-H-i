import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Share2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Info,
  X,
} from 'lucide-react';
import { ReportExportData } from '../../services/reportExportService';
import { generateWordReportDocx } from '../../services/reportExportService';
import { generateExcelReportXlsx } from '../../services/excelReportService';

interface ZaloShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportExportData;
}

export const ZaloShareModal: React.FC<ZaloShareModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  // Default short summary message for sharing
  const defaultSummaryText = `[BÁO CÁO NỘI TRÚ MẪU SƠN]
Thời điểm: ${reportData.exportedAt}
Phạm vi: ${reportData.scopeDescription}
- Tổng số phòng: ${reportData.summary.totalRooms}
- Tổng học sinh: ${reportData.summary.totalStudents} (Có mặt: ${reportData.summary.studentsPresent}, Nghỉ: ${reportData.summary.studentsLeave}, Ốm: ${reportData.summary.studentsSick})
- Sự vụ phát sinh: ${reportData.summary.totalReports} (${reportData.summary.urgentReports} cần xử lý sớm)
Người xuất: ${reportData.exportedBy}
(Chi tiết xem trong file Word/Excel đính kèm).`;

  const [summaryText, setSummaryText] = useState(defaultSummaryText);
  const [copied, setCopied] = useState(false);
  const [recipientZaloLink, setRecipientZaloLink] = useState('');
  const [zaloLinkError, setZaloLinkError] = useState<string | null>(null);
  const [isExportingWord, setIsExportingWord] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Không thể sao chép tự động. Vui lòng chọn văn bản và sao chép thủ công.');
    }
  };

  const handleDownloadWord = async () => {
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
    } catch (e) {
      console.error(e);
      alert('Không thể tạo file Word. Vui lòng thử lại.');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleDownloadExcel = () => {
    generateExcelReportXlsx(reportData);
  };

  const handleOpenZaloLink = () => {
    setZaloLinkError(null);
    const trimmed = recipientZaloLink.trim();
    if (!trimmed) {
      setZaloLinkError('Vui lòng nhập liên kết Zalo đã được khai báo hợp lệ (ví dụ: https://zalo.me/...).');
      return;
    }

    // Check valid zalo.me link - Strictly no generating phone chat links
    if (!trimmed.startsWith('https://zalo.me/') && !trimmed.startsWith('zalo.me/')) {
      setZaloLinkError('Chỉ hỗ trợ liên kết Zalo hợp lệ (dạng https://zalo.me/username hoặc mã liên hệ). Hệ thống không tự tạo liên kết trò chuyện từ số điện thoại!');
      return;
    }

    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    // Open in new tab
    const win = window.open(fullUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      alert('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng mở trực tiếp liên kết: ' + fullUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              Z
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chia Sẻ Báo Cáo Qua Zalo</h3>
              <p className="text-[11px] text-slate-500">
                Phiên bản hỗ trợ tạo tóm tắt, sao chép nội dung và tải file để người dùng tự đính kèm.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Privacy Reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-amber-950 font-bold block mb-0.5">
              Nhắc nhở kiểm tra thông tin cá nhân & Quyền riêng tư học sinh:
            </strong>
            Báo cáo có thể chứa thông tin danh sách học sinh, tình trạng sức khỏe hoặc phân công giáo viên.
            Ứng dụng <strong>tuyệt đối không tạo đường dẫn công khai chứa dữ liệu học sinh</strong>.
            Vui lòng kiểm tra kỹ nội dung tóm tắt trước khi sao chép và gửi qua Zalo.
          </div>
        </div>

        {/* Step 1: Review and edit summary text */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">
              1. Nội dung tóm tắt ngắn (Xem và chỉnh sửa trước khi chia sẻ):
            </label>
            <span className="text-[10px] text-slate-400">Có thể chỉnh sửa</span>
          </div>
          <textarea
            rows={6}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px] focus:bg-white focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleCopyText}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép nội dung!' : 'Sao chép nội dung tóm tắt'}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Download file to attach manually */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="font-bold text-slate-800 block">
            2. Tải file báo cáo chi tiết để tự đính kèm trong cuộc trò chuyện Zalo:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleDownloadWord}
              disabled={isExportingWord}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-xs">Tải file Word (.docx)</div>
                  <div className="text-[10px] text-slate-500">Định dạng A4 chuẩn</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={handleDownloadExcel}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition text-left"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-xs">Tải file Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-500">Sheet tổng hợp & chi tiết</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Step 3: Optional opening of verified Zalo contact link */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="font-bold text-slate-800 block">
            3. Mở liên kết Zalo người nhận (Tùy chọn):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipientZaloLink}
              onChange={(e) => setRecipientZaloLink(e.target.value)}
              placeholder="Nhập liên kết Zalo, ví dụ: https://zalo.me/username..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <button
              onClick={handleOpenZaloLink}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Zalo</span>
            </button>
          </div>
          {zaloLinkError && (
            <p className="text-[11px] text-red-600 font-medium">{zaloLinkError}</p>
          )}
          <span className="text-[10px] text-slate-400 block">
            * Ứng dụng không tự động gửi tin nhắn. Người dùng tự dán nội dung và đính kèm file trong Zalo.
          </span>
        </div>

        {/* Notice on automatic Zalo sending requirement */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Ghi chú tích hợp tự động:</strong> Để tự động gửi tin nhắn qua Zalo mà không cần thao tác tay, nhà trường cần tích hợp <strong>Zalo Official Account (ZOA) API</strong> hoặc Zalo Notification Service (ZNS) có ủy quyền doanh nghiệp. Hệ thống chưa tạo chức năng gửi giả để đảm bảo tính minh bạch.
          </span>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
