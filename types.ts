export interface LinkItem {
  id: string;
  user_id: string;
  original_url: string;
  slug: string;
  views: number;
  reward_amount: number; // Số tiền nhận được khi vượt link
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  balance: number; // Số dư tài khoản
  created_at?: string;
}

export interface AuthState {
  session: any | null;
  user: any | null;
  loading: boolean;
}

export interface Withdrawal {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface HistoryItem {
  id: string;
  type: 'income' | 'withdraw';
  amount: number;
  description: string;
  status: string;
  date: string;
}