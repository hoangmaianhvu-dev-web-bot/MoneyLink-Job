import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { LinkItem, UserProfile } from '../types';
import { Play, Wallet, RefreshCw, TrendingUp, Search, ShieldCheck, AlertCircle, ChevronRight, Briefcase, Info } from 'lucide-react';
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
    <div className="px-0 md:px-6 py-4 space-y-6">
      
      {/* 1. WALLET HEADER (Compact & Modern) */}
      <div className="px-4 md:px-0">
          <div className="bg-social-card border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Wallet size={100} />
              </div>
              <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Số dư khả dụng</p>
                  <h2 className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1">
                      ${profile?.balance?.toFixed(4) || '0.0000'}
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">
                      ≈ {( (profile?.balance || 0) * EXCHANGE_RATE ).toLocaleString('vi-VN')}đ
                  </p>
              </div>
              <Link to="/withdraw" className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 z-10">
                  Rút tiền ngay
              </Link>
          </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="px-4 md:px-0">
          
          {/* Guide Banner */}
          <div className="mb-6 bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Info size={20} className="text-blue-400" />
              </div>
              <div>
                  <h4 className="text-blue-100 font-bold text-sm mb-1">Hướng dẫn kiếm tiền</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                      1. Chọn nhiệm vụ bên dưới và bấm "Làm ngay". <br/>
                      2. Tìm từ khóa trên Google theo hướng dẫn. <br/>
                      3. Lấy mã bảo mật tại trang đích và nhập vào hệ thống để nhận thưởng.
                  </p>
              </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-white text-lg flex items-center gap-2">
                   <Briefcase size={20} className="text-brand-500"/>
                   Danh sách nhiệm vụ
               </h3>
               <div className="flex gap-2">
                    <button onClick={fetchData} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={18} />
                    </button>
               </div>
          </div>

          {/* SQL Warning */}
          {showSql && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-yellow-500 shrink-0" size={24} />
                <div className="overflow-hidden">
                    <h4 className="text-yellow-500 font-bold text-sm">Cấu hình Database</h4>
                    <p className="text-slate-400 text-xs mt-1">Vui lòng chạy SQL script trong Supabase để tạo bảng.</p>
                </div>
            </div>
          )}

          {/* JOB LIST */}
          <div className="space-y-3 pb-20">
              {loading ? (
                 <div className="text-center py-10">
                     <RefreshCw className="animate-spin mx-auto text-brand-500 mb-2" size={24}/>
                     <p className="text-slate-500 text-sm">Đang tải việc...</p>
                 </div>
              ) : tasks.length === 0 ? (
                 <div className="bg-social-card border border-slate-800 rounded-2xl p-8 text-center">
                     <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                         <ShieldCheck className="text-slate-500" size={32} />
                     </div>
                     <h3 className="text-white font-bold mb-2">Hết nhiệm vụ tạm thời</h3>
                     <p className="text-slate-400 text-sm mb-6">Bạn đã làm rất tốt! Hãy quay lại sau ít phút hoặc liên hệ Admin để thêm việc.</p>
                     <button onClick={fetchData} className="text-brand-400 hover:text-brand-300 text-sm font-medium">Làm mới danh sách</button>
                 </div>
              ) : (
                  tasks.map((task) => (
                      <div key={task.id} className="bg-social-card hover:bg-[#2a2b2c] border border-slate-800 rounded-2xl p-4 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center group relative overflow-hidden">
                          {/* Left Accent Line */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>

                          {/* Icon */}
                          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-brand-500/50 transition-colors">
                              <Search className="text-white" size={24} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-blue-500/20">Google Search</span>
                                  <span className="text-slate-500 text-xs">• ID: {task.slug.toUpperCase()}</span>
                              </div>
                              <h4 className="text-white font-bold text-base truncate pr-4">
                                  Tìm từ khóa: <span className="text-brand-400">"vay tien online"</span>
                              </h4>
                              <p className="text-slate-400 text-xs mt-1 truncate">
                                  Trang đích: <span className="text-white">{task.original_url.replace(/^https?:\/\//, '')}</span> • Thời gian: ~45s
                              </p>
                          </div>

                          {/* Reward & Action */}
                          <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-3 mt-2 md:mt-0 pl-14 md:pl-0">
                              <div className="text-right">
                                  <span className="text-green-400 font-extrabold text-lg flex items-center justify-end">
                                      +${task.reward_amount?.toFixed(4) || '0.0000'}
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium block">
                                      ≈ {(task.reward_amount * EXCHANGE_RATE).toLocaleString('vi-VN')}đ
                                  </span>
                              </div>
                              <a 
                                  href={`#/v/${task.slug}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold px-6 py-2 rounded-lg shadow-lg shadow-brand-500/20 flex items-center gap-1 hover:gap-2 transition-all"
                              >
                                  Làm ngay <ChevronRight size={16} />
                              </a>
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