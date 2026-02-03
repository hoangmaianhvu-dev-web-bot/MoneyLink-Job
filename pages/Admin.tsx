import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { ShieldAlert, Users, CheckCircle, XCircle, DollarSign, Loader2, Database, Copy, Check } from 'lucide-react';
import { SQL_SETUP_INSTRUCTION, EXCHANGE_RATE } from '../constants';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users' | 'system'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (activeTab === 'withdrawals') {
            // Fetch withdrawals
            const { data: wData, error: wError } = await supabase!
                .from('withdrawals')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (wError) throw wError;

            // Fetch related profiles manually to ensure robust joining
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

            // Combine data
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
      setProcessingId(withdrawal.id);
      try {
          const { error } = await supabase!
            .from('withdrawals')
            .update({ status: 'approved' })
            .eq('id', withdrawal.id);
          
          if (error) throw error;
          
          setWithdrawals(prev => prev.map(w => w.id === withdrawal.id ? { ...w, status: 'approved' } : w));
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
          // 1. Update withdrawal status
          const { error: wError } = await supabase!
            .from('withdrawals')
            .update({ status: 'rejected' })
            .eq('id', withdrawal.id);
          if (wError) throw wError;

          // 2. Refund balance to user
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

  const totalPaid = withdrawals.filter(w => w.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Trang Quản Trị
        </h2>
        <button onClick={fetchData} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Loader2 size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-social-card border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-xs font-bold uppercase">Yêu cầu chờ duyệt</p>
              <h3 className="text-2xl font-bold text-yellow-500 mt-1">
                  {withdrawals.filter(w => w.status === 'pending').length}
              </h3>
          </div>
          <div className="bg-social-card border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-xs font-bold uppercase">Tổng thành viên</p>
              <h3 className="text-2xl font-bold text-blue-500 mt-1">
                  {users.length > 0 ? users.length : '...'}
              </h3>
          </div>
          <div className="bg-social-card border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-xs font-bold uppercase">Tổng tiền đã chi</p>
              <h3 className="text-2xl font-bold text-green-500 mt-1">
                  ${totalPaid.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">≈ {(totalPaid * EXCHANGE_RATE).toLocaleString('vi-VN')}đ</p>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl w-fit overflow-x-auto">
          <button 
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'withdrawals' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <DollarSign size={16} /> Duyệt Rút Tiền
          </button>
          <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <Users size={16} /> Thành Viên
          </button>
          <button 
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'system' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <Database size={16} /> SQL System
          </button>
      </div>

      {/* Content */}
      <div className="bg-social-card border border-slate-800 rounded-2xl overflow-hidden min-h-[400px]">
          {activeTab === 'withdrawals' && (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                              <th className="p-4">Thời gian</th>
                              <th className="p-4">User</th>
                              <th className="p-4">Số tiền</th>
                              <th className="p-4">Phương thức</th>
                              <th className="p-4">Trạng thái</th>
                              <th className="p-4 text-right">Hành động</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                          {withdrawals.length === 0 ? (
                              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không có dữ liệu</td></tr>
                          ) : (
                              withdrawals.map(w => (
                                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                                      <td className="p-4 text-slate-400 whitespace-nowrap">
                                          {new Date(w.created_at).toLocaleDateString('vi-VN')}
                                          <br/>
                                          <span className="text-xs">{new Date(w.created_at).toLocaleTimeString('vi-VN')}</span>
                                      </td>
                                      <td className="p-4">
                                          <div className="font-bold text-white">{w.profiles?.full_name || 'N/A'}</div>
                                          <div className="text-xs text-slate-500">{w.profiles?.email}</div>
                                      </td>
                                      <td className="p-4 font-bold text-white">
                                          ${w.amount}
                                          <div className="text-[10px] text-slate-500 font-normal">
                                              ≈ {(w.amount * EXCHANGE_RATE).toLocaleString('vi-VN')}đ
                                          </div>
                                      </td>
                                      <td className="p-4">
                                          <span className="block font-bold text-brand-400">{w.bank_name}</span>
                                          <span className="text-xs text-slate-400">{w.account_number}</span>
                                          <span className="text-xs text-slate-400 block uppercase">{w.account_name}</span>
                                      </td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              w.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                              w.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                              'bg-yellow-500/10 text-yellow-500'
                                          }`}>
                                              {w.status.toUpperCase()}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          {w.status === 'pending' && (
                                              <div className="flex justify-end gap-2">
                                                  <button 
                                                    onClick={() => handleApprove(w)}
                                                    disabled={processingId === w.id}
                                                    className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 transition-colors" title="Duyệt"
                                                  >
                                                      <CheckCircle size={18} />
                                                  </button>
                                                  <button 
                                                    onClick={() => handleReject(w)}
                                                    disabled={processingId === w.id}
                                                    className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50 transition-colors" title="Từ chối & Hoàn tiền"
                                                  >
                                                      <XCircle size={18} />
                                                  </button>
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
                          <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                              <th className="p-4">ID</th>
                              <th className="p-4">Họ tên</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Số dư</th>
                              <th className="p-4">Ngày tham gia</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                           {users.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Không có dữ liệu</td></tr>
                          ) : (
                              users.map(u => (
                                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                      <td className="p-4 text-slate-500 font-mono text-xs">{u.id.substring(0, 8)}...</td>
                                      <td className="p-4 font-bold text-white">
                                          <div className="flex items-center gap-2">
                                              <img src={`https://ui-avatars.com/api/?name=${u.full_name || u.email}&size=24&background=random`} className="w-6 h-6 rounded-full" alt="" />
                                              {u.full_name || 'N/A'}
                                          </div>
                                      </td>
                                      <td className="p-4 text-slate-400">{u.email}</td>
                                      <td className="p-4">
                                          <div className="font-bold text-green-400">${u.balance.toFixed(4)}</div>
                                          <div className="text-[10px] text-slate-500">
                                              ≈ {(u.balance * EXCHANGE_RATE).toLocaleString('vi-VN')}đ
                                          </div>
                                      </td>
                                      <td className="p-4 text-slate-400">
                                          {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'system' && (
              <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                      <div>
                          <h3 className="text-white font-bold text-lg">Cấu hình Database</h3>
                          <p className="text-slate-400 text-sm">Sao chép mã SQL bên dưới và chạy trong Supabase SQL Editor để khởi tạo bảng.</p>
                      </div>
                      <button 
                        onClick={copySQL}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                          {copied ? 'Đã sao chép' : 'Sao chép SQL'}
                      </button>
                  </div>
                  <div className="relative">
                      <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-x-auto text-xs font-mono text-green-400 max-h-[500px] no-scrollbar">
                          {SQL_SETUP_INSTRUCTION}
                      </pre>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Admin;