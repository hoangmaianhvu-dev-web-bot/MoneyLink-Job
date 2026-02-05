import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, CheckCircle, Search, Copy, Globe, AlertTriangle, Key, LogIn, ArrowLeft, Clock, EyeOff } from 'lucide-react';
import { EXCHANGE_RATE } from '../constants';

const RedirectPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  
  const [step, setStep] = useState(1); 
  const [countdown, setCountdown] = useState(60); 
  const [claiming, setClaiming] = useState(false);
  const [fakeCode, setFakeCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isTabActive, setIsTabActive] = useState(true);

  // Anti-cheat refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Visibility Check (Anti-cheat)
    const handleVisibilityChange = () => {
        setIsTabActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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

  useEffect(() => {
    if (step === 2) {
        if (countdown > 0 && isTabActive) {
             timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0) {
             // Generate "Fake" code when timer ends to simulate finding it on the site
             setFakeCode(`MNL-${Math.floor(10000 + Math.random() * 90000)}`);
        }
    }
    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step, countdown, isTabActive]);

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const handleOpenGoogle = () => {
      window.open('https://google.com', '_blank');
      setStep(2); 
      setCountdown(45); // Set task duration
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
          
          setStep(3); 
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
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-brand-500" size={40} />
          <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
      </div>
  );

  if (errorMsg) return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl text-center max-w-sm w-full shadow-2xl border-red-500/20">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <AlertTriangle className="text-red-500" size={32}/>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thông báo</h3>
              <p className="text-slate-400 mb-6 leading-relaxed text-sm">{errorMsg}</p>
              
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
    <div className="min-h-screen bg-[#0B0F19] font-sans text-slate-200 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-purple-500 z-50"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel border-b border-slate-800 p-4 sticky top-0 z-40 shadow-xl backdrop-blur-md">
          <div className="max-w-md mx-auto flex justify-between items-center">
              <div>
                  <p className="text-[10px] text-brand-400 uppercase font-extrabold tracking-wider mb-0.5">NHIỆM VỤ TỪ KHÓA</p>
                  <p className="text-white font-bold flex items-center gap-2 text-sm">
                      <Search size={14} className="text-slate-400"/> Google Search
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mb-0.5">TIỀN THƯỞNG</p>
                  <p className="text-green-400 font-bold text-lg leading-none drop-shadow-sm">+${linkData?.reward_amount}</p>
              </div>
          </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6 flex flex-col justify-center relative z-10">
        
        {/* STEP 1: INSTRUCTION & ACTION */}
        {step === 1 && (
            <div className="space-y-5 animate-fade-in">
                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-6 relative z-10 text-center">Quy trình thực hiện</h2>
                    
                    <div className="space-y-6 relative z-10">
                        {/* Step Item */}
                        <div className="flex gap-4 items-start group">
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center font-bold text-brand-400 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">1</div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-sm mb-1">Truy cập Google</h3>
                                <p className="text-xs text-slate-400">Mở Google.com trên trình duyệt hoặc ứng dụng.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center font-bold text-brand-400 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">2</div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm mb-2">Tìm từ khóa này</h3>
                                <div 
                                    className="bg-black/60 border border-dashed border-brand-500/50 rounded-xl p-3 flex justify-between items-center group cursor-pointer hover:bg-black/80 transition-colors" 
                                    onClick={() => handleCopy("vay tien online uy tin")}
                                >
                                    <code className="text-yellow-400 font-mono font-bold text-base truncate select-all">vay tien online uy tin</code>
                                    <div className="bg-slate-800 p-1.5 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-brand-600 transition-all">
                                        <Copy size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center font-bold text-brand-400 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">3</div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-sm mb-2">Tìm trang đích</h3>
                                <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 flex items-center gap-3">
                                    <Globe size={18} className="text-blue-400 shrink-0"/> 
                                    <span className="text-white font-semibold text-sm truncate">{linkData?.original_url ? new URL(linkData.original_url).hostname : 'vaytien***.com'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleOpenGoogle}
                    className="w-full bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] text-lg flex justify-center items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Search size={20} /> Bắt đầu làm nhiệm vụ
                </button>
            </div>
        )}

        {/* STEP 2: WAITING FOR CODE */}
        {step === 2 && (
            <div className="space-y-6 pt-4 text-center animate-fade-in">
                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-700/50">
                    {fakeCode ? (
                        <div className="animate-slide-up">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                <Key size={40} />
                            </div>
                            <h3 className="text-white font-bold text-2xl mb-2">Đã tìm thấy mã!</h3>
                            <p className="text-slate-400 text-sm mb-6">Mã bảo mật đã xuất hiện trên trang đích.</p>
                            
                            <div className="bg-black/40 p-6 rounded-2xl border border-slate-700 text-left mb-6">
                                <div className="mb-6">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 tracking-wider">MÃ BẢO MẬT (DEMO)</p>
                                    <div 
                                        className="text-center text-3xl font-mono text-green-400 font-bold tracking-widest bg-black p-4 rounded-xl border border-green-500/30 select-all cursor-pointer hover:border-green-500 transition-colors" 
                                        onClick={() => handleCopy(fakeCode)}
                                    >
                                        {fakeCode}
                                    </div>
                                </div>
                                
                                <p className="text-white text-sm font-bold mb-2">Nhập mã xác nhận:</p>
                                <input 
                                    type="text" 
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-4 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none mb-4 font-mono text-xl text-center tracking-widest uppercase placeholder-slate-700"
                                    placeholder="MNL-XXXXX"
                                />
                                
                                <button 
                                    onClick={handleClaimReward}
                                    disabled={claiming || !inputCode}
                                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                                >
                                    {claiming ? <Loader2 className="animate-spin" /> : <>Xác nhận & Nhận tiền</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {!isTabActive && (
                                <div className="mb-4 bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                                    <EyeOff size={16} /> Vui lòng không rời khỏi trang!
                                </div>
                            )}

                             <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                                {/* SVG Timer Ring */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="#1f2937" strokeWidth="8" fill="none" />
                                    <circle 
                                        cx="80" cy="80" r="70" 
                                        stroke={isTabActive ? "#3b82f6" : "#ef4444"} 
                                        strokeWidth="8" 
                                        fill="none" 
                                        strokeLinecap="round"
                                        strokeDasharray={440} 
                                        strokeDashoffset={440 - (440 * countdown) / 45} 
                                        className="transition-all duration-1000 linear drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl font-bold tracking-tighter ${isTabActive ? 'text-white' : 'text-red-500'}`}>{countdown}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">GIÂY</span>
                                </div>
                            </div>
                            
                            <h3 className="text-white font-bold text-xl mb-3">{isTabActive ? 'Đang đợi mã xuất hiện...' : 'Đã tạm dừng!'}</h3>
                            <div className={`flex items-start gap-3 text-left p-4 rounded-xl border transition-colors ${isTabActive ? 'bg-blue-500/10 border-blue-500/20' : 'bg-slate-800 border-slate-700'}`}>
                                <Clock size={20} className={`shrink-0 mt-0.5 ${isTabActive ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                                <div>
                                    <p className={`text-sm font-bold mb-1 ${isTabActive ? 'text-blue-200' : 'text-slate-400'}`}>{isTabActive ? 'Vui lòng chờ trên trang đích' : 'Quay lại tab để tiếp tục'}</p>
                                    <p className="text-slate-400 text-xs">Hệ thống đang kiểm tra thời gian lưu trú của bạn. Đừng đóng tab Google nhé!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in-up">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-[30px] opacity-40"></div>
                    <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center shadow-2xl relative z-10 animate-bounce">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Tuyệt vời!</h2>
                <p className="text-slate-400 text-sm mb-8">Tiền thưởng đã được cộng vào ví.</p>
                
                <div className="text-center mb-8 bg-slate-800/50 p-8 rounded-3xl border border-slate-700 w-full relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Số tiền nhận được</p>
                    <p className="text-green-400 text-5xl font-extrabold mb-2 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">+${linkData?.reward_amount}</p>
                    <p className="text-slate-400 text-sm font-medium">≈ {(linkData?.reward_amount * EXCHANGE_RATE).toLocaleString('vi-VN')}đ</p>
                </div>
                
                <div className="flex items-center gap-2 text-brand-400 text-sm font-medium bg-brand-500/10 px-4 py-2 rounded-full border border-brand-500/20">
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