import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Gift, Copy, Users, DollarSign, CheckCircle, Clock, Check, AlertCircle } from 'lucide-react';
import { EXCHANGE_RATE, REFERRAL_REWARD, SQL_SETUP_INSTRUCTION } from '../constants';

const Referral: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setLoading(true);
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return;

        // Get Profile
        const { data: profileData } = await supabase!
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', user.id)
            .single();
        setProfile(profileData);

        // Get Referrals
        // Join with profiles to get email/name of referred user
        const { data: refData, error } = await supabase!
            .from('referrals')
            .select('*, profiles:referred_user_id(email, full_name)')
            .eq('referrer_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
             if (error.code === '42P01') setShowSql(true); // Table missing
        } else {
             setReferrals(refData || []);
        }

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = () => {
      const link = `${window.location.origin}/#/register?ref=${profile?.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = referrals
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.reward_amount, 0);

  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const approvedCount = referrals.filter(r => r.status === 'approved').length;

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="text-brand-500" /> Giới thiệu bạn bè
        </h2>
      </div>

      {showSql && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-yellow-500 font-bold mb-2">
                  <AlertCircle size={20} /> Cần cập nhật Database
              </div>
              <p className="text-sm text-slate-400 mb-2">Chức năng này cần bảng `referrals` và trigger mới.</p>
              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-xs text-green-400 font-mono">
                  {SQL_SETUP_INSTRUCTION}
              </pre>
          </div>
      )}

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-brand-900/60 to-purple-900/60 border border-brand-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Mời bạn bè, cùng nhau kiếm tiền</h3>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      Nhận ngay <span className="text-green-400 font-bold">500 VNĐ</span> (≈${REFERRAL_REWARD}) khi người bạn giới thiệu hoàn thành nhiệm vụ đầu tiên trong ngày.
                  </p>
                  
                  <div className="bg-black/40 rounded-xl p-2 flex items-center border border-brand-500/30 max-w-md mx-auto md:mx-0">
                      <div className="flex-1 px-3 text-sm text-slate-300 truncate font-mono select-all">
                          {profile ? `${window.location.origin}/#/register?ref=${profile.id}` : 'Loading...'}
                      </div>
                      <button 
                        onClick={handleCopy}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                      >
                          {copied ? <Check size={16} /> : <Copy size={16} />} 
                          {copied ? 'Đã chép' : 'Sao chép'}
                      </button>
                  </div>
              </div>
              <div className="w-32 h-32 bg-brand-500/20 rounded-full flex items-center justify-center shrink-0 border-4 border-brand-500/10 animate-pulse-slow">
                  <Users size={48} className="text-brand-400" />
              </div>
          </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-social-card border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Đã giới thiệu</p>
              <p className="text-2xl font-bold text-white">{referrals.length} <span className="text-sm font-normal text-slate-500">người</span></p>
          </div>
          <div className="bg-social-card border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-500">{pendingCount} <span className="text-sm font-normal text-slate-500">người</span></p>
          </div>
          <div className="bg-social-card border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Hoa hồng đã nhận</p>
              <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
                  ${totalEarned.toFixed(4)}
              </p>
              <p className="text-[10px] text-slate-500">≈ {(totalEarned * EXCHANGE_RATE).toLocaleString('vi-VN')}đ</p>
          </div>
      </div>

      {/* List */}
      <div className="bg-social-card border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock size={18} className="text-slate-400" /> Lịch sử giới thiệu
              </h3>
          </div>
          
          <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
              {loading ? (
                  <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
              ) : referrals.length === 0 ? (
                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users size={24} className="text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm">Chưa có ai đăng ký qua link của bạn.</p>
                  </div>
              ) : (
                  referrals.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                                  {item.profiles?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                  <p className="text-white text-sm font-bold">{item.profiles?.email}</p>
                                  <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              {item.status === 'approved' ? (
                                  <div className="flex flex-col items-end">
                                      <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                          <CheckCircle size={12} /> +${item.reward_amount}
                                      </span>
                                      <span className="text-[10px] text-slate-500 mt-1">Đã nhận</span>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-end">
                                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                                          <Clock size={12} /> Chờ duyệt
                                      </span>
                                      <span className="text-[10px] text-slate-500 mt-1">Chưa làm NV</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-blue-400 shrink-0" size={20} />
          <div>
              <p className="text-blue-200 text-sm font-bold mb-1">Cơ chế duyệt thưởng</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                  Hoa hồng sẽ tự động được cộng vào tài khoản của bạn ngay khi người được giới thiệu <span className="text-white font-bold">hoàn thành nhiệm vụ đầu tiên</span> thành công.
              </p>
          </div>
      </div>
    </div>
  );
};

export default Referral;