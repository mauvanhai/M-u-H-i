import * as XLSX from 'xlsx';
import { ImportDataType } from '../types';

export interface TemplateColumn {
  key: string;
  name: string;
  required: boolean;
  type: string;
  allowedValues?: string[];
  description: string;
}

export const TEMPLATE_SCHEMAS: Record<
  ImportDataType,
  {
    title: string;
    description: string;
    columns: TemplateColumn[];
    examples: Record<string, string | number>[];
    notes: string[];
  }
> = {
  teachers: {
    title: 'Hồ sơ Giáo viên',
    description: 'Danh sách hồ sơ giáo viên phục vụ phân công quản lý phòng và trực ca.',
    columns: [
      {
        key: 'code',
        name: 'Mã giáo viên',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã định danh duy nhất (VD: GV-001, GV-002...). Bắt buộc và duy nhất.',
      },
      {
        key: 'name',
        name: 'Họ và tên',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Họ và tên đầy đủ của giáo viên (VD: Nguyễn Văn An). Cho phép trùng họ tên.',
      },
      {
        key: 'phone',
        name: 'Số điện thoại',
        required: false,
        type: 'Văn bản (Text)',
        description: 'Định dạng văn bản để giữ số 0 đầu (VD: 0912345678).',
      },
      {
        key: 'email',
        name: 'Email',
        required: false,
        type: 'Văn bản (Text)',
        description: 'Địa chỉ hòm thư điện tử (VD: an.nv@mauson.edu.vn).',
      },
    ],
    examples: [
      {
        'Mã giáo viên': 'GV-001',
        'Họ và tên': 'Hoàng Văn Bách',
        'Số điện thoại': '0912345678',
        Email: 'bach.hv@mauson.edu.vn',
      },
      {
        'Mã giáo viên': 'GV-002',
        'Họ và tên': 'Nông Thị Lan',
        'Số điện thoại': '0913456789',
        Email: 'lan.nt@mauson.edu.vn',
      },
      {
        'Mã giáo viên': 'GV-003',
        'Họ và tên': 'Lăng Văn Kiên',
        'Số điện thoại': '0984112233',
        Email: 'kien.lv@mauson.edu.vn',
      },
    ],
    notes: [
      '1. Sheet "Dữ liệu" để trống dòng; chỉ nhập dữ liệu từ dòng 2.',
      '2. Cột "Mã giáo viên" là bắt buộc và phải duy nhất trong toàn hệ thống.',
      '3. Định dạng cột "Mã giáo viên" và "Số điện thoại" là dạng Văn bản (Text) để giữ nguyên số 0 ở đầu.',
      '4. Việc nhập hồ sơ giáo viên KHÔNG tự tạo tài khoản đăng nhập, không tự cấp quyền và không tạo mật khẩu.',
    ],
  },

  students: {
    title: 'Hồ sơ Học sinh',
    description: 'Danh sách học sinh nội trú, cấp học, lớp và phân phòng.',
    columns: [
      {
        key: 'code',
        name: 'Mã học sinh',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã định danh duy nhất (VD: HS-MS001). Bắt buộc và duy nhất.',
      },
      {
        key: 'fullName',
        name: 'Họ và tên',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Họ và tên học sinh (VD: Lăng Văn Cường). Cho phép trùng họ tên.',
      },
      {
        key: 'educationLevel',
        name: 'Cấp học',
        required: true,
        type: 'Lựa chọn',
        allowedValues: ['Tiểu học', 'THCS'],
        description: 'Chỉ chấp nhận "Tiểu học" hoặc "THCS".',
      },
      {
        key: 'className',
        name: 'Lớp',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Tên lớp học (VD: Lớp 6A, Lớp 8B, Lớp 3A...).',
      },
      {
        key: 'roomCode',
        name: 'Mã phòng',
        required: false,
        type: 'Văn bản (Text)',
        description: 'Mã phòng hợp lệ đã có (VD: U1-T1-P01). Cho phép để trống để bổ sung sau.',
      },
      {
        key: 'homeroomTeacherCode',
        name: 'Mã giáo viên chủ nhiệm',
        required: false,
        type: 'Văn bản (Text)',
        description: 'Mã giáo viên hợp lệ đã có trong hệ thống (VD: GV-001).',
      },
      {
        key: 'roleInRoom',
        name: 'Chức danh trong phòng',
        required: false,
        type: 'Lựa chọn',
        allowedValues: ['Thành viên', 'Trưởng phòng', 'Phó phòng'],
        description: 'Chỉ chấp nhận: "Thành viên", "Trưởng phòng" hoặc "Phó phòng". Mặc định: Thành viên.',
      },
    ],
    examples: [
      {
        'Mã học sinh': 'HS-MS001',
        'Họ và tên': 'Lăng Văn Cường',
        'Cấp học': 'THCS',
        Lớp: 'Lớp 8A',
        'Mã phòng': 'U1-T1-P01',
        'Mã giáo viên chủ nhiệm': 'GV-001',
        'Chức danh trong phòng': 'Trưởng phòng',
      },
      {
        'Mã học sinh': 'HS-MS002',
        'Họ và tên': 'Hoàng Minh Khôi',
        'Cấp học': 'THCS',
        Lớp: 'Lớp 7A',
        'Mã phòng': 'U1-T1-P01',
        'Mã giáo viên chủ nhiệm': 'GV-002',
        'Chức danh trong phòng': 'Phó phòng',
      },
      {
        'Mã học sinh': 'HS-MS003',
        'Họ và tên': 'Triệu Phúc An',
        'Cấp học': 'Tiểu học',
        Lớp: 'Lớp 5A',
        'Mã phòng': '',
        'Mã giáo viên chủ nhiệm': 'GV-003',
        'Chức danh trong phòng': 'Thành viên',
      },
    ],
    notes: [
      '1. "Mã học sinh" bắt buộc và duy nhất; họ tên trùng nhau được phép.',
      '2. "Cấp học" chỉ nhận giá trị: "Tiểu học" hoặc "THCS".',
      '3. "Mã phòng" cho phép để trống để bổ sung sau. Nếu nhập mã phòng, phòng đó phải tồn tại.',
      '4. "Chức danh trong phòng": Thành viên, Trưởng phòng, Phó phòng. Trưởng phòng và Phó phòng phải khác nhau.',
      '5. Hệ thống sẽ cảnh báo nếu số học sinh vượt quá sức chứa tối đa của phòng.',
      '6. Nhập hồ sơ học sinh KHÔNG tự tạo tài khoản đăng nhập hay mật khẩu.',
    ],
  },

  rooms: {
    title: 'Danh mục Phòng nội trú',
    description: 'Cấu hình danh mục phòng nội trú theo các dãy nhà và tầng.',
    columns: [
      {
        key: 'code',
        name: 'Mã phòng',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã định danh duy nhất (VD: U1-T1-P01, U2-T2-P05...). Bắt buộc và duy nhất.',
      },
      {
        key: 'name',
        name: 'Tên phòng',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Tên hoặc số phòng (VD: Phòng Sao Mai, Phòng 101...).',
      },
      {
        key: 'building',
        name: 'Dãy nhà',
        required: true,
        type: 'Lựa chọn',
        allowedValues: ['U1', 'U2', 'U3', 'U4'],
        description: 'Chỉ chấp nhận: U1, U2, U3 hoặc U4.',
      },
      {
        key: 'floor',
        name: 'Tầng',
        required: true,
        type: 'Số nguyên',
        allowedValues: ['1', '2', '3'],
        description: 'Chỉ chấp nhận: 1, 2 hoặc 3.',
      },
      {
        key: 'capacity',
        name: 'Sức chứa',
        required: true,
        type: 'Số nguyên dương',
        description: 'Số lượng học sinh tối đa của phòng (VD: 8, 10, 12). Mặc định là 8.',
      },
    ],
    examples: [
      {
        'Mã phòng': 'U1-T1-P01',
        'Tên phòng': 'Phòng Sao Mai',
        'Dãy nhà': 'U1',
        Tầng: 1,
        'Sức chứa': 8,
      },
      {
        'Mã phòng': 'U1-T1-P02',
        'Tên phòng': 'Phòng Hướng Dương',
        'Dãy nhà': 'U1',
        Tầng: 1,
        'Sức chứa': 8,
      },
      {
        'Mã phòng': 'U2-T2-P01',
        'Tên phòng': 'Phòng Sơn Ca',
        'Dãy nhà': 'U2',
        Tầng: 2,
        'Sức chứa': 10,
      },
    ],
    notes: [
      '1. "Mã phòng" là bắt buộc và duy nhất.',
      '2. "Dãy nhà" chỉ nhận các giá trị: U1, U2, U3 hoặc U4.',
      '3. "Tầng" chỉ nhận các giá trị: 1, 2 hoặc 3.',
      '4. "Sức chứa" phải là số nguyên dương lớn hơn 0 (ví dụ 8).',
    ],
  },

  room_assignments: {
    title: 'Phân công Quản lý Phòng',
    description: 'Phân công 2 giáo viên quản lý chính cho từng phòng nội trú.',
    columns: [
      {
        key: 'roomCode',
        name: 'Mã phòng',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã phòng tham chiếu hợp lệ (VD: U1-T1-P01).',
      },
      {
        key: 'teacherCode',
        name: 'Mã giáo viên',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã giáo viên tham chiếu hợp lệ (VD: GV-001).',
      },
      {
        key: 'startDate',
        name: 'Ngày bắt đầu',
        required: true,
        type: 'Ngày (YYYY-MM-DD)',
        description: 'Định dạng ngày bắt đầu phân công: YYYY-MM-DD (VD: 2026-09-01).',
      },
      {
        key: 'endDate',
        name: 'Ngày kết thúc',
        required: false,
        type: 'Ngày (YYYY-MM-DD)',
        description: 'Định dạng ngày kết thúc (tùy chọn): YYYY-MM-DD (VD: 2027-05-31).',
      },
    ],
    examples: [
      {
        'Mã phòng': 'U1-T1-P01',
        'Mã giáo viên': 'GV-001',
        'Ngày bắt đầu': '2026-09-01',
        'Ngày kết thúc': '2027-05-31',
      },
      {
        'Mã phòng': 'U1-T1-P01',
        'Mã giáo viên': 'GV-002',
        'Ngày bắt đầu': '2026-09-01',
        'Ngày kết thúc': '2027-05-31',
      },
    ],
    notes: [
      '1. Mã phòng và Mã giáo viên phải tồn tại trong hệ thống.',
      '2. Mỗi phòng nội trú quy định phải có HAI GIÁO VIÊN QUẢN LÝ CHÍNH khác nhau. Nếu thiếu, hệ thống sẽ hiển thị cảnh báo chưa đủ phân công.',
      '3. Định dạng ngày tháng: YYYY-MM-DD (năm-tháng-ngày, ví dụ 2026-09-01).',
    ],
  },

  shifts: {
    title: 'Phân công Ca trực',
    description: 'Phân công giáo viên và phòng phụ trách cho các ca trực 24h.',
    columns: [
      {
        key: 'shiftCode',
        name: 'Mã ca',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã ca trực (VD: CA-20260901). Cho phép nhiều dòng cùng 1 mã ca.',
      },
      {
        key: 'startTime',
        name: 'Thời gian bắt đầu',
        required: true,
        type: 'Ngày giờ (YYYY-MM-DD HH:mm)',
        description: 'Định dạng: YYYY-MM-DD HH:mm (VD: 2026-09-01 07:00).',
      },
      {
        key: 'endTime',
        name: 'Thời gian kết thúc',
        required: true,
        type: 'Ngày giờ (YYYY-MM-DD HH:mm)',
        description: 'Định dạng: YYYY-MM-DD HH:mm (VD: 2026-09-02 07:00).',
      },
      {
        key: 'teacherCode',
        name: 'Mã giáo viên',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã giáo viên trực (VD: GV-001). Phải tồn tại trong hệ thống.',
      },
      {
        key: 'roomCode',
        name: 'Mã phòng',
        required: true,
        type: 'Văn bản (Text)',
        description: 'Mã phòng giáo viên phụ trách trong ca (VD: U1-T1-P01).',
      },
    ],
    examples: [
      {
        'Mã ca': 'CA-20260901',
        'Thời gian bắt đầu': '2026-09-01 07:00',
        'Thời gian kết thúc': '2026-09-02 07:00',
        'Mã giáo viên': 'GV-001',
        'Mã phòng': 'U1-T1-P01',
      },
      {
        'Mã ca': 'CA-20260901',
        'Thời gian bắt đầu': '2026-09-01 07:00',
        'Thời gian kết thúc': '2026-09-02 07:00',
        'Mã giáo viên': 'GV-001',
        'Mã phòng': 'U1-T1-P02',
      },
      {
        'Mã ca': 'CA-20260901',
        'Thời gian bắt đầu': '2026-09-01 07:00',
        'Thời gian kết thúc': '2026-09-02 07:00',
        'Mã giáo viên': 'GV-002',
        'Mã phòng': 'U2-T2-P01',
      },
    ],
    notes: [
      '1. Cho phép nhiều dòng cho cùng một ca trực ("Mã ca" giống nhau).',
      '2. Định dạng ngày giờ: YYYY-MM-DD HH:mm (Ví dụ: 2026-09-01 07:00).',
      '3. Hệ thống sẽ kiểm tra trùng lặp thời gian và cảnh báo nếu cùng một giáo viên bị phân công vào các ca trực chồng chéo giờ nhau.',
      '4. Mã giáo viên và Mã phòng phải tồn tại trong hệ thống.',
    ],
  },
};

/**
 * Tải file mẫu Excel chuẩn theo yêu cầu:
 * - Sheet 1: "Dữ liệu" (CHỈ CÓ TIÊU ĐỀ CỘT, KHÔNG CÓ DÒNG DỮ LIỆU)
 * - Sheet 2: "Hướng dẫn" (Mô tả, cột bắt buộc, kiểu dữ liệu, giá trị cho phép, ví dụ minh họa)
 */
export function downloadExcelTemplate(dataType: ImportDataType) {
  const schema = TEMPLATE_SCHEMAS[dataType];
  if (!schema) return;

  const wb = XLSX.utils.book_new();

  // 1. Sheet "Dữ liệu" (Headers only)
  const headerKeys = schema.columns.map((c) => c.name);
  const dataWs = XLSX.utils.aoa_to_sheet([headerKeys]);

  // Set column widths
  dataWs['!cols'] = schema.columns.map((c) => ({
    wch: Math.max(c.name.length + 4, 16),
  }));

  XLSX.utils.book_append_sheet(wb, dataWs, 'Dữ liệu');

  // 2. Sheet "Hướng dẫn"
  const guideRows: (string | number)[][] = [];

  guideRows.push([`HƯỚNG DẪN NHẬP DỮ LIỆU: ${schema.title.toUpperCase()}`]);
  guideRows.push([`Trường Phổ thông nội trú TH & THCS Mẫu Sơn`]);
  guideRows.push([]);
  guideRows.push([`I. MÔ TẢ VÀ QUY ĐỊNH CÁC CỘT DỮ LIỆU:`]);
  guideRows.push(['Tên cột', 'Bắt buộc?', 'Kiểu dữ liệu', 'Giá trị cho phép / Mô tả']);

  schema.columns.forEach((col) => {
    guideRows.push([
      col.name,
      col.required ? 'BẮT BUỘC (*)' : 'Tùy chọn',
      col.type,
      col.allowedValues
        ? `Chỉ chấp nhận: ${col.allowedValues.join(', ')}`
        : col.description,
    ]);
  });

  guideRows.push([]);
  guideRows.push([`II. LƯU Ý QUAN TRỌNG:`]);
  schema.notes.forEach((note) => {
    guideRows.push([note]);
  });

  guideRows.push([]);
  guideRows.push([`III. DỮ LIỆU MINH HỌA THAM KHẢO (KHÔNG ĐỂ TRONG SHEET DỮ LIỆU):`]);
  guideRows.push(headerKeys);

  schema.examples.forEach((ex) => {
    const row = headerKeys.map((k) => ex[k] ?? '');
    guideRows.push(row);
  });

  const guideWs = XLSX.utils.aoa_to_sheet(guideRows);
  guideWs['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 24 }, { wch: 60 }];

  XLSX.utils.book_append_sheet(wb, guideWs, 'Hướng dẫn');

  // Export file
  const fileName = `Mau_Nhap_${dataType}_MauSon.xlsx`;
  XLSX.writeFile(wb, fileName);
}
