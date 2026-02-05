import React from 'react';
import { Zap } from 'lucide-react';
import { APP_NAME } from '../constants';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F19] text-white">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-brand-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
       </div>

       <div className="relative flex flex-col items-center animate-fade-in z-10">
           {/* Logo Container */}
           <div className="relative w-20 h-20 mb-8 group">
               {/* Outer Glow */}
               <div className="absolute inset-0 bg-brand-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
               
               {/* Main Logo Box */}
               <div className="relative w-full h-full bg-gradient-to-br from-brand-600 to-brand-500 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border border-brand-400/20">
                   {/* Shimmer Effect */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                   
                   <Zap size={40} className="text-white drop-shadow-md" fill="currentColor" />
               </div>
           </div>

           {/* Brand Name */}
           <h1 className="text-3xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-100 to-slate-400">
               {APP_NAME}
           </h1>
           
           <p className="text-brand-200/50 text-xs font-medium tracking-[0.2em] uppercase mb-10">
               Loading System...
           </p>

           {/* Loading Bar */}
           <div className="w-48 h-1.5 bg-slate-800/50 rounded-full overflow-hidden relative border border-slate-700/50 backdrop-blur-sm">
               <div className="absolute top-0 bottom-0 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full animate-loading-bar shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
           </div>
       </div>
    </div>
  );
};

export default LoadingScreen;