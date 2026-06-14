-- ============================================================
-- 03_drink_link_update_policy.sql
-- Cho phép người dùng SỬA link nước của chính mình.
-- (Xoá đã có policy "delete own drink link" từ schema.sql)
-- Chạy file này 1 lần trên DB đã tồn tại.
-- ============================================================

drop policy if exists "update own drink link" on public.drink_links;
create policy "update own drink link" on public.drink_links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
