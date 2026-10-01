import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  History,
  Info,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImportDataType } from '../../types';
import { TEMPLATE_SCHEMAS, downloadExcelTemplate } from '../../services/excelTemplateService';
import {
  readExcelFile,
  validateImportData,
  downloadValidationReport,
  ParseResult,
} from '../../services/excelImportValidator';

export const ImportDataTab: React.FC = () => {
  const {
    rooms,
    students,
    shifts,
    accounts,
    teachers,
    currentUser,
    executeExcelImport,
    importHistory,
  } = useApp();

  const [selectedType, setSelectedType] = useState<ImportDataType>('teachers');
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'history'>('import');

  // File Upload & Parse States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Duplicate Handling Option: 'skip' (default) or 'update'
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip');

  // Confirmation modal before actual commit
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  // Check RBAC permission: Only BGH or specifically authorized roles can import
  const canImport = currentUser.role === 'bgh';

  const currentSchema = TEMPLATE_SCHEMAS[selectedType];

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(selectedType);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setParseError('Chỉ hỗ trợ file Excel định dạng .xlsx hoặc .xls.');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsReadingFile(true);
    setParseResult(null);

    try {
      const { headers, data } = await readExcelFile(file);

      if (data.length === 0) {
        setParseError('File Excel không có dòng dữ liệu nào trong sheet "Dữ liệu". Vui lòng nhập dữ liệu theo đúng mẫu.');
        setIsReadingFile(false);
        return;
      }

      // Run comprehensive validations
      const result = validateImportData(selectedType, headers, data, {
        rooms,
        students,
        shifts,
        teachers: accounts,
      });

      result.fileName = file.name;
      setParseResult(result);
      setIsReadingFile(false);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
      setIsReadingFile(false);
    }
  };

  const handleDownloadCheckResult = () => {
    if (!parseResult) return;
    downloadValidationReport(parseResult);
  };

  const handleExecuteImport = () => {
    if (!parseResult) return;

    setIsImporting(true);
    try {
      // Filter out rows with fatal errors; only import valid or warning rows
      const importableRows = parseResult.rows.filter((r) => r.status !== 'error');

      const res = executeExcelImport(selectedType, importableRows, duplicateAction);
      setIsImporting(false);
      setIsConfirmModalOpen(false);

      if (res.success) {
        // Reset file selection
        setSelectedFile(null);
        setParseResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Switch to history tab to see log
        setActiveSubTab('history');
      }
    } catch (err: any) {
      setIsImporting(false);
      alert('Có lỗi xảy ra khi nhập dữ liệu: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>Nhập Dữ Liệu Từ Excel (.xlsx)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhập danh mục Giáo viên, Học sinh, Phòng, Phân công quản lý và Ca trực với kiểm tra dữ liệu trước khi lưu.
          </p>
        </div>

        {/* View Switcher: Import vs History */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'import'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Nhập dữ liệu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử nhập ({importHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Permission check banner if not BGH */}
      {!canImport && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-950">Quy định phân quyền nhập dữ liệu:</strong>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              Chỉ <strong>Ban Giám Hiệu</strong> hoặc tài khoản được cấp quyền rõ ràng mới có thể thực hiện ghi dữ liệu vào hệ thống. Tài khoản của bạn hiện chỉ có quyền xem thông tin.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: IMPORT WIZARD */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* 1. Category Selection Tabs */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
              Bước 1: Chọn loại dữ liệu cần nhập
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {(
                [
                  { id: 'teachers', label: '1. Giáo viên' },
                  { id: 'students', label: '2. Học sinh' },
                  { id: 'rooms', label: '3. Phòng' },
                  { id: 'room_assignments', label: '4. Phân công phòng' },
                  { id: 'shifts', label: '5. Phân công ca trực' },
                ] as const
              ).map((tab) => {
                const isSelected = selectedType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedType(tab.id);
                      setSelectedFile(null);
                      setParseResult(null);
                      setParseError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={`p-3 rounded-xl font-bold transition text-left border ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-100'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Download Template & File Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{currentSchema.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentSchema.description}</p>
              </div>

              {/* Download Template Button */}
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Tải file mẫu Excel (.xlsx)</span>
              </button>
            </div>

            {/* Template Note Banner */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Quy chuẩn file mẫu:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>
                  File mẫu gồm 2 sheet: <strong>"Dữ liệu"</strong> (để trống dữ liệu, chỉ có tiêu đề) và{' '}
                  <strong>"Hướng dẫn"</strong> (chứa quy tắc, cột bắt buộc, kiểu dữ liệu và ví dụ minh họa).
                </li>
                <li>
                  Định dạng mã và số điện thoại là <strong>dạng Văn bản (Text)</strong> để giữ nguyên số 0 ở đầu.
                </li>
                <li>
                  Hệ thống <strong>không ghi dữ liệu ngay khi chọn file</strong> mà phải qua bước kiểm tra trước và xác nhận.
                </li>
              </ul>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Bước 2: Chọn file Excel (.xlsx) đã điền dữ liệu
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                />

                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setParseResult(null);
                      setParseError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy chọn</span>
                  </button>
                )}
              </div>

              {isReadingFile && (
                <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold pt-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đọc và kiểm tra dữ liệu file...</span>
                </div>
              )}

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Không thể đọc file:</strong> {parseError}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Validation Results & Preview Table */}
          {parseResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
              {/* Validation Summary Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    <span>Kết Quả Kiểm Tra Trước Khi Nhập: {parseResult.fileName}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tổng số dòng: <strong>{parseResult.totalRows}</strong> | Hợp lệ:{' '}
                    <strong className="text-emerald-700">{parseResult.validRowsCount}</strong> | Cảnh báo:{' '}
                    <strong className="text-amber-700">{parseResult.warningRowsCount}</strong> | Lỗi:{' '}
                    <strong className="text-red-700">{parseResult.errorRowsCount}</strong> | Trùng mã:{' '}
                    <strong className="text-blue-700">{parseResult.duplicateRowsCount}</strong>
                  </p>
                </div>

                {/* Download Validation Result Report Button */}
                <button
                  onClick={handleDownloadCheckResult}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start md:self-auto shrink-0"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Tải file kết quả kiểm tra để sửa lỗi</span>
                </button>
              </div>

              {/* Missing Columns Warning */}
              {parseResult.missingColumns.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">File thiếu các cột bắt buộc:</strong>{' '}
                    {parseResult.missingColumns.join(', ')}. Vui lòng tải lại file mẫu chuẩn.
                  </div>
                </div>
              )}

              {/* Extra Warnings (e.g., room without 2 manager teachers) */}
              {parseResult.extraWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  {parseResult.extraWarnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate Handling Selector */}
              {parseResult.duplicateRowsCount > 0 && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-blue-950 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>Xử lý {parseResult.duplicateRowsCount} dòng có mã đã tồn tại:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="dupAction"
                        value="skip"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                        className="text-blue-600"
                      />
                      <span>
                        <strong>Bỏ qua</strong> (Mặc định - Giữ nguyên dữ liệu cũ, không ghi đè)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="dupAction"
                        value="update"
                        checked={duplicateAction === 'update'}
                        onChange={() => setDuplicateAction('update')}
                        className="text-blue-600"
                      />
                      <span>
                        <strong>Cập nhật thông tin được phép</strong> (Họ tên, SĐT, Email, lớp, v.v.)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table of Rows */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Dòng</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        {currentSchema.columns.map((c) => (
                          <th key={c.key} className="py-2.5 px-3">
                            {c.name} {c.required && <span className="text-red-500">*</span>}
                          </th>
                        ))}
                        <th className="py-2.5 px-3">Chi tiết kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.rows.map((r) => {
                        const statusBadge =
                          r.status === 'valid' ? (
                            <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              Hợp lệ
                            </span>
                          ) : r.status === 'warning' ? (
                            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              Cảnh báo
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              Lỗi
                            </span>
                          );

                        return (
                          <tr
                            key={r.rowNumber}
                            className={`hover:bg-slate-50 ${
                              r.status === 'error' ? 'bg-red-50/40' : r.status === 'warning' ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                              {r.rowNumber}
                            </td>
                            <td className="py-2.5 px-3">{statusBadge}</td>
                            {currentSchema.columns.map((col) => (
                              <td key={col.key} className="py-2.5 px-3 font-mono text-slate-800">
                                {r.mappedData[col.key] || '—'}
                              </td>
                            ))}
                            <td className="py-2.5 px-3 text-[11px]">
                              {r.errors.length > 0 && (
                                <div className="text-red-700 font-medium">
                                  {r.errors.map((e) => `[${e.column}] ${e.message}`).join(' • ')}
                                </div>
                              )}
                              {r.warnings.length > 0 && (
                                <div className="text-amber-800">
                                  {r.warnings.join(' • ')}
                                </div>
                              )}
                              {r.errors.length === 0 && r.warnings.length === 0 && (
                                <span className="text-emerald-700">Đạt yêu cầu</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Commit Action */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {parseResult.errorRowsCount > 0 ? (
                    <span className="text-amber-800 font-medium">
                      * Có {parseResult.errorRowsCount} dòng bị lỗi. Nếu tiếp tục, hệ thống chỉ nhập{' '}
                      {parseResult.totalRows - parseResult.errorRowsCount} dòng hợp lệ.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      * Tất cả các dòng đều đạt yêu cầu hoặc ở mức cảnh báo có thể nhập.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={!canImport || parseResult.totalRows - parseResult.errorRowsCount === 0}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:bg-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận nhập dữ liệu</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: IMPORT HISTORY LOGS */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>Lịch Sử Nhập Dữ Liệu Excel</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi nhận đầy đủ người nhập, thời điểm, loại dữ liệu, số dòng thành công và thất bại.
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {importHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {item.dataTypeLabel}
                    </span>
                    <span>{item.details}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center gap-4 flex-wrap">
                  <span>
                    Người thực hiện: <strong className="text-slate-800">{item.importedBy}</strong>
                  </span>
                  <span>
                    Tổng dòng: <strong>{item.totalRows}</strong>
                  </span>
                  <span>
                    Thành công: <strong className="text-emerald-700">{item.successCount}</strong>
                  </span>
                  <span>
                    Bỏ qua/Thất bại: <strong className="text-red-700">{item.failedCount}</strong>
                  </span>
                  <span>
                    Xử lý trùng:{' '}
                    <strong>{item.duplicateAction === 'update' ? 'Cập nhật' : 'Bỏ qua'}</strong>
                  </span>
                </div>
              </div>
            ))}

            {importHistory.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Chưa có lịch sử nhập file Excel nào được ghi nhận.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && parseResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>Xác Nhận Nhập Dữ Liệu</span>
              </h3>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p>
                Thầy/Cô đang chuẩn bị nhập <strong>{currentSchema.title}</strong> vào hệ thống:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div>• Tổng số dòng kiểm tra: <strong>{parseResult.totalRows}</strong></div>
                <div>• Dòng hợp lệ / cảnh báo sẽ nhập: <strong className="text-emerald-700">{parseResult.totalRows - parseResult.errorRowsCount}</strong></div>
                <div>• Dòng lỗi nghiêm trọng bị loại bỏ: <strong className="text-red-700">{parseResult.errorRowsCount}</strong></div>
                <div>• Phương án xử lý mã trùng: <strong>{duplicateAction === 'update' ? 'Cập nhật thông tin được phép' : 'Bỏ qua (Không ghi đè)'}</strong></div>
              </div>
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Lưu ý: Thao tác này sẽ ghi nhận vào Lịch sử nhập liệu của hệ thống. Nhập hồ sơ giáo viên hoặc học sinh KHÔNG tự tạo tài khoản, không cấp quyền và không tạo mật khẩu tự động.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-xs"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isImporting ? 'Đang nhập...' : 'Đồng ý & Nhập dữ liệu'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
