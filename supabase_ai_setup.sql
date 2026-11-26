-- Chạy file SQL này trong Supabase Dashboard -> SQL Editor (1 lần duy nhất)
-- Để lưu cấu hình Gemini API Key trực tiếp trên Supabase cho tính năng AI Tạo Web

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

-- Cho phép ứng dụng đọc cấu hình AI Key (hoặc bạn có thể dùng Edge Function 'vibe-web' với Secrets để ẩn Key hoàn toàn)
drop policy if exists "Allow read app_settings" on public.app_settings;
create policy "Allow read app_settings"
  on public.app_settings for select
  using (true);

-- Cho phép Admin / người dùng đã đăng nhập cập nhật cấu hình
drop policy if exists "Allow upsert app_settings" on public.app_settings;
create policy "Allow upsert app_settings"
  on public.app_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Ví dụ thêm trực tiếp API Key của bạn vào Supabase:
-- insert into public.app_settings (key, value)
-- values ('gemini_api_key', 'DAN_KEY_GEMINI_CUA_BAN_VAO_DAY')
-- on conflict (key) do update set value = excluded.value, updated_at = now();
