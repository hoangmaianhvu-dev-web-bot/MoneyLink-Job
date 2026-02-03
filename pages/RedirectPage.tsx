import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, CheckCircle, Search, Clock, DollarSign, Copy, Globe, AlertTriangle, Key } from 'lucide-react';
import { EXCHANGE_RATE } from '../constants';

const RedirectPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Steps: 1=Intro/Search, 2=Wait/OnSite, 3=EnterCode/Success
  const [step, setStep] = useState(1); 
  const [countdown, setCountdown] = useState(15); 
  const [claiming, setClaiming] = useState(false);
  const [fakeCode, setFakeCode] = useState('');

  useEffect(() => {
    const checkLink = async () => {
      if (!supabase || !slug) return;
      try {
        const { data, error } = await supabase
          .from('links')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          setErrorMsg('Nhiệm vụ không tồn tại.');
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: completed } = await supabase
                .from('task_completions')
                .select('id')
                .eq('user_id', user.id)
                .eq('link_id', data.id)
                .single();
            
            if (completed) {
                setErrorMsg('Nhiệm vụ này đã hoàn thành!');
                setLoading(false);
                return;
            }
        } else {
             setErrorMsg('Vui lòng đăng nhập.');
             setLoading(false);
             return;
        }

        setLinkData(data);
        setStep(1);
      } catch (err) {
        setErrorMsg('Lỗi hệ thống.');
      } finally {
        setLoading(false);
      }
    };
    checkLink();
  }, [slug]);

  // Timer logic for "Getting Code" simulation
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2 && countdown === 0) {
      // Khi hết giờ, giả vờ hiện mã code
      setFakeCode(`CODE-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [step, countdown]);

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      // Có thể thêm toast notification
  };

  const handleOpenGoogle = () => {
      window.open('https://google.com', '_blank');
      setStep(2); // Chuyển sang màn hình chờ nhập mã
  };

  const handleClaimReward = async () => {
      if (!linkData) return;
      setClaiming(true);
      try {
          const { error } = await supabase!.rpc('complete_task', { link_id: linkData.id });
          if (error) throw error;
          
          setStep(3); // Success
          setTimeout(() => {
              navigate('/dashboard');
          }, 2500);
      } catch (err: any) {
          console.error(err);
          alert('Lỗi: ' + err.message);
          setClaiming(false);
      }
  };

  if (loading) return <div className="min-h-screen bg-social-bg flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" /></div>;
  if (errorMsg) return (
      <div className="min-h-screen bg-social-bg flex items-center justify-center p-4">
          <div className="bg-social-card p-6 rounded-xl border border-red-900/50 text-center">
              <AlertTriangle className="mx-auto text-red-500 mb-2" size={32}/>
              <p className="text-white mb-4">{errorMsg}</p>
              <button onClick={() => navigate('/dashboard')} className="bg-slate-800 text-white px-4 py-2 rounded">Quay lại</button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-slate-200">
      {/* Header Task Info */}
      <div className="bg-[#1e1e1e] border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-md mx-auto flex justify-between items-center">
              <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Nhiệm vụ</p>
                  <p className="text-white font-bold flex items-center gap-2">
                      <Search size={14} className="text-brand-400"/> Google Search
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">Thưởng</p>
                  <p className="text-green-400 font-bold text-lg">+${linkData?.reward_amount}</p>
              </div>
          </div>
      </div>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* STEP 1: INSTRUCTION & ACTION */}
        {step === 1 && (
            <div className="space-y-4">
                <div className="bg-brand-900/20 border border-brand-500/30 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shrink-0">1</div>
                    <div>
                        <h3 className="text-brand-400 font-bold">Truy cập Google</h3>
                        <p className="text-sm text-slate-300">Mở tab mới và vào trang <b>Google.com</b></p>
                    </div>
                </div>

                <div className="bg-brand-900/20 border border-brand-500/30 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shrink-0">2</div>
                    <div className="flex-1">
                        <h3 className="text-brand-400 font-bold mb-1">Tìm từ khóa</h3>
                        <div className="bg-black/40 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                            <code className="text-yellow-400 font-mono font-bold text-lg select-all">vay tien online uy tin</code>
                            <button onClick={() => handleCopy("vay tien online uy tin")} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-md">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-900/20 border border-brand-500/30 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shrink-0">3</div>
                    <div>
                        <h3 className="text-brand-400 font-bold">Tìm trang web</h3>
                        <p className="text-sm text-slate-300 mb-2">Tìm kết quả có tên miền:</p>
                        <div className="bg-slate-800 px-3 py-1 rounded text-white font-bold inline-flex items-center gap-2">
                            <Globe size={14} className="text-slate-400"/> vaytien***.com
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleOpenGoogle}
                    className="w-full bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 text-lg flex justify-center items-center gap-2 mt-4 animate-pulse"
                >
                    <Search size={20} /> Mở Google & Làm ngay
                </button>
            </div>
        )}

        {/* STEP 2: WAITING FOR CODE (Simulation) */}
        {step === 2 && (
            <div className="space-y-6 pt-4 text-center">
                <div className="bg-social-card border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    {fakeCode ? (
                        <>
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                <Key size={32} />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Đã lấy được mã!</h3>
                            <div className="bg-black border border-green-500/50 p-4 rounded-xl mb-6">
                                <span className="text-2xl font-mono text-green-400 tracking-widest font-bold">{fakeCode}</span>
                            </div>
                            <button 
                                onClick={handleClaimReward}
                                disabled={claiming}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 flex justify-center items-center gap-2"
                            >
                                {claiming ? <Loader2 className="animate-spin" /> : <>Hoàn thành & Nhận tiền</>}
                            </button>
                        </>
                    ) : (
                        <>
                             <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="44" stroke="#333" strokeWidth="6" fill="none" />
                                    <circle cx="48" cy="48" r="44" stroke="#0ea5e9" strokeWidth="6" fill="none" 
                                        strokeDasharray={276} strokeDashoffset={276 - (276 * countdown) / 15} className="transition-all duration-1000 linear" />
                                </svg>
                                <span className="absolute text-2xl font-bold text-white">{countdown}s</span>
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Đang tìm mã bảo mật...</h3>
                            <p className="text-slate-400 text-sm">Vui lòng ở lại trang web đích và cuộn xuống cuối trang để lấy mã (Mô phỏng).</p>
                        </>
                    )}
                </div>
                
                <p className="text-slate-500 text-xs mt-4">
                    Lưu ý: Không tắt tab cho đến khi nhận được thông báo thành công.
                </p>
            </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 mb-6 animate-bounce">
                    <CheckCircle size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Thành công!</h2>
                <div className="text-center mb-8">
                    <p className="text-green-400 text-xl font-bold">+${linkData?.reward_amount}</p>
                    <p className="text-slate-500 text-sm">≈ {(linkData?.reward_amount * EXCHANGE_RATE).toLocaleString('vi-VN')}đ</p>
                </div>
                <p className="text-slate-500">Đang quay về danh sách việc...</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default RedirectPage;