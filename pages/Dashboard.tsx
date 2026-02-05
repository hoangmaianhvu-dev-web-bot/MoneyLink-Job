import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { LinkItem, UserProfile } from '../types';
import { Play, RefreshCw, TrendingUp, Search, ShieldCheck, AlertCircle, Briefcase, Zap } from 'lucide-react';
import { EXCHANGE_RATE } from '../constants';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<LinkItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
         if (profileError.code === '42P01') {
             setError('Bảng dữ liệu chưa được cài đặt.');
             setShowSql(true);
             setLoading(false);
             return;
         }
      } else {
         setProfile(profileData);
      }

      const { data: completedData } = await supabase
        .from('task_completions')
        .select('link_id')
        .eq('user_id', user.id);
      const completedIds = completedData?.map(c => c.link_id) || [];

      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // Filter tasks: Don't show completed ones. 
      // Note: In a real app, you might not want to see your OWN links as tasks to earn money, 
      // but for testing we just filter completed ones.
      const availableTasks = (linksData || []).filter(link => !completedIds.includes(link.id));
      setTasks(availableTasks);
      setError(null);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="px-0 md:px-6 py-4 space-y-6 animate-fade-in relative">
      
      {/* 1. LUXURY WALLET SECTION - 16:9 COMPACT CARD */}
      <div className="px-4 md:px-0">
          <div className="relative w-full max-w-[340px] mx-auto md:mx-0 aspect-video overflow-hidden rounded-xl shadow-xl group transition-all duration-300 hover:shadow-brand-500/20">
              {/* Background gradient simulating a premium card */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e293b] to-black opacity-95"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
              
              {/* Gold glow effects */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-500/20 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500/10 rounded-full blur-[60px]"></div>

              <div className="relative p-5 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Số dư khả dụng</p>
                          <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg gold-gradient-text">
                              ${profile?.balance?.toFixed(4) || '0.0000'}
                          </h2>
                      </div>
                      <div className="w-8 h-6 rounded bg-gradient-to-r from-yellow-200 to-yellow-500 opacity-80 shadow-md flex items-center justify-center">
                          <div className="w-5 h-3 border border-yellow-600 rounded-sm opacity-50"></div>
                      </div>
                  </div>

                  <div className="flex items-end justify-between">
                      <div>
                          <p className="text-slate-500 text-[9px] font-bold uppercase mb-0.5">Quy đổi VND</p>
                          <p className="text-sm font-medium text-slate-300">
                              ≈ {( (profile?.balance || 0) * EXCHANGE_RATE ).toLocaleString('vi-VN')} <span className="text-[10px] align-top">đ</span>
                          </p>
                      </div>
                      
                      <Link to="/withdraw" className="group relative px-4 py-1.5 bg-white text-black font-bold text-[10px] rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg">
                          <span className="relative z-10 flex items-center gap-1.5">Rút Tiền <TrendingUp size={12} /></span>
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-300 group-hover:opacity-90"></div>
                      </Link>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="px-4 md:px-0">
          
          {/* Status Bar - Compact */}
          <div className="mb-5 flex flex-col md:flex-row gap-3">
               <div className="flex-1 glass-panel rounded-lg p-3 flex items-center gap-3 border-l-4 border-brand-500">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                      <Zap size={16} />
                  </div>
                  <div>
                      <h4 className="text-white font-bold text-xs">Nhiệm vụ mới mỗi ngày</h4>
                      <p className="text-[10px] text-slate-400">Tự động cập nhật 5-10 phút/lần.</p>
                  </div>
               </div>
               <div className="flex-1 glass-panel rounded-lg p-3 flex items-center gap-3 border-l-4 border-gold-500">
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 shrink-0">
                      <TrendingUp size={16} />
                  </div>
                  <div>
                      <h4 className="text-white font-bold text-xs">Tỉ giá cao nhất</h4>
                      <p className="text-[10px] text-slate-400">1 USD = {EXCHANGE_RATE.toLocaleString('vi-VN')} VNĐ.</p>
                  </div>
               </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-white text-lg flex items-center gap-2">
                   <Briefcase size={18} className="text-brand-500"/>
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Danh Sách Nhiệm Vụ</span>
               </h3>
               <div className="flex gap-2">
                   <button 
                      onClick={fetchData} 
                      className="group flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg text-slate-400 hover:text-white transition-all hover:bg-white/5"
                    >
                       <RefreshCw size={14} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                       <span className="text-[10px] font-medium">Làm mới</span>
                   </button>
               </div>
          </div>

          {/* SQL Warning */}
          {showSql && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 animate-pulse">
                <AlertCircle className="text-red-500 shrink-0" size={24} />
                <div>
                    <h4 className="text-red-500 font-bold text-sm">Lỗi Hệ Thống</h4>
                    <p className="text-slate-400 text-xs mt-1">Cần thiết lập Database. Vui lòng liên hệ Admin.</p>
                </div>
            </div>
          )}

          {/* JOB LIST GRID */}
          <div className="grid grid-cols-1 gap-3 pb-20">
              {loading ? (
                 <div className="text-center py-16 glass-panel rounded-xl">
                     <div className="relative w-12 h-12 mx-auto mb-3">
                         <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <p className="text-slate-400 text-xs animate-pulse">Đang đồng bộ dữ liệu...</p>
                 </div>
              ) : tasks.length === 0 ? (
                 <div className="glass-panel rounded-xl p-8 text-center border-dashed border-2 border-slate-700">
                     <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                         <ShieldCheck className="text-slate-500" size={32} />
                     </div>
                     <h3 className="text-white font-bold text-base mb-1">Chưa có nhiệm vụ mới</h3>
                     <p className="text-slate-400 text-xs mb-4 max-w-sm mx-auto leading-relaxed">
                         Bạn đã hoàn thành xuất sắc tất cả công việc hiện tại.
                     </p>
                     <button onClick={fetchData} className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-medium text-xs transition-all shadow-lg shadow-brand-500/20">
                         Kiểm tra lại
                     </button>
                 </div>
              ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-brand-500/50 transition-all duration-300 group relative overflow-hidden">
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 text-white shrink-0">
                                <Search size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base group-hover:text-brand-400 transition-colors">Google Search</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 truncate max-w-[150px]">
                                        ID: {task.slug}
                                    </span>
                                    <span className="text-[10px] text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-900/30 flex items-center gap-1">
                                        <ShieldCheck size={10} /> Uy tín
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 mt-1 sm:mt-0">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Thù lao</p>
                                <p className="text-lg font-bold text-green-400 drop-shadow-sm">+${task.reward_amount}</p>
                            </div>
                            <Link 
                                to={`/v/${task.slug}`} 
                                className="px-5 py-2.5 bg-white text-slate-900 font-bold text-sm rounded-lg hover:bg-brand-50 transition-all flex items-center gap-1.5 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                            >
                                Thực hiện <Play size={14} fill="currentColor" />
                            </Link>
                        </div>
                    </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;