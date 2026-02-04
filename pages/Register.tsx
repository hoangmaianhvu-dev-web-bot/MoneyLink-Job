import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, UserPlus, AlertCircle, ArrowRight, Gift } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
      // Lấy ref ID từ URL: ?ref=UUID
      const params = new URLSearchParams(location.search);
      const ref = params.get('ref');
      if (ref) setReferrerId(ref);
  }, [location]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        setError("Chưa cấu hình Supabase.");
        return;
    }

    setLoading(true);
    setError(null);

    // Gửi referrer_id vào metadata để Trigger xử lý
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
          data: {
              referrer_id: referrerId
          }
      }
    });

    if (error) {
      console.error("Register Error:", error);
      const msg = error.message.toLowerCase();

      // Xử lý các lỗi cụ thể từ Supabase
      if (msg.includes('rate limit') || msg.includes('too many requests') || error.status === 429) {
        setError('Hệ thống đang bận (Rate Limit). Vui lòng thử Đăng nhập ngay, tài khoản có thể đã được tạo.');
      } else if (msg.includes('already registered') || msg.includes('user already registered')) {
        setError('Email này đã được đăng ký. Vui lòng chuyển sang trang Đăng nhập.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          navigate('/dashboard');
      } else {
          // Trường hợp cần xác nhận email hoặc đăng ký thành công nhưng chưa auto-login
          setError('Đăng ký thành công! Nếu không tự động chuyển, hãy thử Đăng nhập.');
          setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="text-center relative z-10">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Đăng ký tài khoản</h2>
          <p className="mt-2 text-sm text-slate-400">
            Đã có tài khoản? <Link to="/login" className="font-medium text-brand-500 hover:text-brand-400">Đăng nhập ngay</Link>
          </p>
        </div>

        {referrerId && (
            <div className="bg-gradient-to-r from-purple-900/40 to-brand-900/40 border border-brand-500/30 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                    <Gift size={20} />
                </div>
                <div>
                    <p className="text-xs text-brand-200 font-bold uppercase">Người giới thiệu</p>
                    <p className="text-sm text-white font-mono truncate w-48">ID: {referrerId.slice(0, 8)}...</p>
                </div>
            </div>
        )}

        {error && (
            <div className={`rounded-lg p-4 flex flex-col gap-2 text-sm ${error.includes('thành công') ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" /> 
                    <span className="font-medium">{error}</span>
                </div>
                {(error.includes('Rate Limit') || error.includes('đã được đăng ký')) && (
                    <Link to="/login" className="mt-1 ml-6 text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold hover:underline">
                        Chuyển đến Đăng nhập <ArrowRight size={14}/>
                    </Link>
                )}
            </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleRegister}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={20} />
              </div>
              <input
                type="email"
                required
                className="block w-full rounded-t-md border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={20} />
              </div>
              <input
                type="password"
                required
                className="block w-full rounded-b-md border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="Password (min 6 chars)"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-brand-600 py-3 px-4 text-sm font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                  <>
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserPlus className="h-5 w-5 text-brand-300 group-hover:text-brand-200" aria-hidden="true" />
                    </span>
                    Tạo tài khoản
                  </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;