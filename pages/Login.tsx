import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        setError("Chưa cấu hình Supabase.");
        return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login Error:", error);
      let msg = error.message;
      
      // Việt hóa và làm rõ các lỗi phổ biến
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email hoặc mật khẩu không chính xác.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả mục Spam).';
      } else if (msg.includes('rate limit') || msg.includes('Too many requests')) {
         msg = 'Quá nhiều lần thử đăng nhập sai. Vui lòng thử lại sau ít phút.';
      }

      setError(msg);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-400">
            Hoặc <Link to="/register" className="font-medium text-brand-500 hover:text-brand-400">đăng ký tài khoản mới</Link>
          </p>
        </div>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                <span>{error}</span>
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                placeholder="Password"
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
                        <LogIn className="h-5 w-5 text-brand-300 group-hover:text-brand-200" aria-hidden="true" />
                    </span>
                    Đăng nhập
                  </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;