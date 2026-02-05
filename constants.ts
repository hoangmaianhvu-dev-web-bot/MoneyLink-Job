// CẤU HÌNH ỨNG DỤNG
export const APP_NAME = "MoneyLink Job";
export const ADMIN_EMAIL = "nthd1904@gmail.com"; // Nhập email admin của bạn vào đây để hiện menu quản trị
export const EXCHANGE_RATE = 23000; // 1 USD = 23,000 VND
export const REFERRAL_REWARD = 0.0217; // ~500 VND

// ==============================================================================
// CẤU HÌNH SUPABASE
// Cách 1: Nhập trực tiếp (Hardcode) vào 2 dòng dưới đây (Dành cho chạy local hoặc sửa nhanh)
// Cách 2: Cấu hình trong Vercel > Settings > Environment Variables (Khuyên dùng bảo mật)
//         Tên biến: VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
// ==============================================================================
const MANUAL_URL = "https://oozmiwzpjdglatjzspgi.supabase.co"; 
const MANUAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vem1pd3pwamRnbGF0anpzcGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg0MTgsImV4cCI6MjA4NTY3NDQxOH0.JQ4aPbzhj26xdhKf1KF7WZEPHsGyi9EU3gfJ6oUlVxg";

export const getSupabaseConfig = () => {
  // 1. Kiểm tra LocalStorage (Do người dùng nhập qua Modal)
  let localUrl, localKey;
  if (typeof window !== 'undefined') {
      localUrl = localStorage.getItem('sb_url');
      localKey = localStorage.getItem('sb_key');
  }

  // 2. Kiểm tra biến môi trường từ Vercel/System (Hỗ trợ Vite, CRA, Next.js)
  const envUrl = 
    (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) : undefined);
    
  const envKey = 
    (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : undefined);

  // 3. Ưu tiên: LocalStorage > Env > Manual
  const url = localUrl || envUrl || MANUAL_URL;
  const key = localKey || envKey || MANUAL_KEY;
  
  return { url, key };
};

export const SQL_SETUP_INSTRUCTION = `
-- 1. Kích hoạt extension (Bắt buộc cho random uuid)
create extension if not exists "pgcrypto";

-- 2. Tạo bảng profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  balance decimal(10, 4) default 0.0000 check (balance >= 0),
  updated_at timestamp with time zone
);

-- 3. Tạo bảng links (Nhiệm vụ)
create table if not exists public.links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_url text not null,
  slug text not null unique,
  views bigint default 0,
  reward_amount decimal(10, 4) default 0.0500,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tạo bảng task_completions (Lịch sử làm nhiệm vụ)
create table if not exists public.task_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  link_id uuid references public.links not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, link_id)
);

-- 5. Tạo bảng withdrawals (Lịch sử rút tiền)
create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal(10, 4) not null,
  bank_name text,
  account_number text,
  account_name text,
  card_serial text,
  card_code text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tạo bảng referrals (Quản lý giới thiệu)
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id) not null,
  referred_user_id uuid references public.profiles(id) not null unique,
  status text default 'pending', -- 'pending', 'approved'
  reward_amount decimal(10, 4) default 0.0217,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Bật RLS
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.task_completions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.referrals enable row level security;

-- 8. Policies
create policy "Public profiles" on public.profiles for select using (true);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Public links" on public.links for select using (true);
create policy "Create links" on public.links for insert with check (auth.uid() = user_id);

create policy "View own completions" on public.task_completions for select using (auth.uid() = user_id);

create policy "View own withdrawals" on public.withdrawals for select using (auth.uid() = user_id);
create policy "Create withdrawals" on public.withdrawals for insert with check (auth.uid() = user_id);

create policy "View referrals" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

-- 9. Trigger: Tạo Profile & Ghi nhận Referral
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ref_id uuid;
begin
  insert into public.profiles (id, email, full_name, balance)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 0.0000);

  ref_id := (new.raw_user_meta_data->>'referrer_id')::uuid;
  
  if ref_id is not null and exists (select 1 from public.profiles where id = ref_id) then
      insert into public.referrals (referrer_id, referred_user_id, status, reward_amount)
      values (ref_id, new.id, 'pending', 0.0217);
  end if;

  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. RPC: Hoàn thành nhiệm vụ
create or replace function complete_task(link_id uuid)
returns void as $$
declare
  reward decimal;
  user_id uuid;
  ref_record record;
begin
  user_id := auth.uid();
  
  if exists (select 1 from public.task_completions tc where tc.link_id = complete_task.link_id and tc.user_id = complete_task.user_id) then
    raise exception 'Bạn đã hoàn thành nhiệm vụ này rồi.';
  end if;

  select reward_amount into reward from public.links where id = link_id;
  if reward is null then raise exception 'Link không tồn tại.'; end if;

  -- Cộng tiền user
  insert into public.task_completions (user_id, link_id) values (user_id, link_id);
  update public.profiles set balance = balance + reward where id = user_id;
  update public.links set views = views + 1 where id = link_id;

  -- Trả thưởng Referral (chỉ lần đầu)
  select * into ref_record from public.referrals 
  where referred_user_id = user_id and status = 'pending'
  limit 1;

  if found then
      update public.referrals set status = 'approved' where id = ref_record.id;
      update public.profiles set balance = balance + ref_record.reward_amount where id = ref_record.referrer_id;
  end if;
end;
$$ language plpgsql security definer;

-- 11. RPC: Rút tiền
create or replace function request_withdrawal(amount decimal, bank_name text, account_number text, account_name text)
returns void as $$
declare
  current_balance decimal;
  user_id uuid;
begin
  user_id := auth.uid();
  select balance into current_balance from public.profiles where id = user_id;
  
  if current_balance < amount then raise exception 'Số dư không đủ.'; end if;

  update public.profiles set balance = balance - amount where id = user_id;

  insert into public.withdrawals (user_id, amount, bank_name, account_number, account_name)
  values (user_id, amount, bank_name, account_number, account_name);
end;
$$ language plpgsql security definer;
`;