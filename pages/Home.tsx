import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Clock, Smartphone, CheckCircle, Zap, Shield } from 'lucide-react';
import { APP_NAME } from '../constants';

const Home: React.FC = () => {
  return (
    <div className="bg-[#0B0F19] min-h-[calc(100vh-64px)] text-[#e4e6eb] font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute top-[100px] -left-[200px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 px-4 py-1.5 rounded-full text-brand-400 text-sm font-bold mb-8 backdrop-blur-md shadow-lg animate-fade-in">
                <Zap size={14} fill="currentColor" /> 
                <span className="tracking-wide">NỀN TẢNG KIẾM TIỀN ONLINE #1 VIỆT NAM</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.15] animate-slide-up">
              Kiếm Tiền Đơn Giản <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-blue-500 to-purple-600 drop-shadow-lg">
                Mọi Lúc, Mọi Nơi.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Biến thời gian rảnh rỗi thành thu nhập thụ động với {APP_NAME}. Chỉ cần điện thoại, thực hiện nhiệm vụ tìm kiếm đơn giản và nhận tiền ngay lập tức.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] transform hover:-translate-y-1">
                Tham gia ngay <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all hover:border-slate-600">
                Đăng nhập
              </Link>
            </div>
            
            <div className="mt-16 pt-8 border-t border-slate-800/50 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
               <div className="text-center">
                   <p className="text-3xl font-bold text-white">50K+</p>
                   <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Thành viên</p>
               </div>
               <div className="text-center">
                   <p className="text-3xl font-bold text-white">$100K+</p>
                   <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Đã chi trả</p>
               </div>
               <div className="text-center">
                   <p className="text-3xl font-bold text-white">24/7</p>
                   <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Hỗ trợ</p>
               </div>
               <div className="text-center">
                   <p className="text-3xl font-bold text-white">100%</p>
                   <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Uy tín</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-[#111827] rounded-3xl border border-slate-800 hover:border-brand-500/50 transition-all hover:transform hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20 text-white group-hover:scale-110 transition-transform">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Thu Nhập Hấp Dẫn</h3>
            <p className="text-slate-400 leading-relaxed">Tỉ giá quy đổi cạnh tranh nhất thị trường. Rút tiền nhanh chóng qua Thẻ cào, Ngân hàng, Ví điện tử.</p>
          </div>
          
          <div className="p-8 bg-[#111827] rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all hover:transform hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 text-white group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Thao Tác Nhanh Gọn</h3>
            <p className="text-slate-400 leading-relaxed">Quy trình tối ưu hóa, chỉ mất 1-2 phút cho mỗi nhiệm vụ. Giao diện thân thiện trên mọi thiết bị.</p>
          </div>

          <div className="p-8 bg-[#111827] rounded-3xl border border-slate-800 hover:border-green-500/50 transition-all hover:transform hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 text-white group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">An Toàn & Bảo Mật</h3>
            <p className="text-slate-400 leading-relaxed">Hệ thống bảo mật đa lớp. Thông tin cá nhân được mã hóa. Cộng đồng hỗ trợ đông đảo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;