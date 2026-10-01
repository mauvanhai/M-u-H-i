import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { Room, Student, Shift, QuickReport } from '../types';

export interface ReportFilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month';
  building: string; // 'all' | 'U1' | 'U2' | 'U3' | 'U4'
  floor: string; // 'all' | '1' | '2' | '3'
  roomId: string; // 'all' | roomId
  status: string; // 'all' | 'active' | 'maintenance' | 'empty'
}

export interface ReportExportData {
  title: string;
  scopeDescription: string;
  timeRangeDescription: string;
  exportedBy: string;
  exportedAt: string;
  summary: {
    totalRooms: number;
    totalCapacity: number;
    totalStudents: number;
    studentsPresent: number;
    studentsLeave: number;
    studentsSick: number;
    occupancyRate: string;
    totalReports: number;
    urgentReports: number;
  };
  rooms: {
    code: string;
    name: string;
    building: string;
    floor: number;
    capacity: number;
    studentCount: number;
    status: string;
    managerTeachers: string;
    roomLeaders: string;
  }[];
  students: {
    code: string;
    fullName: string;
    educationLevel: string;
    className: string;
    roomCode: string;
    roleInRoom: string;
    boardingStatus: string;
    homeroomTeacher: string;
  }[];
  quickReports: {
    code: string;
    roomCode: string;
    title: string;
    priority: string;
    status: string;
    reporter: string;
    createdAt: string;
    resolutionNote: string;
  }[];
}

/**
 * Lọc dữ liệu báo cáo theo đúng quyền và bộ lọc
 */
export function buildFilteredReportData(
  filter: ReportFilterOptions,
  raw: {
    rooms: Room[];
    students: Student[];
    shifts: Shift[];
    reports: QuickReport[];
  },
  accountNames: Record<string, string>,
  exportedBy: string
): ReportExportData {
  // 1. Filter Rooms
  let filteredRooms = [...raw.rooms];
  if (filter.building !== 'all') {
    filteredRooms = filteredRooms.filter((r) => r.building === filter.building);
  }
  if (filter.floor !== 'all') {
    const fNum = parseInt(filter.floor, 10);
    filteredRooms = filteredRooms.filter((r) => r.floor === fNum);
  }
  if (filter.roomId !== 'all') {
    filteredRooms = filteredRooms.filter((r) => r.id === filter.roomId);
  }
  if (filter.status !== 'all') {
    filteredRooms = filteredRooms.filter((r) => r.status === filter.status);
  }

  const allowedRoomIds = new Set(filteredRooms.map((r) => r.id));

  // 2. Filter Students
  const filteredStudents = raw.students.filter((s) => allowedRoomIds.has(s.roomId));

  // 3. Filter Reports
  const filteredReports = raw.reports.filter((rep) => allowedRoomIds.has(rep.roomId));

  // Summary Metrics
  const totalCapacity = filteredRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalStudents = filteredStudents.length;
  const studentsPresent = filteredStudents.filter((s) => s.boardingStatus === 'present').length;
  const studentsLeave = filteredStudents.filter((s) => s.boardingStatus === 'on_leave').length;
  const studentsSick = filteredStudents.filter((s) => s.boardingStatus === 'sick').length;
  const occupancyRate = totalCapacity > 0 ? `${Math.round((totalStudents / totalCapacity) * 100)}%` : '0%';
  const urgentReports = filteredReports.filter((r) => r.priority === 'urgent').length;

  const buildingDesc = filter.building !== 'all' ? `Dãy ${filter.building}` : 'Toàn bộ các dãy U1-U4';
  const floorDesc = filter.floor !== 'all' ? `Tầng ${filter.floor}` : 'Tất cả tầng';
  const roomDesc = filter.roomId !== 'all' ? `Phòng cụ thể` : 'Tất cả phòng';
  const scopeDescription = `${buildingDesc} • ${floorDesc} • ${roomDesc}`;

  const timeRangeMap: Record<string, string> = {
    all: 'Tất cả thời gian',
    today: 'Hôm nay (24h qua)',
    week: 'Tuần này',
    month: 'Tháng này',
  };

  const statusLabelMap: Record<string, string> = {
    active: 'Đang hoạt động',
    maintenance: 'Đang bảo trì',
    empty: 'Chưa sử dụng',
  };

  const boardingStatusMap: Record<string, string> = {
    present: 'Có mặt',
    on_leave: 'Nghỉ phép',
    absent: 'Vắng',
    sick: 'Báo ốm/Y tế',
  };

  const studentRoleMap: Record<string, string> = {
    leader: 'Trưởng phòng',
    vice_leader: 'Phó phòng',
    member: 'Thành viên',
  };

  const reportStatusMap: Record<string, string> = {
    new: 'Mới gửi',
    accepted: 'Đã tiếp nhận',
    processing: 'Đang xử lý',
    completed: 'Đã hoàn thành',
  };

  return {
    title: 'BÁO CÁO TỔNG HỢP HOẠT ĐỘNG KHU NỘI TRÚ MẪU SƠN',
    scopeDescription,
    timeRangeDescription: timeRangeMap[filter.dateRange] || 'Tất cả thời gian',
    exportedBy,
    exportedAt: new Date().toLocaleString('vi-VN'),
    summary: {
      totalRooms: filteredRooms.length,
      totalCapacity,
      totalStudents,
      studentsPresent,
      studentsLeave,
      studentsSick,
      occupancyRate,
      totalReports: filteredReports.length,
      urgentReports,
    },
    rooms: filteredRooms.map((r) => {
      const gv1 = accountNames[r.managerTeacherIds[0]] || r.managerTeacherIds[0] || 'Chưa phân công';
      const gv2 = accountNames[r.managerTeacherIds[1]] || r.managerTeacherIds[1] || 'Chưa phân công';
      const studentCount = raw.students.filter((s) => s.roomId === r.id).length;

      const leader = raw.students.find((s) => s.id === r.leaderStudentId)?.fullName;
      const vice = raw.students.find((s) => s.id === r.viceLeaderStudentId)?.fullName;
      const leadersDesc = [leader ? `Trưởng: ${leader}` : '', vice ? `Phó: ${vice}` : '']
        .filter(Boolean)
        .join('; ') || 'Chưa bầu';

      return {
        code: r.code,
        name: r.name,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        studentCount,
        status: statusLabelMap[r.status] || r.status,
        managerTeachers: `${gv1}, ${gv2}`,
        roomLeaders: leadersDesc,
      };
    }),
    students: filteredStudents.map((s) => {
      const room = raw.rooms.find((r) => r.id === s.roomId);
      return {
        code: s.code,
        fullName: s.fullName,
        educationLevel: s.educationLevel === 'tieu_hoc' ? 'Tiểu học' : 'THCS',
        className: s.className,
        roomCode: room ? room.code : 'Chưa gán',
        roleInRoom: studentRoleMap[s.roleInRoom] || 'Thành viên',
        boardingStatus: boardingStatusMap[s.boardingStatus] || s.boardingStatus,
        homeroomTeacher: s.homeroomTeacherName || '—',
      };
    }),
    quickReports: filteredReports.map((rep) => ({
      code: rep.code,
      roomCode: rep.roomCode,
      title: rep.title,
      priority: rep.priority === 'urgent' ? 'Cần xử lý sớm (Khẩn)' : 'Thông thường',
      status: reportStatusMap[rep.status] || rep.status,
      reporter: rep.reporterName,
      createdAt: rep.createdAt,
      resolutionNote: rep.resolutionNote || 'Chưa có ghi chú xử lý',
    })),
  };
}

/**
 * Tạo file Word chuẩn .docx (A4, bảng biểu, tiếng Việt hiển thị chính xác)
 */
export async function generateWordReportDocx(data: ReportExportData): Promise<Blob> {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };

  const createCell = (text: string, isHeader = false, widthPercent = 20) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      borders: tableBorder,
      shading: isHeader ? { fill: 'F1F5F9' } : undefined,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: isHeader,
              size: isHeader ? 20 : 18, // 10pt or 9pt
              font: 'Times New Roman',
            }),
          ],
        }),
      ],
    });
  };

  // 1. Rooms Detail Table
  const roomRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell('Mã phòng', true, 14),
        createCell('Tên phòng', true, 20),
        createCell('Dãy/Tầng', true, 12),
        createCell('Học sinh/Sức chứa', true, 14),
        createCell('GV Quản lý chính', true, 24),
        createCell('Trạng thái', true, 16),
      ],
    }),
    ...data.rooms.map((r) =>
      new TableRow({
        children: [
          createCell(r.code, false, 14),
          createCell(r.name, false, 20),
          createCell(`${r.building} - T${r.floor}`, false, 12),
          createCell(`${r.studentCount}/${r.capacity}`, false, 14),
          createCell(r.managerTeachers, false, 24),
          createCell(r.status, false, 16),
        ],
      })
    ),
  ];

  // 2. Students Table
  const studentRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell('Mã HS', true, 14),
        createCell('Họ và tên', true, 24),
        createCell('Cấp / Lớp', true, 16),
        createCell('Phòng', true, 14),
        createCell('Chức danh', true, 16),
        createCell('Tình trạng', true, 16),
      ],
    }),
    ...data.students.slice(0, 100).map((s) =>
      new TableRow({
        children: [
          createCell(s.code, false, 14),
          createCell(s.fullName, false, 24),
          createCell(`${s.educationLevel} - ${s.className}`, false, 16),
          createCell(s.roomCode, false, 14),
          createCell(s.roleInRoom, false, 16),
          createCell(s.boardingStatus, false, 16),
        ],
      })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header info
          new Paragraph({
            children: [
              new TextRun({
                text: 'TRƯỜNG PHỔ THÔNG NỘI TRÚ TH & THCS MẪU SƠN',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'HỆ THỐNG QUẢN LÝ NỘI TRÚ HỌC SINH',
                size: 18,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '---------------------------------------------------',
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Report Title
          new Paragraph({
            text: data.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),

          // Metadata Info
          new Paragraph({
            children: [
              new TextRun({ text: '• Khoảng thời gian: ', bold: true }),
              new TextRun({ text: data.timeRangeDescription }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Phạm vi dữ liệu: ', bold: true }),
              new TextRun({ text: data.scopeDescription }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Người xuất báo cáo: ', bold: true }),
              new TextRun({ text: data.exportedBy }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Thời điểm xuất: ', bold: true }),
              new TextRun({ text: data.exportedAt }),
            ],
            spacing: { after: 300 },
          }),

          // Section 1: Summary
          new Paragraph({
            text: 'I. PHẦN TỔNG HỢP SỐ LIỆU',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `1. Tổng số phòng nội trú: ` }),
              new TextRun({ text: `${data.summary.totalRooms} phòng`, bold: true }),
              new TextRun({ text: ` | Tổng sức chứa: ` }),
              new TextRun({ text: `${data.summary.totalCapacity} chỗ`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `2. Tổng số học sinh: ` }),
              new TextRun({ text: `${data.summary.totalStudents} học sinh`, bold: true }),
              new TextRun({ text: ` (Tỷ lệ lấp đầy: ` }),
              new TextRun({ text: `${data.summary.occupancyRate}`, bold: true }),
              new TextRun({ text: `)` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `3. Điểm danh: ` }),
              new TextRun({ text: `Có mặt: ${data.summary.studentsPresent}` }),
              new TextRun({ text: ` • Nghỉ phép: ${data.summary.studentsLeave}` }),
              new TextRun({ text: ` • Báo ốm/Y tế: ${data.summary.studentsSick}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `4. Sự vụ & Báo cáo nhanh: ` }),
              new TextRun({ text: `${data.summary.totalReports} báo cáo` }),
              new TextRun({ text: ` (${data.summary.urgentReports} vụ cần xử lý sớm/khẩn cấp)` }),
            ],
            spacing: { after: 300 },
          }),

          // Section 2: Detailed Rooms Table
          new Paragraph({
            text: 'II. BẢNG CHI TIẾT DANH MỤC PHÒNG NỘI TRÚ',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            rows: roomRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // Section 3: Detailed Students Table
          new Paragraph({
            text: `III. DANH SÁCH CHI TIẾT HỌC SINH NỘI TRÚ (${data.students.length} học sinh)`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 150 },
          }),
          new Table({
            rows: studentRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // Empty footer note - No fake signature or made up reviews
          new Paragraph({
            text: '',
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const { Packer } = await import('docx');
  return await Packer.toBlob(doc);
}
