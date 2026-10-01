import * as XLSX from 'xlsx';
import { ImportDataType, Room, Student, Shift, UserAccount } from '../types';
import { TEMPLATE_SCHEMAS } from './excelTemplateService';

export interface RowValidationError {
  column: string;
  message: string;
  isFatal: boolean; // fatal error prevents row or causes failure
}

export interface ParsedRowResult {
  rowNumber: number; // 1-based Excel row number (usually starts at row 2)
  rawData: Record<string, any>;
  mappedData: Record<string, any>;
  errors: RowValidationError[];
  warnings: string[];
  status: 'valid' | 'warning' | 'error';
  isDuplicate: boolean;
  duplicateKey?: string;
}

export interface ParseResult {
  dataType: ImportDataType;
  fileName: string;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  warningRowsCount: number;
  duplicateRowsCount: number;
  missingColumns: string[];
  extraWarnings: string[];
  rows: ParsedRowResult[];
}

/**
 * Đọc file .xlsx và trích xuất dữ liệu từ sheet "Dữ liệu"
 * Trả về danh sách object theo tiêu đề cột
 */
export async function readExcelFile(file: File): Promise<{
  sheetName: string;
  headers: string[];
  data: Record<string, any>[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary', raw: true });

        // Prefer sheet named "Dữ liệu" or "Du lieu" or take the first sheet
        let targetSheetName = wb.SheetNames.find(
          (s) => s.toLowerCase().includes('dữ liệu') || s.toLowerCase().includes('du lieu')
        );
        if (!targetSheetName) {
          targetSheetName = wb.SheetNames[0];
        }

        const ws = wb.Sheets[targetSheetName];
        if (!ws) {
          throw new Error('Không tìm thấy bảng tính hợp lệ trong file Excel.');
        }

        // Parse to JSON array of objects with raw strings
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          raw: false,
          defval: '',
        });

        // Extract headers from first row
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const headers: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v) {
            headers.push(String(cell.v).trim());
          }
        }

        resolve({
          sheetName: targetSheetName,
          headers,
          data: json,
        });
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Kiểm tra toàn diện file Excel trước khi cho phép nhập
 */
export function validateImportData(
  dataType: ImportDataType,
  headers: string[],
  rawRows: Record<string, any>[],
  existingData: {
    rooms: Room[];
    students: Student[];
    shifts: Shift[];
    teachers: UserAccount[];
  }
): ParseResult {
  const schema = TEMPLATE_SCHEMAS[dataType];
  const missingColumns: string[] = [];
  const extraWarnings: string[] = [];

  // Check required columns exist
  schema.columns.forEach((col) => {
    const found = headers.some(
      (h) => h.toLowerCase().trim() === col.name.toLowerCase().trim()
    );
    if (!found && col.required) {
      missingColumns.push(col.name);
    }
  });

  const parsedRows: ParsedRowResult[] = [];
  const seenCodesInFile = new Set<string>();

  // Map to hold cumulative state during file parsing (e.g. room student counts, leaders)
  const roomStudentCounts: Record<string, number> = {};
  existingData.rooms.forEach((r) => {
    const currentStudentsInRoom = existingData.students.filter((s) => s.roomId === r.id).length;
    roomStudentCounts[r.code] = currentStudentsInRoom;
  });

  const roomLeadersInFile: Record<string, { leaderCode?: string; viceLeaderCode?: string }> = {};

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header, data starts at row 2
    const errors: RowValidationError[] = [];
    const warnings: string[] = [];
    const mapped: Record<string, any> = {};

    // Map columns from row based on column name
    schema.columns.forEach((col) => {
      // Find matching header
      const headerKey = Object.keys(row).find(
        (k) => k.toLowerCase().trim() === col.name.toLowerCase().trim()
      );
      let val = headerKey !== undefined ? String(row[headerKey] || '').trim() : '';
      mapped[col.key] = val;

      // Required check
      if (col.required && !val) {
        errors.push({
          column: col.name,
          message: `Cột "${col.name}" là bắt buộc và không được để trống.`,
          isFatal: true,
        });
      }

      // Allowed values check
      if (val && col.allowedValues && col.allowedValues.length > 0) {
        const match = col.allowedValues.some(
          (av) => av.toLowerCase().trim() === val.toLowerCase().trim()
        );
        if (!match) {
          errors.push({
            column: col.name,
            message: `Giá trị "${val}" không hợp lệ. Chỉ chấp nhận: ${col.allowedValues.join(', ')}.`,
            isFatal: true,
          });
        }
      }
    });

    let isDuplicate = false;
    let duplicateKey: string | undefined;

    // Specific Domain Validations
    if (dataType === 'teachers') {
      const code = mapped.code;
      if (code) {
        // Duplicate in file
        if (seenCodesInFile.has(code.toLowerCase())) {
          errors.push({
            column: 'Mã giáo viên',
            message: `Mã giáo viên "${code}" bị trùng lặp nhiều lần trong chính file nhập.`,
            isFatal: true,
          });
        } else {
          seenCodesInFile.add(code.toLowerCase());
        }

        // Duplicate with existing accounts
        const existing = existingData.teachers.find(
          (t) => t.code.toLowerCase() === code.toLowerCase()
        );
        if (existing) {
          isDuplicate = true;
          duplicateKey = code;
          warnings.push(`Mã giáo viên "${code}" đã tồn tại trên hệ thống (GV: ${existing.name}).`);
        }
      }

      // Phone format validation (keep 0 prefix)
      if (mapped.phone && !/^[0-9\.\-\s]{8,15}$/.test(mapped.phone)) {
        errors.push({
          column: 'Số điện thoại',
          message: `Số điện thoại "${mapped.phone}" không đúng định dạng.`,
          isFatal: false,
        });
      }
    } else if (dataType === 'students') {
      const code = mapped.code;
      const roomCode = mapped.roomCode;
      const teacherCode = mapped.homeroomTeacherCode;
      const roleInRoom = mapped.roleInRoom;

      if (code) {
        if (seenCodesInFile.has(code.toLowerCase())) {
          errors.push({
            column: 'Mã học sinh',
            message: `Mã học sinh "${code}" bị trùng lặp nhiều lần trong file.`,
            isFatal: true,
          });
        } else {
          seenCodesInFile.add(code.toLowerCase());
        }

        const existing = existingData.students.find(
          (s) => s.code.toLowerCase() === code.toLowerCase()
        );
        if (existing) {
          isDuplicate = true;
          duplicateKey = code;
          warnings.push(`Mã học sinh "${code}" đã tồn tại trên hệ thống (${existing.fullName}).`);
        }
      }

      // Check room code exists if provided
      let targetRoom: Room | undefined;
      if (roomCode) {
        targetRoom = existingData.rooms.find(
          (r) => r.code.toLowerCase() === roomCode.toLowerCase()
        );
        if (!targetRoom) {
          errors.push({
            column: 'Mã phòng',
            message: `Mã phòng tham chiếu "${roomCode}" không tồn tại trong danh mục phòng.`,
            isFatal: true,
          });
        } else {
          // Increment student count and check capacity
          roomStudentCounts[targetRoom.code] = (roomStudentCounts[targetRoom.code] || 0) + 1;
          if (roomStudentCounts[targetRoom.code] > targetRoom.capacity) {
            warnings.push(
              `CẢNH BÁO SỨC CHỨA: Phòng "${targetRoom.code}" (Sức chứa: ${targetRoom.capacity}) hiện có ${roomStudentCounts[targetRoom.code]} học sinh (vượt quá sức chứa)!`
            );
          }

          // Check leader / vice_leader not same student and valid
          if (roleInRoom === 'Trưởng phòng' || roleInRoom === 'Phó phòng') {
            if (!roomLeadersInFile[targetRoom.code]) {
              roomLeadersInFile[targetRoom.code] = {};
            }
            const roomL = roomLeadersInFile[targetRoom.code];
            if (roleInRoom === 'Trưởng phòng') {
              if (roomL.leaderCode && roomL.leaderCode !== code) {
                warnings.push(
                  `Phòng "${targetRoom.code}" có nhiều hơn 1 học sinh được gán chức danh Trưởng phòng trong file!`
                );
              }
              roomL.leaderCode = code;
            } else if (roleInRoom === 'Phó phòng') {
              if (roomL.viceLeaderCode && roomL.viceLeaderCode !== code) {
                warnings.push(
                  `Phòng "${targetRoom.code}" có nhiều hơn 1 học sinh được gán chức danh Phó phòng trong file!`
                );
              }
              roomL.viceLeaderCode = code;
            }

            if (roomL.leaderCode && roomL.viceLeaderCode && roomL.leaderCode === roomL.viceLeaderCode) {
              errors.push({
                column: 'Chức danh trong phòng',
                message: `Học sinh "${code}" không thể vừa là Trưởng phòng vừa là Phó phòng của cùng phòng "${targetRoom.code}".`,
                isFatal: true,
              });
            }
          }
        }
      }

      // Check teacher exists if provided
      if (teacherCode) {
        const teacherExists = existingData.teachers.some(
          (t) => t.code.toLowerCase() === teacherCode.toLowerCase()
        );
        if (!teacherExists) {
          errors.push({
            column: 'Mã giáo viên chủ nhiệm',
            message: `Mã giáo viên chủ nhiệm tham chiếu "${teacherCode}" không tồn tại trên hệ thống.`,
            isFatal: true,
          });
        }
      }
    } else if (dataType === 'rooms') {
      const code = mapped.code;
      const building = mapped.building;
      const floor = parseInt(mapped.floor, 10);
      const capacity = parseInt(mapped.capacity, 10);

      if (code) {
        if (seenCodesInFile.has(code.toLowerCase())) {
          errors.push({
            column: 'Mã phòng',
            message: `Mã phòng "${code}" bị trùng lặp nhiều lần trong file.`,
            isFatal: true,
          });
        } else {
          seenCodesInFile.add(code.toLowerCase());
        }

        const existing = existingData.rooms.find(
          (r) => r.code.toLowerCase() === code.toLowerCase()
        );
        if (existing) {
          isDuplicate = true;
          duplicateKey = code;
          warnings.push(`Mã phòng "${code}" đã tồn tại trên hệ thống (${existing.name}).`);
        }
      }

      if (building && !['U1', 'U2', 'U3', 'U4'].includes(building.toUpperCase())) {
        errors.push({
          column: 'Dãy nhà',
          message: `Dãy nhà "${building}" không hợp lệ. Phải là U1, U2, U3 hoặc U4.`,
          isFatal: true,
        });
      }

      if (isNaN(floor) || ![1, 2, 3].includes(floor)) {
        errors.push({
          column: 'Tầng',
          message: `Tầng "${mapped.floor}" không hợp lệ. Chỉ chấp nhận tầng 1, 2 hoặc 3.`,
          isFatal: true,
        });
      }

      if (isNaN(capacity) || capacity <= 0) {
        errors.push({
          column: 'Sức chứa',
          message: `Sức chứa "${mapped.capacity}" phải là số nguyên dương lớn hơn 0.`,
          isFatal: true,
        });
      }
    } else if (dataType === 'room_assignments') {
      const roomCode = mapped.roomCode;
      const teacherCode = mapped.teacherCode;
      const startDate = mapped.startDate;

      // Verify room exists
      const targetRoom = existingData.rooms.find(
        (r) => r.code.toLowerCase() === roomCode.toLowerCase()
      );
      if (!targetRoom) {
        errors.push({
          column: 'Mã phòng',
          message: `Mã phòng tham chiếu "${roomCode}" không tồn tại trong danh mục phòng.`,
          isFatal: true,
        });
      }

      // Verify teacher exists
      const targetTeacher = existingData.teachers.find(
        (t) => t.code.toLowerCase() === teacherCode.toLowerCase()
      );
      if (!targetTeacher) {
        errors.push({
          column: 'Mã giáo viên',
          message: `Mã giáo viên tham chiếu "${teacherCode}" không tồn tại.`,
          isFatal: true,
        });
      }

      // Verify date format
      if (startDate && isNaN(Date.parse(startDate))) {
        errors.push({
          column: 'Ngày bắt đầu',
          message: `Ngày bắt đầu "${startDate}" không đúng định dạng ngày tháng (YYYY-MM-DD).`,
          isFatal: true,
        });
      }
    } else if (dataType === 'shifts') {
      const shiftCode = mapped.shiftCode;
      const startTime = mapped.startTime;
      const endTime = mapped.endTime;
      const teacherCode = mapped.teacherCode;
      const roomCode = mapped.roomCode;

      const targetTeacher = existingData.teachers.find(
        (t) => t.code.toLowerCase() === teacherCode.toLowerCase()
      );
      if (!targetTeacher) {
        errors.push({
          column: 'Mã giáo viên',
          message: `Mã giáo viên tham chiếu "${teacherCode}" không tồn tại.`,
          isFatal: true,
        });
      }

      const targetRoom = existingData.rooms.find(
        (r) => r.code.toLowerCase() === roomCode.toLowerCase()
      );
      if (!targetRoom) {
        errors.push({
          column: 'Mã phòng',
          message: `Mã phòng tham chiếu "${roomCode}" không tồn tại.`,
          isFatal: true,
        });
      }

      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      if (isNaN(start) || isNaN(end) || start >= end) {
        errors.push({
          column: 'Thời gian bắt đầu / kết thúc',
          message: `Thời gian ca trực không hợp lệ (Bắt đầu phải nhỏ hơn kết thúc, định dạng YYYY-MM-DD HH:mm).`,
          isFatal: true,
        });
      } else if (targetTeacher) {
        // Check overlap against existing shifts in system
        existingData.shifts.forEach((s) => {
          if (s.code !== shiftCode) {
            const sStart = new Date(s.startTime).getTime();
            const sEnd = new Date(s.endTime).getTime();
            const isOverlap = start < sEnd && end > sStart;
            if (isOverlap) {
              const hasTeacher = s.assignments.some(
                (a) => a.teacherId === targetTeacher.id
              );
              if (hasTeacher) {
                warnings.push(
                  `CẢNH BÁO CHỒNG CHÉO: Giáo viên ${targetTeacher.name} (${teacherCode}) đã có lịch trực trong ca "${s.code}" trùng khung giờ này!`
                );
              }
            }
          }
        });
      }
    }

    const hasFatal = errors.some((e) => e.isFatal);
    const rowStatus: 'valid' | 'warning' | 'error' = hasFatal
      ? 'error'
      : errors.length > 0 || warnings.length > 0
      ? 'warning'
      : 'valid';

    parsedRows.push({
      rowNumber,
      rawData: row,
      mappedData: mapped,
      errors,
      warnings,
      status: rowStatus,
      isDuplicate,
      duplicateKey,
    });
  });

  // Final check: For room_assignments, check if rooms have 2 distinct manager teachers
  if (dataType === 'room_assignments') {
    const roomTeachersInImport: Record<string, Set<string>> = {};
    parsedRows.forEach((r) => {
      const rCode = r.mappedData.roomCode;
      const tCode = r.mappedData.teacherCode;
      if (rCode && tCode) {
        if (!roomTeachersInImport[rCode]) {
          roomTeachersInImport[rCode] = new Set<string>();
        }
        roomTeachersInImport[rCode].add(tCode);
      }
    });

    Object.entries(roomTeachersInImport).forEach(([rCode, teachersSet]) => {
      if (teachersSet.size < 2) {
        extraWarnings.push(
          `CẢNH BÁO PHÂN CÔNG PHÒNG: Phòng "${rCode}" chỉ được phân công ${teachersSet.size} giáo viên (Quy định mỗi phòng cần đủ 2 giáo viên quản lý chính khác nhau).`
        );
      }
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const warningCount = parsedRows.filter((r) => r.status === 'warning').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;

  return {
    dataType,
    fileName: '',
    totalRows: parsedRows.length,
    validRowsCount: validCount,
    warningRowsCount: warningCount,
    errorRowsCount: errorCount,
    duplicateRowsCount: duplicateCount,
    missingColumns,
    extraWarnings,
    rows: parsedRows,
  };
}

/**
 * Tải file kết quả kiểm tra lỗi (Excel) để người dùng xem và sửa lỗi theo số dòng, tên cột
 */
export function downloadValidationReport(parseResult: ParseResult) {
  const wb = XLSX.utils.book_new();

  const reportRows: (string | number)[][] = [];

  reportRows.push([`KẾT QUẢ KIỂM TRA DỮ LIỆU NHẬP: ${parseResult.dataType.toUpperCase()}`]);
  reportRows.push([`Tổng số dòng kiểm tra: ${parseResult.totalRows}`]);
  reportRows.push([
    `Hợp lệ: ${parseResult.validRowsCount} • Cảnh báo: ${parseResult.warningRowsCount} • Lỗi nghiêm trọng: ${parseResult.errorRowsCount}`,
  ]);
  reportRows.push([]);

  // Headers
  reportRows.push([
    'Số dòng Excel',
    'Trạng thái',
    'Tên cột lỗi / cảnh báo',
    'Chi tiết thông báo kiểm tra',
    'Dữ liệu dòng hiện tại',
  ]);

  parseResult.rows.forEach((row) => {
    const statusLabel =
      row.status === 'valid'
        ? 'HỢP LỆ'
        : row.status === 'warning'
        ? 'CẢNH BÁO'
        : 'LỖI';

    const colIssues = [
      ...row.errors.map((e) => `[${e.column}] ${e.message}`),
      ...row.warnings.map((w) => `[Cảnh báo] ${w}`),
    ];

    reportRows.push([
      `Dòng ${row.rowNumber}`,
      statusLabel,
      row.errors.map((e) => e.column).join(', ') || '—',
      colIssues.join(' | ') || 'Đạt yêu cầu',
      JSON.stringify(row.mappedData),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(reportRows);
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 50 }, { wch: 40 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Ket_Qua_Kiem_Tra');
  XLSX.writeFile(wb, `KetQuaKiemTra_${parseResult.dataType}.xlsx`);
}
