import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { User, Mail, LogOut, Shield, ChevronRight, Gift, HelpCircle, Edit2, X, Save, Lock, AlertCircle, CheckCircle, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { EXCHANGE_RATE } from '../constants';

const Account: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
       const { data: { user } } = await supabase!.auth.getUser();
       if(user) {
           const { data } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
           setProfile(data);
           setEditName(data?.full_name || '');
       }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;
      setLoading(true);
      setNotification(null);
      
      try {
          const { error } = await supabase!
            .from('profiles')
            .update({ full_name: editName })
            .eq('id', profile.id);

          if (error) throw error;
          
          setProfile({ ...profile, full_name: editName });
          setIsEditing(false);
          setNotification({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      } catch (err: any) {
          setNotification({ type: 'error', text: err.message });
      } finally {
          setLoading(false);
      }
  };

  const handleSecurityAction = async () => {
      if (!profile) return;
      const confirm = window.confirm(`Bạn có muốn gửi email đặt lại mật khẩu đến ${profile.email} không?`);
      if (!confirm) return;

      setLoading(true);
      setNotification(null);
      
      try {
          const { error } = await supabase!.auth.resetPasswordForEmail(profile.email, {
              redirectTo: window.location.href,
          });
          if (error) throw error;
          setNotification({ type: 'success', text: 'Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.' });
      } catch (err: any) {
          setNotification({ type: 'error', text: err.message });
      } finally {
          setLoading(false);
      }
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setNotification({ type: 'success', text: 'Đã sao chép vào bộ nhớ tạm!' });
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    window.location.href = '/login';
  };

  // Referral Link Generation
  const referralLink = profile ? `${window.location.origin}/#/register?ref=${profile.id}` : 'Đang tải...';

  return (
    <div className="px-4 md:px-6 py-6 space-y-6 relative">
       
       {/* Notification Toast */}
       {notification && (
           <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-down max-w-sm ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
               {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
               <p className="text-sm font-medium">{notification.text}</p>
               <button onClick={() => setNotification(null)} className="ml-auto opacity-80 hover:opacity-100">
                   <X size={16} />
               </button>
           </div>
       )}

       {/* Edit Profile Modal */}
       {isEditing && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-social-card border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                   <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <Edit2 size={18} className="text-brand-500" /> Chỉnh sửa thông tin
                       </h3>
                       <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                           <X size={20} />
                       </button>
                   </div>
                   <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                       <div>
                           <label className="block text-sm font-bold text-slate-300 mb-2">Họ và tên hiển thị</label>
                           <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition-colors"
                                placeholder="Nhập tên của bạn"
                                required
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-slate-500 mb-2">Email (Không thể thay đổi)</label>
                           <input 
                                type="text"
                                value={profile?.email || ''}
                                disabled
                                className="w-full bg-slate-800 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
                           />
                       </div>
                       <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-lg shadow-brand-600/20"
                       >
                           {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> Lưu thay đổi</>}
                       </button>
                   </form>
               </div>
           </div>
       )}

       {/* Referral Modal */}
       {isReferralOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-social-card border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                   <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <Gift size={18} className="text-green-500" /> Giới thiệu bạn bè
                       </h3>
                       <button onClick={() => setIsReferralOpen(false)} className="text-slate-400 hover:text-white">
                           <X size={20} />
                       </button>
                   </div>
                   <div className="p-6 space-y-4">
                       <div className="text-center">
                           <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                               <Gift size={32} className="text-green-500" />
                           </div>
                           <h4 className="text-white font-bold text-lg">Mời bạn bè, nhận thưởng lớn</h4>
                           <p className="text-slate-400 text-sm mt-1">Nhận ngay <span className="text-green-400 font-bold">10% hoa hồng</span> từ thu nhập trọn đời của mỗi thành viên bạn giới thiệu.</p>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-slate-300 mb-2">Link giới thiệu của bạn</label>
                           <div className="flex gap-2">
                               <input 
                                    type="text"
                                    value={referralLink}
                                    readOnly
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none"
                               />
                               <button 
                                onClick={() => handleCopy(referralLink)}
                                className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl border border-slate-600 transition-colors"
                                title="Sao chép"
                               >
                                   <Copy size={20} />
                               </button>
                           </div>
                       </div>
                       
                       <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                           <div>
                               <p className="text-xs text-slate-500 font-bold uppercase">Đã giới thiệu</p>
                               <p className="text-white font-bold text-lg">0 thành viên</p>
                           </div>
                           <div className="text-right">
                               <p className="text-xs text-slate-500 font-bold uppercase">Hoa hồng</p>
                               <p className="text-green-400 font-bold text-lg">$0.00</p>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Support Modal */}
       {isSupportOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-social-card border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                   <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <HelpCircle size={18} className="text-blue-500" /> Trung tâm hỗ trợ
                       </h3>
                       <button onClick={() => setIsSupportOpen(false)} className="text-slate-400 hover:text-white">
                           <X size={20} />
                       </button>
                   </div>
                   <div className="p-6 space-y-4">
                       <p className="text-slate-300 text-sm text-center mb-4">
                           Bạn gặp vấn đề? Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng 24/7 để giải đáp mọi thắc mắc của bạn.
                       </p>

                       <div className="grid grid-cols-1 gap-3">
                           <a href="https://zalo.me" target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-slate-800 hover:bg-blue-600/10 border border-slate-700 hover:border-blue-500/50 p-4 rounded-xl transition-all group">
                               <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                   Zalo
                               </div>
                               <div>
                                   <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">Chat qua Zalo</h4>
                                   <p className="text-xs text-slate-500">Phản hồi nhanh (08:00 - 22:00)</p>
                               </div>
                               <ExternalLink size={16} className="ml-auto text-slate-500 group-hover:text-blue-400" />
                           </a>

                           <a href="https://t.me" target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-slate-800 hover:bg-cyan-600/10 border border-slate-700 hover:border-cyan-500/50 p-4 rounded-xl transition-all group">
                               <div className="w-10 h-10 rounded-lg bg-cyan-500 text-white flex items-center justify-center shrink-0">
                                   <MessageCircle size={20} />
                               </div>
                               <div>
                                   <h4 className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Telegram Support</h4>
                                   <p className="text-xs text-slate-500">Kênh thông báo & Hỗ trợ</p>
                               </div>
                               <ExternalLink size={16} className="ml-auto text-slate-500 group-hover:text-cyan-400" />
                           </a>

                           <a href="mailto:support@moneylink.com" className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl transition-all group">
                               <div className="w-10 h-10 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                                   <Mail size={20} />
                               </div>
                               <div>
                                   <h4 className="text-white font-bold text-sm">Gửi Email</h4>
                                   <p className="text-xs text-slate-500">support@moneylink.com</p>
                               </div>
                               <ChevronRight size={16} className="ml-auto text-slate-500" />
                           </a>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Profile Header */}
       <div className="bg-social-card border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
           <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        <img 
                            src={`https://ui-avatars.com/api/?name=${profile?.full_name || profile?.email || 'User'}&background=random&size=128&bold=true`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-slate-800 p-1.5 rounded-full border border-slate-700 text-slate-300 group-hover:text-white transition-colors">
                    <Edit2 size={14} />
                </div>
           </div>
           <div className="flex-1">
               <h2 className="text-2xl font-bold text-white">{profile?.full_name || 'Thành viên mới'}</h2>
               <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-400 text-sm mt-1 mb-3">
                   <Mail size={14} />
                   <span>{profile?.email}</span>
               </div>
               <div className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 px-3 py-1 rounded-full text-xs font-bold border border-brand-500/20">
                   <Shield size={12} /> Tài khoản xác thực
               </div>
           </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-2 gap-4">
           <div className="bg-social-card border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-brand-500/30 transition-colors">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Gift size={60} />
               </div>
               <p className="text-slate-400 text-xs font-bold uppercase">Tổng thu nhập</p>
               <p className="text-2xl font-bold text-white mt-1">${profile?.balance.toFixed(4) || '0.00'}</p>
               <p className="text-xs font-medium text-slate-400 mt-0.5">≈ {( (profile?.balance || 0) * EXCHANGE_RATE ).toLocaleString('vi-VN')}đ</p>
           </div>
           <div className="bg-social-card border border-slate-800 rounded-2xl p-5 group hover:border-purple-500/30 transition-colors">
               <p className="text-slate-400 text-xs font-bold uppercase">ID Thành viên</p>
               <p className="text-sm font-mono text-white mt-2 bg-slate-900 p-1.5 rounded text-center md:text-left truncate border border-slate-800">
                   {profile?.id}
               </p>
           </div>
       </div>

       {/* Menu List */}
       <div className="space-y-3">
           <button onClick={() => setIsEditing(true)} className="w-full bg-social-card hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-colors group">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-brand-500/10 flex items-center justify-center transition-colors">
                       <User size={20} className="text-slate-400 group-hover:text-brand-500" />
                   </div>
                   <div className="text-left">
                       <h4 className="text-white font-bold text-sm">Thông tin cá nhân</h4>
                       <p className="text-xs text-slate-500">Chỉnh sửa tên hiển thị</p>
                   </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
           </button>

           <button onClick={handleSecurityAction} className="w-full bg-social-card hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-colors group">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-purple-500/10 flex items-center justify-center transition-colors">
                       <Lock size={20} className="text-slate-400 group-hover:text-purple-500" />
                   </div>
                   <div className="text-left">
                       <h4 className="text-white font-bold text-sm">Bảo mật & Mật khẩu</h4>
                       <p className="text-xs text-slate-500">Đặt lại mật khẩu qua Email</p>
                   </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
           </button>

           <button onClick={() => setIsReferralOpen(true)} className="w-full bg-social-card hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-colors group">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-green-500/10 flex items-center justify-center transition-colors">
                       <Gift size={20} className="text-slate-400 group-hover:text-green-500" />
                   </div>
                   <div className="text-left">
                       <h4 className="text-white font-bold text-sm">Giới thiệu bạn bè</h4>
                       <p className="text-xs text-slate-500">Nhận 10% hoa hồng trọn đời</p>
                   </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
           </button>

           <button onClick={() => setIsSupportOpen(true)} className="w-full bg-social-card hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-colors group">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                       <HelpCircle size={20} className="text-slate-400 group-hover:text-blue-500" />
                   </div>
                   <div className="text-left">
                       <h4 className="text-white font-bold text-sm">Hỗ trợ & Trợ giúp</h4>
                       <p className="text-xs text-slate-500">FAQ, Liên hệ Admin</p>
                   </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
           </button>
       </div>

       <button 
        onClick={handleLogout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-red-500/20 transition-all mt-4"
       >
           <LogOut size={20} /> Đăng xuất tài khoản
       </button>
       
       <p className="text-center text-xs text-slate-600 pt-2 pb-6">
           Phiên bản 1.1.0 • MoneyLink Inc.
       </p>
    </div>
  );
};

export default Account;