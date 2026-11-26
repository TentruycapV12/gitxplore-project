-- Chạy file SQL này trong Supabase Dashboard -> SQL Editor (1 lần duy nhất)
-- Tạo bảng app_settings để lưu Gemini API Key trên Supabase dùng chung cho toàn bộ website

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

-- Cho phép ứng dụng đọc cấu hình Gemini Key từ bảng app_settings
drop policy if exists "Allow read app_settings" on public.app_settings;
create policy "Allow read app_settings"
  on public.app_settings for select
  using (true);

-- Cho phép lưu/cập nhật cấu hình từ Admin Console & Sandbox trên web
drop policy if exists "Allow upsert app_settings" on public.app_settings;
create policy "Allow upsert app_settings"
  on public.app_settings for all
  using (true)
  with check (true);
