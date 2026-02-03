import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Clock, Smartphone, CheckCircle, Zap } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="bg-[#18191a] min-h-[calc(100vh-64px)] text-[#e4e6eb]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/30 rounded-full blur-[128px]"></div>
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-600/30 rounded-full blur-[128px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-900/30 border border-brand-500/30 px-3 py-1 rounded-full text-brand-400 text-sm font-medium mb-6 backdrop-blur-sm">
                <Zap size={14} fill="currentColor" /> Nền tảng kiếm tiền #1 Việt Nam
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Làm Nhiệm Vụ Đơn Giản <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-500">
                Kiếm Tiền Thật.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[#b0b3b8] mb-10 leading-relaxed max-w-2xl mx-auto">
              Biến thời gian rảnh rỗi thành thu nhập thụ động. Thực hiện nhiệm vụ đơn giản trên giao diện thân thiện như mạng xã hội yêu thích của bạn.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 transform hover:-translate-y-1">
                Tham gia ngay <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-[#3a3b3c] hover:bg-[#4e4f50] transition-all">
                Đăng nhập
              </Link>
            </div>
            
            <div className="mt-12 flex justify-center items-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
               <span className="text-2xl font-bold text-slate-500">Partner with</span>
               {/* Fake Logos text */}
               <span className="font-bold text-xl">LINK4M</span>
               <span className="font-bold text-xl">YEUMONEY</span>
               <span className="font-bold text-xl">YEULINK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-[#242526] rounded-3xl border border-slate-800 hover:border-brand-500/50 transition-all hover:transform hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-500/20 transition-colors">
              <DollarSign className="w-7 h-7 text-brand-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Thu Nhập Hấp Dẫn</h3>
            <p className="text-[#b0b3b8] leading-relaxed">Nhận thưởng ngay lập tức vào ví sau mỗi nhiệm vụ thành công. Rút tiền 24/7.</p>
          </div>
          
          <div className="p-8 bg-[#242526] rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all hover:transform hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <Clock className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Thao Tác Nhanh Gọn</h3>
            <p className="text-[#b0b3b8] leading-relaxed">Nhiệm Vụ Dễ Dàng Đơn Giản Chỉ Mất 1-2 Phút Mỗi Ngày Thu Nhập 1.000.000 - 10.000.000 1 Tháng.</p>
          </div>

          <div className="p-8 bg-[#242526] rounded-3xl border border-slate-800 hover:border-green-500/50 transition-all hover:transform hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Uy Tín Tuyệt Đối</h3>
            <p className="text-[#b0b3b8] leading-relaxed">Hệ thống minh bạch, thống kê chi tiết. Hỗ trợ cộng đồng người dùng đông đảo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;