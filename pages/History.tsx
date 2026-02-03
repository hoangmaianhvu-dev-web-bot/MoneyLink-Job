import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { HistoryItem } from '../types';
import { ArrowUpRight, ArrowDownLeft, Clock, Search, Filter } from 'lucide-react';

const History: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'withdraw'>('all');

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return;

        // 1. Fetch Task Completions (Income)
        const { data: incomeData } = await supabase!
            .from('task_completions')
            .select('*, links(reward_amount, original_url)')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

        const incomes: HistoryItem[] = (incomeData || []).map((item: any) => ({
            id: item.id,
            type: 'income',
            amount: item.links?.reward_amount || 0,
            description: `Nhiệm vụ: Google Search`,
            status: 'Hoàn thành',
            date: item.completed_at
        }));

        // 2. Fetch Withdrawals (Outcome)
        // Check if table exists first to avoid crash if SQL not run
        let withdrawals: HistoryItem[] = [];
        try {
            const { data: withdrawData, error } = await supabase!
                .from('withdrawals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (!error && withdrawData) {
                withdrawals = withdrawData.map((item: any) => ({
                    id: item.id,
                    type: 'withdraw',
                    amount: item.amount,
                    description: `Rút về ${item.bank_name} (${item.account_number})`,
                    status: item.status === 'pending' ? 'Đang xử lý' : item.status === 'approved' ? 'Thành công' : 'Từ chối',
                    date: item.created_at
                }));
            }
        } catch (e) {
            console.log('Withdrawals table might not exist yet');
        }

        // 3. Merge & Sort
        const combined = [...incomes, ...withdrawals].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setItems(combined);
        setLoading(false);
    };

    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
      if (filter === 'all') return true;
      return item.type === filter;
  });

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-brand-500" /> Lịch sử giao dịch
        </h2>
      </div>

      {/* Filter Tabs */}
      <div className="bg-social-card p-1 rounded-xl flex gap-1 border border-slate-800">
          {[
              { id: 'all', label: 'Tất cả' },
              { id: 'income', label: 'Thu nhập' },
              { id: 'withdraw', label: 'Rút tiền' }
          ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    filter === tab.id 
                    ? 'bg-slate-700 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      {/* List */}
      <div className="space-y-3">
          {loading ? (
             <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
          ) : filteredItems.length === 0 ? (
             <div className="text-center py-20 bg-social-card rounded-2xl border border-slate-800">
                 <Search className="mx-auto text-slate-600 mb-3" size={40} />
                 <p className="text-slate-400">Chưa có giao dịch nào.</p>
             </div>
          ) : (
             filteredItems.map(item => (
                 <div key={item.id} className="bg-social-card border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                     <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                             item.type === 'income' 
                             ? 'bg-green-500/10 text-green-500' 
                             : 'bg-red-500/10 text-red-500'
                         }`}>
                             {item.type === 'income' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                         </div>
                         <div>
                             <h4 className="font-bold text-white text-sm">{item.description}</h4>
                             <p className="text-xs text-slate-400 mt-1">
                                 {new Date(item.date).toLocaleString('vi-VN')}
                             </p>
                         </div>
                     </div>
                     <div className="text-right">
                         <p className={`font-bold text-base ${
                             item.type === 'income' ? 'text-green-400' : 'text-white'
                         }`}>
                             {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(4)}
                         </p>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                             item.status === 'Hoàn thành' || item.status === 'Thành công'
                             ? 'bg-green-500/10 text-green-500'
                             : item.status === 'Đang xử lý'
                             ? 'bg-yellow-500/10 text-yellow-500'
                             : 'bg-red-500/10 text-red-500'
                         }`}>
                             {item.status}
                         </span>
                     </div>
                 </div>
             ))
          )}
      </div>
    </div>
  );
};

export default History;