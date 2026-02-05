import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Wallet, AlertCircle, CheckCircle, ArrowRight, Banknote, Coins, History } from 'lucide-react';
import { SQL_SETUP_INSTRUCTION, EXCHANGE_RATE } from '../constants';

const Withdraw: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState('Thẻ cào'); 
  const [inputValue1, setInputValue1] = useState(''); 
  const [inputValue2, setInputValue2] = useState(''); 
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if ((bankName === 'Thẻ cào' || bankName === 'Thẻ Garena') && profile?.email) {
        setInputValue1(profile.email);
    } else {
        setInputValue1('');
    }
    setInputValue2('');
  }, [bankName, profile]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase!.auth.getUser();
    if (user) {
      const { data } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const withdrawAmount = parseFloat(amount);
    
    if (!profile || withdrawAmount > profile.balance) {
      setMessage({ type: 'error', text: 'Số dư không đủ để thực hiện giao dịch.' });
      setLoading(false);
      return;
    }

    if (withdrawAmount < 1) { 
         setMessage({ type: 'error', text: 'Số tiền rút tối thiểu là $1.00' });
         setLoading(false);
         return;
    }

    try {
      const { error } = await supabase!.rpc('request_withdrawal', {
        amount: withdrawAmount,
        bank_name: bankName,
        account_number: inputValue1, 
        account_name: inputValue2
      });

      if (error) {
          if (error.code === '42P01' || error.message.includes('function request_withdrawal does not exist')) {
             setShowSql(true);
             throw new Error('Hệ thống chưa được cập nhật (SQL). Vui lòng liên hệ Admin.');
          }
          throw error;
      }

      setMessage({ type: 'success', text: 'Tạo lệnh rút tiền thành công! Vui lòng chờ duyệt.' });
      fetchProfile(); 
      setAmount('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1, 5, 10, 20, 50];
  const estimatedVND = amount ? (parseFloat(amount) * EXCHANGE_RATE) : 0;
  const isCard = bankName === 'Thẻ cào' || bankName === 'Thẻ Garena';
  const label1 = isCard ? 'Gmail nhận mã thẻ' : 'Số tài khoản ngân hàng';
  const placeholder1 = isCard ? 'example@gmail.com' : 'VD: 1903...';
  const label2 = isCard ? 'Nhà mạng (Viettel/Vina/Mobi...)' : 'Tên người thụ hưởng';
  const placeholder2 = isCard ? 'VD: Viettel' : 'NGUYEN VAN A';

  return (
    <div className="px-4 md:px-6 py-4 space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Wallet className="text-brand-500" size={20} /> Rút tiền
      </h2>

      {/* Balance Card - Compact Mode */}
      <div className="bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 rounded-xl p-4 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform duration-700">
              <Banknote size={80} />
          </div>
          
          <div className="relative z-10">
              <p className="text-white/90 font-bold uppercase text-[10px] tracking-widest mb-0.5">Số dư khả dụng</p>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-1 drop-shadow-md">
                  ${profile?.balance?.toFixed(4) || '0.0000'}
              </h2>
              <div className="mt-3 bg-black/20 backdrop-blur-sm inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10">
                  <Coins size={12} className="text-yellow-200"/>
                  <p className="text-white/90 text-xs font-bold">≈ {( (profile?.balance || 0) * EXCHANGE_RATE ).toLocaleString('vi-VN')}đ</p>
              </div>
          </div>
      </div>
      
      {/* Rate Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Coins size={16} />
          </div>
          <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Tỉ giá quy đổi</p>
              <p className="text-white font-bold text-sm">1 USD = <span className="text-brand-400">{EXCHANGE_RATE.toLocaleString('vi-VN')} VNĐ</span></p>
          </div>
      </div>

      {showSql && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-yellow-500 font-bold mb-1">
                  <AlertCircle size={16} /> Cần cập nhật Database
              </div>
              <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto text-[10px] text-green-400 font-mono">
                  {SQL_SETUP_INSTRUCTION}
              </pre>
          </div>
      )}

      {/* Withdraw Form */}
      <div className="glass-panel border border-slate-700 rounded-xl p-5">
          {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span className="font-medium text-xs">{message.text}</span>
              </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Phương thức nhận tiền</label>
                  <div className="grid grid-cols-3 gap-2">
                      {['Thẻ cào', 'Banking', 'Thẻ Garena'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBankName(type)}
                            className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${
                                bankName === type 
                                ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                              {type}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">{label1}</label>
                      <input 
                        type={isCard ? "email" : "text"}
                        required
                        value={inputValue1}
                        onChange={(e) => setInputValue1(e.target.value)}
                        placeholder={placeholder1}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">{label2}</label>
                      <input 
                        type="text" 
                        required
                        value={inputValue2}
                        onChange={(e) => setInputValue2(e.target.value.toUpperCase())}
                        placeholder={placeholder2}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none uppercase transition-colors"
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Số tiền muốn rút (USD)</label>
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-500 transition-colors">
                          <span className="font-bold text-lg">$</span>
                      </div>
                      <input 
                        type="number" 
                        step="0.01"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-8 pr-3 py-3 text-white text-lg font-bold focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                        placeholder="0.00"
                      />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-1.5">
                        {quickAmounts.map(val => (
                              <button 
                                key={val}
                                type="button"
                                onClick={() => setAmount(val.toString())}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold text-brand-400 border border-slate-700 transition-colors"
                              >
                                  ${val}
                              </button>
                          ))}
                      </div>
                      <div className="text-right">
                          <span className="text-[10px] text-slate-400 mr-1">Thực nhận:</span>
                          <span className="text-sm font-bold text-green-400">{estimatedVND.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                  </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 hover:scale-[1.01]"
              >
                 {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Xác nhận rút tiền <ArrowRight size={18} /></>}
              </button>
          </form>
      </div>
    </div>
  );
};

export default Withdraw;