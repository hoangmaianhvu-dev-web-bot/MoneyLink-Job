import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { ShieldAlert, Users, CheckCircle, XCircle, DollarSign, Loader2, Database, Copy, Check, PlusCircle, CreditCard, Send } from 'lucide-react';
import { SQL_SETUP_INSTRUCTION, EXCHANGE_RATE, ADMIN_EMAIL } from '../constants';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users' | 'system'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // State for card approval
  const [approvingCardId, setApprovingCardId] = useState<string | null>(null);
  const [cardSerial, setCardSerial] = useState('');
  const [cardCode, setCardCode] = useState('');

  const navigate = useNavigate();

  // Security Check
  useEffect(() => {
    const checkAuth = async () => {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            navigate('/dashboard');
        }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (activeTab === 'withdrawals') {
            const { data: wData, error: wError } = await supabase!
                .from('withdrawals')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (wError) throw wError;

            const userIds = Array.from(new Set((wData || []).map((w: any) => w.user_id)));
            let pMap: Record<string, any> = {};

            if (userIds.length > 0) {
                const { data: pData } = await supabase!
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', userIds);
                
                if (pData) {
                    pMap = pData.reduce((acc: any, p: any) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                }
            }

            const combined = (wData || []).map((w: any) => ({
                ...w,
                profiles: pMap[w.user_id] || { email: 'Unknown', full_name: 'N/A' }
            }));

            setWithdrawals(combined);

        } else if (activeTab === 'users') {
            const { data, error } = await supabase!
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setUsers(data || []);
        }
    } catch (err: any) {
        console.error("Admin Fetch Error:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: any) => {
      // Nếu là thẻ cào, mở form nhập liệu
      if (withdrawal.bank_name === 'Thẻ cào' || withdrawal.bank_name === 'Thẻ Garena') {
          if (approvingCardId === withdrawal.id) {
              // Submit card info
              if (!cardSerial || !cardCode) {
                  alert("Vui lòng nhập Seri và Mã thẻ!");
                  return;
              }
              submitApprove(withdrawal, { card_serial: cardSerial, card_code: cardCode });
          } else {
              // Open input mode
              setApprovingCardId(withdrawal.id);
              setCardSerial('');
              setCardCode('');
          }
      } else {
          // Banking - Direct approve
          submitApprove(withdrawal);
      }
  };

  const submitApprove = async (withdrawal: any, extraData: any = {}) => {
      setProcessingId(withdrawal.id);
      try {
          const { error } = await supabase!
            .from('withdrawals')
            .update({ 
                status: 'approved',
                ...extraData
            })
            .eq('id', withdrawal.id);
          
          if (error) throw error;
          
          setWithdrawals(prev => prev.map(w => w.id === withdrawal.id ? { ...w, status: 'approved', ...extraData } : w));
          setApprovingCardId(null);
      } catch (error) {
          alert('Lỗi phê duyệt: ' + (error as any).message);
      } finally {
          setProcessingId(null);
      }
  };

  const handleReject = async (withdrawal: any) => {
      if (!window.confirm(`Bạn có chắc chắn muốn từ chối và hoàn tiền $${withdrawal.amount} cho ${withdrawal.profiles?.email}?`)) return;
      
      setProcessingId(withdrawal.id);
      try {
          const { error: wError } = await supabase!
            .from('withdrawals')
            .update({ status: 'rejected' })
            .eq('id', withdrawal.id);
          if (wError) throw wError;

          const { data: profile } = await supabase!
            .from('profiles')
            .select('balance')
            .eq('id', withdrawal.user_id)
            .single();

          if (profile) {
              await supabase!
                .from('profiles')
                .update({ balance: profile.balance + withdrawal.amount })
                .eq('id', withdrawal.user_id);
          }

          setWithdrawals(prev => prev.map(w => w.id === withdrawal.id ? { ...w, status: 'rejected' } : w));
          setApprovingCardId(null);
      } catch (error) {
          alert('Lỗi từ chối: ' + (error as any).message);
      } finally {
          setProcessingId(null);
      }
  };

  const copySQL = () => {
      navigator.clipboard.writeText(SQL_SETUP_INSTRUCTION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleSeedData = async () => {
      if (!window.confirm('Tạo dữ liệu mẫu?')) return;
      setLoading(true);
      try {
          const { data: { user } } = await supabase!.auth.getUser();
          if (!user) return;
          const sampleLinks = [
              { user_id: user.id, original_url: 'https://vaytienonline.com', slug: 'vay-tien-' + Date.now(), reward_amount: 0.05, views: 0 },
              { user_id: user.id, original_url: 'https://fecredit.com', slug: 'fe-credit-' + Date.now(), reward_amount: 0.08, views: 0 },
          ];
          await supabase!.from('links').insert(sampleLinks);
          alert('Tạo dữ liệu thành công!');
      } catch (err: any) {
          alert('Lỗi: ' + err.message);
      } finally {
          setLoading(false);
      }
  };

  const totalPaid = withdrawals.filter(w => w.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="px-4 md:px-6 py-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={20} /> Trang Quản Trị
        </h2>
        <button onClick={fetchData} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg w-fit overflow-x-auto">
          <button 
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'withdrawals' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <DollarSign size={14} /> Duyệt Rút Tiền
          </button>
          <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <Users size={14} /> Thành Viên
          </button>
          <button 
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'system' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <Database size={14} /> SQL System
          </button>
      </div>

      {/* Content */}
      <div className="bg-social-card border border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
          {activeTab === 'withdrawals' && (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase">
                              <th className="p-2">Thời gian</th>
                              <th className="p-2">User</th>
                              <th className="p-2">Số tiền</th>
                              <th className="p-2">Phương thức</th>
                              <th className="p-2">Trạng thái</th>
                              <th className="p-2 text-right">Hành động</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                          {withdrawals.length === 0 ? (
                              <tr><td colSpan={6} className="p-6 text-center text-slate-500">Không có dữ liệu</td></tr>
                          ) : (
                              withdrawals.map(w => (
                                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                                      <td className="p-2 text-slate-400 whitespace-nowrap">
                                          {new Date(w.created_at).toLocaleDateString('vi-VN')}
                                      </td>
                                      <td className="p-2">
                                          <div className="font-bold text-white truncate max-w-[120px]">{w.profiles?.full_name || 'N/A'}</div>
                                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{w.profiles?.email}</div>
                                      </td>
                                      <td className="p-2 font-bold text-white">
                                          ${w.amount}
                                          <div className="text-[10px] text-slate-500 font-normal">
                                              ≈ {(w.amount * EXCHANGE_RATE).toLocaleString('vi-VN')}đ
                                          </div>
                                      </td>
                                      <td className="p-2">
                                          <span className="block font-bold text-brand-400">{w.bank_name}</span>
                                          {/* Nếu là thẻ cào, hiển thị Email nhận và Nhà mạng */}
                                          <span className="text-[10px] text-slate-300 block">
                                              {w.account_name} 
                                          </span>
                                          <span className="text-[10px] text-slate-500 block break-all max-w-[150px]">
                                              {w.account_number}
                                          </span>
                                          
                                          {/* Hiển thị thẻ đã gửi nếu có */}
                                          {w.status === 'approved' && w.card_code && (
                                              <div className="mt-1 bg-green-500/10 p-1.5 rounded border border-green-500/20">
                                                  <p className="text-[9px] text-green-400 font-mono">S: {w.card_serial}</p>
                                                  <p className="text-[9px] text-green-400 font-mono">C: {w.card_code}</p>
                                              </div>
                                          )}
                                      </td>
                                      <td className="p-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              w.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                              w.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                              'bg-yellow-500/10 text-yellow-500'
                                          }`}>
                                              {w.status.toUpperCase()}
                                          </span>
                                      </td>
                                      <td className="p-2 text-right">
                                          {w.status === 'pending' && (
                                              <div className="flex flex-col gap-2 items-end">
                                                  {approvingCardId === w.id ? (
                                                      <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg flex flex-col gap-2 w-40 shadow-lg animate-fade-in z-10 relative right-0">
                                                          <input 
                                                            className="bg-slate-800 border border-slate-700 text-[10px] p-1 rounded text-white w-full" 
                                                            placeholder="Nhập Seri..."
                                                            value={cardSerial}
                                                            onChange={e => setCardSerial(e.target.value)}
                                                          />
                                                          <input 
                                                            className="bg-slate-800 border border-slate-700 text-[10px] p-1 rounded text-white w-full" 
                                                            placeholder="Nhập Mã Thẻ..."
                                                            value={cardCode}
                                                            onChange={e => setCardCode(e.target.value)}
                                                          />
                                                          <div className="flex gap-1 w-full">
                                                              <button onClick={() => setApprovingCardId(null)} className="flex-1 bg-slate-700 text-[10px] py-1 rounded">Hủy</button>
                                                              <button onClick={() => handleApprove(w)} className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded font-bold">Gửi</button>
                                                          </div>
                                                      </div>
                                                  ) : (
                                                      <div className="flex justify-end gap-1">
                                                          <button 
                                                            onClick={() => handleApprove(w)}
                                                            disabled={processingId === w.id}
                                                            className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded disabled:opacity-50 transition-colors" title="Duyệt"
                                                          >
                                                              <CheckCircle size={14} />
                                                          </button>
                                                          <button 
                                                            onClick={() => handleReject(w)}
                                                            disabled={processingId === w.id}
                                                            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded disabled:opacity-50 transition-colors" title="Từ chối & Hoàn tiền"
                                                          >
                                                              <XCircle size={14} />
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'users' && (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase">
                              <th className="p-2">Email</th>
                              <th className="p-2">Số dư</th>
                              <th className="p-2">Ngày tham gia</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                           {users.map(u => (
                               <tr key={u.id} className="hover:bg-slate-800/30">
                                   <td className="p-2">
                                       <div className="font-bold text-white truncate max-w-[150px]">{u.full_name || 'User'}</div>
                                       <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{u.email}</div>
                                   </td>
                                   <td className="p-2 font-bold text-green-400">${u.balance.toFixed(4)}</td>
                                   <td className="p-2 text-slate-400">{new Date(u.created_at || '').toLocaleDateString()}</td>
                               </tr>
                           ))}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'system' && (
              <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-sm">SQL Setup</h3>
                      <button onClick={copySQL} className="bg-brand-600 px-2 py-1 rounded text-xs text-white">Copy SQL</button>
                  </div>
                  <pre className="bg-slate-900 p-3 rounded-lg text-[10px] text-green-400 overflow-x-auto max-h-[300px]">
                      {SQL_SETUP_INSTRUCTION}
                  </pre>
              </div>
          )}
      </div>
    </div>
  );
};

export default Admin;