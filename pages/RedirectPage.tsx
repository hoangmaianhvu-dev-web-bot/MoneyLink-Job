import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, CheckCircle, Search, Copy, Globe, AlertTriangle, Key, LogIn, ArrowLeft } from 'lucide-react';
import { EXCHANGE_RATE } from '../constants';

const RedirectPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  
  // Steps: 1=Intro/Search, 2=Wait/OnSite, 3=EnterCode/Success
  const [step, setStep] = useState(1); 
  const [countdown, setCountdown] = useState(60); 
  const [claiming, setClaiming] = useState(false);
  const [fakeCode, setFakeCode] = useState('');
  const [inputCode, setInputCode] = useState('');

  useEffect(() => {
    const checkLink = async () => {
      if (!supabase) {
          setErrorMsg('Chưa cấu hình Supabase.');
          setLoading(false);
          return;
      }
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('links')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          setErrorMsg('Nhiệm vụ không tồn tại hoặc đã bị xóa.');
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
                setErrorMsg('Bạn đã hoàn thành nhiệm vụ này rồi!');
                setLoading(false);
                return;
            }
        } else {
             setErrorMsg('Bạn cần đăng nhập để làm nhiệm vụ này.');
             setIsAuthError(true);
             setLoading(false);
             return;
        }

        setLinkData(data);
        setStep(1);
      } catch (err) {
        setErrorMsg('Lỗi hệ thống. Vui lòng thử lại sau.');
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
      // Tạo mã code ngẫu nhiên để tăng tính thực tế
      setFakeCode(`MNL-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [step, countdown]);

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const handleOpenGoogle = () => {
      window.open('https://google.com', '_blank');
      setStep(2); // Chuyển sang màn hình chờ nhập mã
      setCountdown(45); // Set time thực tế hơn (45s)
  };

  const handleClaimReward = async () => {
      if (!linkData) return;
      if (inputCode.trim().toUpperCase() !== fakeCode) {
          alert("Mã xác nhận không đúng! Vui lòng kiểm tra lại.");
          return;
      }

      setClaiming(true);
      try {
          const { error } = await supabase!.rpc('complete_task', { link_id: linkData.id });
          if (error) throw error;
          
          setStep(3); // Success
          setTimeout(() => {
              navigate('/dashboard');
          }, 3000);
      } catch (err: any) {
          console.error(err);
          alert('Lỗi: ' + err.message);
          setClaiming(false);
      }
  };

  if (loading) return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-brand-500" size={40} />
          <p className="text-slate-500 text-sm">Đang tải nhiệm vụ...</p>
      </div>
  );

  if (errorMsg) return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <div className="bg-[#242526] p-8 rounded-2xl border border-slate-800 text-center max-w-sm w-full shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-500" size={32}/>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thông báo</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">{errorMsg}</p>
              
              <div className="space-y-3">
                  {isAuthError ? (
                      <Link to="/login" className="block w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                          <LogIn size={20} /> Đăng nhập ngay
                      </Link>
                  ) : (
                      <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                          <ArrowLeft size={20} /> Quay về Dashboard
                      </button>
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-slate-200 flex flex-col">
      {/* Header Task Info */}
      <div className="bg-[#1e1e1e] border-b border-slate-800 p-4 sticky top-0 z-50 shadow-lg">
          <div className="max-w-md mx-auto flex justify-between items-center">
              <div>
                  <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">NHIỆM VỤ TỪ KHÓA</p>
                  <p className="text-white font-bold flex items-center gap-2 text-sm">
                      <Search size={14} className="text-brand-400"/> Google Search
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">TIỀN THƯỞNG</p>
                  <p className="text-green-400 font-bold text-lg leading-none">+${linkData?.reward_amount}</p>
              </div>
          </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6 flex flex-col justify-center">
        
        {/* STEP 1: INSTRUCTION & ACTION */}
        {step === 1 && (
            <div className="space-y-5 animate-fade-in">
                <div className="bg-[#242526] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                    <h2 className="text-xl font-bold text-white mb-4 relative z-10">Hướng dẫn thực hiện</h2>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-500 shrink-0">1</div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Truy cập Google.com</h3>
                                <p className="text-xs text-slate-400">Mở tab mới hoặc ứng dụng Google.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-500 shrink-0">2</div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm mb-1">Tìm từ khóa</h3>
                                <div className="bg-black border border-dashed border-slate-600 rounded-lg p-3 flex justify-between items-center group cursor-pointer" onClick={() => handleCopy("vay tien online uy tin")}>
                                    <code className="text-yellow-400 font-mono font-bold text-base truncate">vay tien online uy tin</code>
                                    <Copy size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-500 shrink-0">3</div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Vào trang đích</h3>
                                <p className="text-xs text-slate-400 mb-1">Tìm kết quả có tên miền:</p>
                                <div className="bg-slate-800 px-3 py-1.5 rounded text-white font-bold text-sm inline-flex items-center gap-2 border border-slate-700">
                                    <Globe size={14} className="text-blue-400"/> {linkData?.original_url ? new URL(linkData.original_url).hostname : 'vaytien***.com'}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-500 shrink-0">4</div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Lấy mã & Nhập vào đây</h3>
                                <p className="text-xs text-slate-400">Cuộn xuống cuối trang, đợi thời gian đếm ngược để lấy mã.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleOpenGoogle}
                    className="w-full bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 text-lg flex justify-center items-center gap-2 animate-pulse"
                >
                    <Search size={20} /> Làm nhiệm vụ ngay
                </button>
            </div>
        )}

        {/* STEP 2: WAITING FOR CODE */}
        {step === 2 && (
            <div className="space-y-6 pt-4 text-center animate-fade-in">
                <div className="bg-[#242526] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    {fakeCode ? (
                        <div className="animate-fade-in-up">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500/20">
                                <Key size={32} />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-4">Đã tìm thấy mã!</h3>
                            
                            <div className="bg-black/40 p-5 rounded-xl border border-slate-700 text-left">
                                <div className="mb-6">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Mã bảo mật (Giả lập cho Demo):</p>
                                    <div className="text-center text-2xl font-mono text-green-400 font-bold tracking-widest bg-black p-3 rounded-lg border border-green-500/30 select-all cursor-pointer" onClick={() => handleCopy(fakeCode)}>
                                        {fakeCode}
                                    </div>
                                    <p className="text-center text-[10px] text-slate-600 mt-1 italic">(Trong thực tế, mã này nằm ở web đích)</p>
                                </div>
                                
                                <p className="text-white text-sm font-bold mb-2">Nhập mã xác nhận:</p>
                                <input 
                                    type="text" 
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none mb-4 font-mono text-lg text-center tracking-widest uppercase placeholder-slate-700"
                                    placeholder="MNL-XXXXX"
                                />
                                
                                <button 
                                    onClick={handleClaimReward}
                                    disabled={claiming || !inputCode}
                                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                                >
                                    {claiming ? <Loader2 className="animate-spin" /> : <>Xác nhận & Nhận tiền</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                             <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="60" stroke="#333" strokeWidth="8" fill="none" />
                                    <circle cx="64" cy="64" r="60" stroke="#0ea5e9" strokeWidth="8" fill="none" 
                                        strokeDasharray={377} strokeDashoffset={377 - (377 * countdown) / 45} className="transition-all duration-1000 linear" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{countdown}s</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Waiting</span>
                                </div>
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Đang tìm mã bảo mật...</h3>
                            <div className="flex items-start gap-2 text-left bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                <AlertTriangle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-blue-200 text-xs">Vui lòng giữ tab này mở và quay lại sau khi lấy được mã từ trang đích.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in-up">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] mb-6 animate-bounce">
                    <CheckCircle size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Hoàn thành!</h2>
                <div className="text-center mb-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full">
                    <p className="text-slate-400 text-sm mb-1">Bạn nhận được</p>
                    <p className="text-green-400 text-4xl font-extrabold mb-2">+${linkData?.reward_amount}</p>
                    <p className="text-slate-500 text-sm font-medium">≈ {(linkData?.reward_amount * EXCHANGE_RATE).toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Đang chuyển hướng về Dashboard...
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default RedirectPage;