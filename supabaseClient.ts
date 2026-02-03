import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './constants';

const { url, key } = getSupabaseConfig();

// Khởi tạo client. Nếu chưa có key, client sẽ lỗi nhưng ta sẽ xử lý ở UI.
// Sử dụng 'any' để tránh lỗi TS khi url/key rỗng ban đầu.
export const supabase = (url && key) 
  ? createClient(url, key) 
  : null;

export const isSupabaseConfigured = () => {
  return !!supabase;
};
