/**
 * Tiện ích mã hóa băm mật khẩu và chuẩn hóa thông tin đăng nhập
 * An toàn ở phía client/simulated auth không lưu plain-text password
 */

// Chuẩn hóa số điện thoại Việt Nam (loại bỏ dấu chấm, khoảng trắng, gạch ngang, chuyển +84 thành 0)
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[\s\.\-\(\)]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length > 9) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

// Chuẩn hóa địa chỉ Gmail / Email
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

// Chuẩn hóa họ và tên (viết hoa chữ cái đầu, xóa khoảng trắng thừa)
export function normalizeFullName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Kiểm tra xem chuỗi có phải là định dạng email (đặc biệt là Gmail)
export function isEmailFormat(val: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(val.trim());
}

// Kiểm tra xem chuỗi có phải là số điện thoại
export function isPhoneFormat(val: string): boolean {
  const cleaned = normalizePhoneNumber(val);
  return /^0[0-9]{9,10}$/.test(cleaned);
}

// Mã hóa mật khẩu bằng SHA-256 bảo mật (không lưu plain-text)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '::MausonSchoolBoardingSalt2026');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash nếu crypto.subtle không khả dụng
  let hash = 0;
  const str = password + '::MausonSchoolBoardingSalt2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'simple_' + Math.abs(hash).toString(16);
}

// So khớp mật khẩu với hash đã lưu
export async function verifyPassword(password: string, storedHashOrPlain: string): Promise<boolean> {
  if (!password || !storedHashOrPlain) return false;
  // If stored as plain '123' from initial seed or transition
  if (storedHashOrPlain === password) return true;
  const calculatedHash = await hashPassword(password);
  return calculatedHash === storedHashOrPlain;
}
