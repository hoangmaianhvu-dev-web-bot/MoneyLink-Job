import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, User, LogOut, Zap, Bell, DollarSign, History, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { APP_NAME, ADMIN_EMAIL } from '../constants';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase!.auth.getUser();
    if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
    }
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { icon: Zap, label: 'Kiếm tiền', path: '/dashboard' },
    { icon: Wallet, label: 'Rút tiền', path: '/withdraw' }, 
    { icon: History, label: 'Lịch sử', path: '/history' }, 
    { icon: User, label: 'Tài khoản', path: '/account' }, 
  ];

  if (isAdmin) {
      navItems.push({ icon: ShieldAlert, label: 'Quản trị', path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-social-bg text-social-text flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-social-card border-r border-slate-800 z-50">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Zap className="text-white" fill="currentColor" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</span>
          </Link>
        </div>

        <div className="px-6 mb-4">
             <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Hệ thống ổn định</span>
             </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium text-[15px] ${
                isActive(item.path)
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'text-social-subtext hover:bg-social-hover hover:text-white'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              {item.label}
            </Link>
          ))}
          
          <div className="pt-6 mt-6 border-t border-slate-800">
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-social-subtext hover:bg-red-500/10 hover:text-red-500 transition-colors font-medium text-[15px]"
             >
                 <LogOut size={22} /> Đăng xuất
             </button>
          </div>
        </nav>

        <div className="p-4 mt-auto">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <img src="https://ui-avatars.com/api/?name=Admin&background=random" className="w-8 h-8 rounded-full" alt="Support" />
                    <div>
                        <p className="text-white text-xs font-bold">Hỗ trợ 24/7</p>
                        <p className="text-slate-400 text-[10px]">Zalo: 099.999.9999</p>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 pb-20 md:pb-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-social-card/95 backdrop-blur-md border-b border-slate-800 px-4 h-16 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                    <Zap className="text-white" fill="currentColor" size={18} />
                 </div>
                 <span className="font-bold text-lg">{APP_NAME}</span>
            </Link>
            <div className="flex gap-3">
                 <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     <span className="text-green-500 text-xs font-bold">Online</span>
                 </div>
                 <div className="w-9 h-9 bg-social-hover rounded-full flex items-center justify-center relative">
                    <Bell size={18} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-social-card"></span>
                </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto w-full min-h-screen">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-social-card border-t border-slate-800 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive(item.path)
                  ? 'text-brand-500'
                  : 'text-social-subtext hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive(item.path) ? 'bg-brand-500/10' : ''}`}>
                 <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;