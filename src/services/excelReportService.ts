import * as XLSX from 'xlsx';
import { ReportExportData } from './reportExportService';

/**
 * Xuất file Excel (.xlsx thật) với Sheet Tổng hợp và Sheet Chi tiết
 * Định dạng cột rõ, ngày tháng đúng định dạng, mã giữ nguyên
 * Không đưa dữ liệu không được phép xem vào file ẩn hoặc sheet phụ
 */
export function generateExcelReportXlsx(data: ReportExportData): void {
  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: TỔNG HỢP (Summary)
  const summaryRows: (string | number)[][] = [
    ['TRƯỜNG PHỔ THÔNG NỘI TRÚ TH & THCS MẪU SƠN'],
    ['BÁO CÁO TỔNG HỢP HOẠT ĐỘNG KHU NỘI TRÚ'],
    [],
    ['Khoảng thời gian:', data.timeRangeDescription],
    ['Phạm vi dữ liệu:', data.scopeDescription],
    ['Người xuất báo cáo:', data.exportedBy],
    ['Thời điểm xuất:', data.exportedAt],
    [],
    ['CHỈ SỐ TỔNG HỢP', 'GIÁ TRỊ'],
    ['Tổng số phòng nội trú', data.summary.totalRooms],
    ['Tổng sức chứa thiết kế (chỗ)', data.summary.totalCapacity],
    ['Tổng số học sinh', data.summary.totalStudents],
    ['Tỷ lệ lấp đầy phòng', data.summary.occupancyRate],
    ['Học sinh có mặt', data.summary.studentsPresent],
    ['Học sinh nghỉ phép', data.summary.studentsLeave],
    ['Học sinh báo ốm / y tế', data.summary.studentsSick],
    ['Tổng số sự vụ & báo cáo nhanh', data.summary.totalReports],
    ['Số sự vụ khẩn / cần xử lý sớm', data.summary.urgentReports],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp');

  // 2. SHEET 2: CHI TIẾT PHÒNG (Rooms)
  if (data.rooms.length > 0) {
    const roomHeaders = [
      'Mã phòng',
      'Tên phòng',
      'Dãy nhà',
      'Tầng',
      'Sức chứa',
      'Số HS hiện tại',
      'Trạng thái',
      'Giáo viên quản lý chính',
      'Ban cán sự phòng',
    ];

    const roomRows = data.rooms.map((r) => [
      r.code,
      r.name,
      r.building,
      r.floor,
      r.capacity,
      r.studentCount,
      r.status,
      r.managerTeachers,
      r.roomLeaders,
    ]);

    const wsRooms = XLSX.utils.aoa_to_sheet([roomHeaders, ...roomRows]);
    wsRooms['!cols'] = [
      { wch: 16 },
      { wch: 22 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRooms, 'Chi tiết Phòng');
  }

  // 3. SHEET 3: CHI TIẾT HỌC SINH (Students)
  if (data.students.length > 0) {
    const studentHeaders = [
      'Mã học sinh',
      'Họ và tên',
      'Cấp học',
      'Lớp',
      'Mã phòng',
      'Chức danh trong phòng',
      'Trạng thái điểm danh',
      'Giáo viên chủ nhiệm',
    ];

    const studentRows = data.students.map((s) => [
      s.code,
      s.fullName,
      s.educationLevel,
      s.className,
      s.roomCode,
      s.roleInRoom,
      s.boardingStatus,
      s.homeroomTeacher,
    ]);

    const wsStudents = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows]);
    wsStudents['!cols'] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Chi tiết Học sinh');
  }

  // 4. SHEET 4: SỰ VỤ & BÁO CÁO (Quick Reports)
  if (data.quickReports.length > 0) {
    const repHeaders = [
      'Mã báo cáo',
      'Mã phòng',
      'Tiêu đề sự vụ',
      'Mức ưu tiên',
      'Trạng thái',
      'Người báo cáo',
      'Thời điểm ghi nhận',
      'Kết quả xử lý',
    ];

    const repRows = data.quickReports.map((rep) => [
      rep.code,
      rep.roomCode,
      rep.title,
      rep.priority,
      rep.status,
      rep.reporter,
      rep.createdAt,
      rep.resolutionNote,
    ]);

    const wsReps = XLSX.utils.aoa_to_sheet([repHeaders, ...repRows]);
    wsReps['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 30 },
      { wch: 20 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsReps, 'Báo cáo sự vụ');
  }

  const fileName = `BaoCao_NoiTru_MauSon_${Date.now().toString().slice(-4)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
