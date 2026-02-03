import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { getSupabaseConfig } from '../constants';

export const SupabaseConfigModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [needsConfig, setNeedsConfig] = useState(false);

  useEffect(() => {
    // Populate with current config (defaults or stored)
    const { url: configUrl, key: configKey } = getSupabaseConfig();
    
    setUrl(configUrl);
    setKey(configKey);

    // If absolutely no config exists, force open
    if (!configUrl || !configKey) {
      setNeedsConfig(true);
      setIsOpen(true);
    }

    // Listen for custom event to open modal settings
    const handleOpenSettings = () => setIsOpen(true);
    window.addEventListener('open-supabase-config', handleOpenSettings);

    return () => {
      window.removeEventListener('open-supabase-config', handleOpenSettings);
    };
  }, []);

  const handleSave = () => {
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
    window.location.reload(); // Reload to re-init supabase client
  };

  const handleReset = () => {
    localStorage.removeItem('sb_url');
    localStorage.removeItem('sb_key');
    window.location.reload();
  };

  if (!isOpen && !needsConfig) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-brand-500">
          <Settings size={28} />
          <h2 className="text-xl font-bold text-white">Cấu hình Supabase</h2>
        </div>
        
        <p className="text-slate-400 text-sm mb-6">
          Quản lý kết nối đến Supabase Project. Nếu để trống, hệ thống sẽ sử dụng kết nối mặc định.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Project URL</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Anon Public Key</label>
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <button 
             onClick={handleReset}
             className="px-4 py-2 text-xs text-slate-500 hover:text-red-400 underline"
             title="Xóa cấu hình cá nhân và dùng mặc định"
           >
             Reset về mặc định
           </button>
           
           <div className="flex gap-2">
            {!needsConfig && (
               <button 
               onClick={() => setIsOpen(false)}
               className="px-4 py-2 text-slate-400 hover:text-white"
             >
               Đóng
             </button>
            )}
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Save size={18} /> Lưu
            </button>
           </div>
        </div>
      </div>
    </div>
  );
};