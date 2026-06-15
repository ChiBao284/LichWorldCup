-- ============================================================
-- 05_drink_link_qr.sql
-- Cho phép người gắn link nước đính kèm ảnh QR (vd QR chuyển khoản)
-- để người khác quét trả tiền nước.
-- Thêm cột qr_url + bucket Storage 'drink-qr' + policy.
-- Chạy file này 1 lần trên DB đã tồn tại.
-- ============================================================

-- 1) Cột lưu public URL của ảnh QR (nullable — không bắt buộc)
alter table public.drink_links
  add column if not exists qr_url text;

-- 2) Bucket Storage công khai chứa ảnh QR
insert into storage.buckets (id, name, public)
values ('drink-qr', 'drink-qr', true)
on conflict (id) do nothing;

-- 3) RLS cho object trong bucket.
--    Đường dẫn file: {user_id}/{uuid}.png → chủ sở hữu mới được ghi/sửa/xoá.

-- Ai cũng xem được (bucket công khai)
drop policy if exists "drink-qr public read" on storage.objects;
create policy "drink-qr public read" on storage.objects
  for select using (bucket_id = 'drink-qr');

-- Người đăng nhập tải lên trong thư mục mang user id của mình
drop policy if exists "drink-qr owner insert" on storage.objects;
create policy "drink-qr owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'drink-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Chủ sở hữu cập nhật ảnh của mình
drop policy if exists "drink-qr owner update" on storage.objects;
create policy "drink-qr owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'drink-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'drink-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Chủ sở hữu xoá ảnh của mình
drop policy if exists "drink-qr owner delete" on storage.objects;
create policy "drink-qr owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'drink-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
