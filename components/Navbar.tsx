import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Link as LinkIcon, Menu, X, LayoutDashboard } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { APP_NAME } from '../constants';

interface NavbarProps {
  session: any;
}

const Navbar: React.FC<NavbarProps> = ({ session }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <LinkIcon className="h-8 w-8 text-brand-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-purple-500">
                {APP_NAME}
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Trang chủ
              </Link>
              {session ? (
                <>
                  <Link to="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-brand-500/20">
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
              Trang chủ
            </Link>
            {session ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full text-left text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Đăng nhập
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="text-brand-400 hover:text-brand-300 block px-3 py-2 rounded-md text-base font-medium">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;