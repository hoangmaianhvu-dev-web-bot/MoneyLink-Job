import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Wallet, AlertCircle, CheckCircle, ArrowRight, Banknote, Coins } from 'lucide-react';
import { SQL_SETUP_INSTRUCTION, EXCHANGE_RATE } from '../constants';

const Withdraw: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState('Thẻ cào'); // Mặc định
  
  // account_number trong DB sẽ lưu: STK (Banking) hoặc Email nhận (Thẻ)
  const [inputValue1, setInputValue1] = useState(''); 
  
  // account_name trong DB sẽ lưu: Tên chủ TK (Banking) hoặc Loại thẻ/Nhà mạng (Thẻ)
  const [inputValue2, setInputValue2] = useState(''); 
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Tự động điền email của user vào ô nhận mã nếu là Thẻ cào/Garena
  useEffect(() => {
    if ((bankName === 'Thẻ cào' || bankName === 'Thẻ Garena') && profile?.email) {
        setInputValue1(profile.email);
    } else {
        setInputValue1('');
    }
    setInputValue2(''); // Reset field 2 khi đổi method
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

    if (withdrawAmount < 1) { // Min $1 demo
         setMessage({ type: 'error', text: 'Số tiền rút tối thiểu là $1.00' });
         setLoading(false);
         return;
    }

    try {
      const { error } = await supabase!.rpc('request_withdrawal', {
        amount: withdrawAmount,
        bank_name: bankName,
        account_number: inputValue1, // Email hoặc STK
        account_name: inputValue2 // Nhà mạng hoặc Tên chủ TK
      });

      if (error) {
          if (error.code === '42P01' || error.message.includes('function request_withdrawal does not exist')) {
             setShowSql(true);
             throw new Error('Hệ thống chưa được cập nhật (SQL). Vui lòng liên hệ Admin.');
          }
          throw error;
      }

      setMessage({ type: 'success', text: 'Tạo lệnh rút tiền thành công! Vui lòng chờ duyệt.' });
      fetchProfile(); // Refresh balance
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

  // Logic hiển thị label
  const isCard = bankName === 'Thẻ cào' || bankName === 'Thẻ Garena';
  
  const label1 = isCard ? 'Gmail nhận mã thẻ' : 'Số tài khoản ngân hàng';
  const placeholder1 = isCard ? 'example@gmail.com' : 'VD: 1903...';
  
  const label2 = isCard ? 'Nhà mạng (Viettel/Vina/Mobi...)' : 'Tên người thụ hưởng';
  const placeholder2 = isCard ? 'VD: Viettel' : 'NGUYEN VAN A';

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Wallet className="text-brand-500" /> Rút tiền
      </h2>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Banknote size={120} />
          </div>
          <p className="text-white/80 font-medium mb-1">Số dư khả dụng</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
              ${profile?.balance?.toFixed(4) || '0.0000'}
          </h2>
          <p className="text-white/80 mt-1 font-medium">≈ {( (profile?.balance || 0) * EXCHANGE_RATE ).toLocaleString('vi-VN')}đ</p>
      </div>
      
      {/* Exchange Rate Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Coins size={16} />
          </div>
          <span className="text-sm text-slate-300 font-medium">Tỉ giá quy đổi: <span className="text-white font-bold">1 USD = {EXCHANGE_RATE.toLocaleString('vi-VN')} VNĐ</span></span>
      </div>

      {showSql && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-yellow-500 font-bold mb-2">
                  <AlertCircle size={20} /> Cần cập nhật Database
              </div>
              <p className="text-sm text-slate-400 mb-2">Chức năng rút tiền cần bảng `withdrawals` cập nhật.</p>
              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-xs text-green-400 font-mono">
                  {SQL_SETUP_INSTRUCTION}
              </pre>
          </div>
      )}

      {/* Withdraw Form */}
      <div className="bg-social-card border border-slate-800 rounded-2xl p-6">
          {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <span className="font-medium text-sm">{message.text}</span>
              </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-5">
              <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Phương thức nhận tiền</label>
                  <div className="grid grid-cols-3 gap-3">
                      {['Thẻ cào', 'Banking', 'Thẻ Garena'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBankName(type)}
                            className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                                bankName === type 
                                ? 'bg-brand-600 border-brand-500 text-white' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                              {type}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">{label1}</label>
                      <input 
                        type={isCard ? "email" : "text"}
                        required
                        value={inputValue1}
                        onChange={(e) => setInputValue1(e.target.value)}
                        placeholder={placeholder1}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">{label2}</label>
                      <input 
                        type="text" 
                        required
                        value={inputValue2}
                        onChange={(e) => setInputValue2(e.target.value.toUpperCase())}
                        placeholder={placeholder2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none uppercase"
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Số tiền muốn rút (USD)</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                          <span className="font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        step="0.01"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-bold focus:border-brand-500 outline-none"
                        placeholder="0.00"
                      />
                  </div>
                  <div className="mt-2 text-right">
                      <span className="text-sm text-slate-400">Thực nhận: </span>
                      <span className="text-lg font-bold text-green-400">{estimatedVND.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                      {quickAmounts.map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setAmount(val.toString())}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-brand-400 border border-slate-700 transition-colors whitespace-nowrap"
                          >
                              ${val}
                          </button>
                      ))}
                  </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
              >
                 {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Xác nhận rút tiền <ArrowRight size={20} /></>}
              </button>
          </form>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-400 border border-slate-700">
          <p className="font-bold text-slate-300 mb-1">Lưu ý:</p>
          <ul className="list-disc list-inside space-y-1">
              <li>Mã thẻ cào/Garena sẽ được gửi vào Lịch sử giao dịch hoặc Email của bạn.</li>
              <li>Thời gian xử lý: 15 phút - 24 giờ.</li>
              <li>Số tiền rút tối thiểu: $1.00.</li>
              <li>Vui lòng nhập chính xác Gmail để nhận thông tin.</li>
          </ul>
      </div>
    </div>
  );
};

export default Withdraw;