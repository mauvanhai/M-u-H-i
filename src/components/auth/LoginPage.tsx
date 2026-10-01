import React, { useState } from 'react';
import {
  School,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  UserPlus,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  Info,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RegistrationRole } from '../../types';

export const LoginPage: React.FC = () => {
  const {
    loginWithIdentifier,
    hasAdminAccount,
    setupFirstAdminAccount,
    submitRegistration,
    requestPasswordReset,
  } = useApp();

  // Mode: 'login' | 'register' | 'forgot_password' | 'setup_admin'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password' | 'setup_admin'>(
    !hasAdminAccount ? 'setup_admin' : 'login'
  );

  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup First Admin Form States
  const [adminFullName, setAdminFullName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  // Registration Form States
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<RegistrationRole>('giao_vien');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSubmitted, setRegSubmitted] = useState(false);

  // Forgot Password Form States
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotResult, setForgotResult] = useState<{ message: string; contactHint?: string } | null>(null);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập thông tin đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithIdentifier(identifier, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Đăng nhập không thành công.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Có lỗi xảy ra trong quá trình xác thực.');
    }
  };

  // Handle Setup First Admin Submit
  const handleSetupAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!adminFullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của cán bộ Ban Giám Hiệu.');
      return;
    }
    if (!adminPhone.trim() && !adminEmail.trim()) {
      setErrorMessage('Bắt buộc phải có ít nhất Số điện thoại hoặc Gmail để liên lạc.');
      return;
    }
    if (adminPassword.length < 6) {
      setErrorMessage('Mật khẩu quản trị viên phải có độ dài từ 6 ký tự trở lên.');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    const res = await setupFirstAdminAccount({
      fullName: adminFullName.trim(),
      phone: adminPhone.trim(),
      email: adminEmail.trim(),
      passwordInput: adminPassword,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Không thể khởi tạo tài khoản quản trị.');
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }
    if (!regPhone.trim() && !regEmail.trim()) {
      setErrorMessage('Bắt buộc phải cung cấp ít nhất Số điện thoại hoặc Gmail.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu tối thiểu phải từ 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    const res = await submitRegistration({
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      requestedRole: regRole,
      passwordInput: regPassword,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Có lỗi khi gửi đăng ký.');
    } else {
      setRegSubmitted(true);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setForgotResult(null);

    if (!forgotIdentifier.trim()) {
      setErrorMessage('Vui lòng nhập Số điện thoại hoặc Gmail.');
      return;
    }

    const res = requestPasswordReset(forgotIdentifier.trim());
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setForgotResult({
        message: res.message,
        contactHint: res.contactHint,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Banner Notice: Architecture & Simulation Status */}
      <div className="max-w-md w-full mx-auto mb-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3.5 text-xs shadow-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Thông báo trạng thái hệ thống: Xác thực ứng dụng</span>
        </div>
        <p className="text-[11px] text-amber-900 leading-relaxed">
          • Dữ liệu khởi tạo ban đầu sạch, tính từ dữ liệu thực tế (ban đầu bằng 0, không tự sinh dữ liệu mẫu).<br />
          • Mọi tài khoản mới đăng ký phải qua <strong>Ban Giám Hiệu phê duyệt</strong> trước khi kích hoạt phân quyền.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* School Crest & Title */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white mx-auto flex items-center justify-center shadow-md mb-3 ring-4 ring-blue-100">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            QUẢN LÝ NỘI TRÚ MẪU SƠN
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-blue-700 mt-1 uppercase tracking-wide">
            Trường Phổ thông nội trú TH & THCS Mẫu Sơn
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 1. VIEW: SETUP FIRST ADMIN (One-time, protected setup when no admin exists) */}
        {/* ========================================================================= */}
        {!hasAdminAccount && authMode === 'setup_admin' && (
          <div className="mt-6 bg-white py-7 px-5 sm:px-8 shadow-xl rounded-2xl border border-blue-200">
            <div className="mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900">Thiết Lập Ban Giám Hiệu Đầu Tiên</h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Hệ thống chưa có tài khoản quản trị nào. Đây là quy trình bảo vệ thực hiện một lần duy nhất để tạo tài khoản Ban Giám Hiệu đầu tiên.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSetupAdminSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên cán bộ BGH *</label>
                <input
                  type="text"
                  required
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Văn Bách"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số điện thoại liên lạc</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ Gmail công vụ / cá nhân</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Ví dụ: bgh.mauson@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Cung cấp ít nhất Số điện thoại hoặc Gmail để phục hồi và đăng nhập.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mật khẩu khởi tạo * (tối thiểu 6 ký tự)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Nhập mật khẩu an toàn..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Xác nhận mật khẩu *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoading ? 'Đang khởi tạo...' : 'Kích Hoạt Tài Khoản Ban Giám Hiệu'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. VIEW: REGULAR LOGIN (Đăng nhập bằng SĐT, Gmail hoặc Họ và Tên) */}
        {/* ========================================================================= */}
        {authMode === 'login' && (
          <div className="mt-6 bg-white py-7 px-5 sm:px-8 shadow-xl rounded-2xl border border-blue-100">
            <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Đăng nhập hệ thống</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập Số điện thoại, Gmail hoặc Họ và tên đã được duyệt.
                </p>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                Bảo mật
              </span>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">{infoMessage}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {/* Single Input: Số điện thoại, họ và tên hoặc Gmail */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số điện thoại, họ và tên hoặc Gmail
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Nhập SĐT (09xx), Gmail hoặc Họ và tên..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Nhập đúng thông tin cá nhân đã đăng ký với nhà trường.
                </span>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setAuthMode('forgot_password');
                    }}
                    className="text-blue-700 hover:underline text-[11px] font-semibold"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-blue-300"
                >
                  {isLoading ? (
                    <span>Đang xác thực...</span>
                  ) : (
                    <>
                      <span>Đăng nhập</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Links: Đăng ký tài khoản mới */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Chưa có tài khoản?</span>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setAuthMode('register');
                }}
                className="font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký tài khoản</span>
              </button>
            </div>

            {/* Hint about Google Sign-In */}
            <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                "Đăng nhập bằng Gmail" là nhập địa chỉ Gmail và mật khẩu của ứng dụng; hệ thống tuyệt đối không yêu cầu mật khẩu hòm thư Google của Thầy/Cô.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. VIEW: REGISTRATION FORM (Đăng ký chờ BGH phê duyệt) */}
        {/* ========================================================================= */}
        {authMode === 'register' && (
          <div className="mt-6 bg-white py-7 px-5 sm:px-8 shadow-xl rounded-2xl border border-blue-100">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Đăng ký tài khoản</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo yêu cầu cấp quyền; Ban Giám Hiệu sẽ phê duyệt trước khi kích hoạt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setAuthMode('login');
                }}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Quay lại đăng nhập</span>
              </button>
            </div>

            {regSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Đã gửi yêu cầu đăng ký thành công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Yêu cầu của bạn đang ở trạng thái <strong>Chờ Ban Giám Hiệu duyệt</strong>. Sau khi Ban Giám Hiệu xem xét và xác định vai trò chính thức, bạn có thể đăng nhập vào hệ thống.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRegSubmitted(false);
                    setAuthMode('login');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-800"
                >
                  Quay lại màn hình đăng nhập
                </button>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Nhập đầy đủ họ và tên..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="09xx..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Địa chỉ Gmail</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ten@gmail.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block -mt-2">
                    * Bắt buộc phải có ít nhất một thông tin liên hệ (SĐT hoặc Gmail).
                  </span>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Vai trò đề nghị (Không thể đăng ký vai trò Ban Giám Hiệu) *
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as RegistrationRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                    >
                      <option value="giao_vien">Giáo viên (Quản lý phòng & Trực ca)</option>
                      <option value="quan_sinh">Cán bộ Quản sinh</option>
                      <option value="truong_phong">Trưởng phòng học sinh</option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      * Người đăng ký không tự được cấp quyền; Ban Giám Hiệu sẽ xác định vai trò chính thức.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mật khẩu * (≥ 6 ký tự)</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mật khẩu..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Xác nhận mật khẩu *</label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Nhập lại..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition"
                    >
                      {isLoading ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Đăng Ký'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. VIEW: FORGOT PASSWORD (Khôi phục mật khẩu bảo mật) */}
        {/* ========================================================================= */}
        {authMode === 'forgot_password' && (
          <div className="mt-6 bg-white py-7 px-5 sm:px-8 shadow-xl rounded-2xl border border-blue-100">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Quên mật khẩu</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khôi phục tài khoản qua Số điện thoại hoặc Gmail đã đăng ký.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setAuthMode('login');
                }}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            </div>

            {forgotResult ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-950">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>Yêu cầu khôi phục đã được tiếp nhận</span>
                </div>
                <p className="text-blue-800 leading-relaxed">{forgotResult.message}</p>
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-blue-200 text-[11px] text-slate-600">
                  <strong>Thông tin liên hệ xác thực:</strong> {forgotResult.contactHint || 'Đã ghi nhận'}<br />
                  <span className="text-amber-800 font-semibold">
                    (Ứng dụng không hiển thị mã xác minh hoặc liên kết khôi phục công khai ngay trên giao diện để bảo vệ an toàn).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotResult(null);
                    setAuthMode('login');
                  }}
                  className="mt-3 w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Số điện thoại hoặc Gmail tài khoản của bạn *
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Ví dụ: 0912345678 hoặc email@gmail.com..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition"
                  >
                    Gửi Yêu Cầu Khôi Phục Mật Khẩu
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-5">
          Trường Phổ thông nội trú TH & THCS Mẫu Sơn • Xã Mẫu Sơn, Tỉnh Lạng Sơn
        </p>
      </div>
    </div>
  );
};
