// Trong thực tế, các giá trị này nên lấy từ process.env
// Để ứng dụng demo này hoạt động ngay, chúng ta sẽ cho phép người dùng nhập key vào UI
// hoặc sử dụng localStorage để lưu trữ tạm thời.

export const APP_NAME = "MoneyLink Job";
export const ADMIN_EMAIL = "nthd1904@gmail.com"; // Email quyền Admin

// Default credentials provided for the demo
const DEFAULT_SUPABASE_URL = "https://oozmiwzpjdglatjzspgi.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vem1pd3pwamRnbGF0anpzcGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg0MTgsImV4cCI6MjA4NTY3NDQxOH0.JQ4aPbzhj26xdhKf1KF7WZEPHsGyi9EU3gfJ6oUlVxg";

// Helper để lấy Supabase keys từ localStorage nếu env không có
export const getSupabaseConfig = () => {
  const storedUrl = localStorage.getItem('sb_url');
  const storedKey = localStorage.getItem('sb_key');
  
  // Ưu tiên biến môi trường, sau đó đến localStorage, cuối cùng là default hardcoded
  const url = process.env.SUPABASE_URL || storedUrl || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || storedKey || DEFAULT_SUPABASE_KEY;
  
  return { url, key };
};

export const SQL_SETUP_INSTRUCTION = `
-- 1. Kích hoạt extension
create extension if not exists "pgcrypto";

-- 2. Tạo bảng profiles (Thêm cột balance)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  balance decimal(10, 4) default 0.0000, -- Tiền trong ví
  updated_at timestamp with time zone
);

-- 3. Tạo bảng links (Nhiệm vụ)
create table if not exists public.links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_url text not null,
  slug text not null unique,
  views bigint default 0,
  reward_amount decimal(10, 4) default 0.0500, -- Tiền thưởng mặc định
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tạo bảng task_completions (Lưu lịch sử làm nhiệm vụ)
create table if not exists public.task_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  link_id uuid references public.links not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, link_id) -- Mỗi người chỉ làm 1 link 1 lần
);

-- 5. Tạo bảng withdrawals (Lịch sử rút tiền)
create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal(10, 4) not null,
  bank_name text,
  account_number text,
  account_name text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Bật RLS
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.task_completions enable row level security;
alter table public.withdrawals enable row level security;

-- 7. Policies
-- Profiles
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Links
create policy "Links are viewable by everyone" on public.links for select using (true);
create policy "Users can create links" on public.links for insert with check (auth.uid() = user_id);
create policy "Users can manage own links" on public.links for delete using (auth.uid() = user_id);

-- Task Completions
create policy "Users view own completions" on public.task_completions for select using (auth.uid() = user_id);

-- Withdrawals
create policy "Users view own withdrawals" on public.withdrawals for select using (auth.uid() = user_id);
create policy "Users can create withdrawals" on public.withdrawals for insert with check (auth.uid() = user_id);
create policy "Admins can update withdrawals" on public.withdrawals for update using (true);

-- 8. Trigger: Tạo Profile khi đăng ký
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, balance)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 0.0000);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. RPC: Hàm hoàn thành nhiệm vụ và cộng tiền
create or replace function complete_task(link_id uuid)
returns void as $$
declare
  reward decimal;
  user_id uuid;
begin
  user_id := auth.uid();
  
  if exists (select 1 from public.task_completions tc where tc.link_id = complete_task.link_id and tc.user_id = complete_task.user_id) then
    raise exception 'Bạn đã hoàn thành nhiệm vụ này rồi.';
  end if;

  select reward_amount into reward from public.links where id = link_id;
  
  if reward is null then
    raise exception 'Link không tồn tại.';
  end if;

  insert into public.task_completions (user_id, link_id) values (user_id, link_id);
  update public.profiles set balance = balance + reward where id = user_id;
  update public.links set views = views + 1 where id = link_id;
end;
$$ language plpgsql security definer;

-- 10. RPC: Hàm rút tiền (Trừ tiền và tạo yêu cầu)
create or replace function request_withdrawal(amount decimal, bank_name text, account_number text, account_name text)
returns void as $$
declare
  current_balance decimal;
  user_id uuid;
begin
  user_id := auth.uid();
  
  select balance into current_balance from public.profiles where id = user_id;
  
  if current_balance < amount then
    raise exception 'Số dư không đủ.';
  end if;

  -- Trừ tiền
  update public.profiles set balance = balance - amount where id = user_id;

  -- Tạo lệnh rút
  insert into public.withdrawals (user_id, amount, bank_name, account_number, account_name)
  values (user_id, amount, bank_name, account_number, account_name);
end;
$$ language plpgsql security definer;
`;