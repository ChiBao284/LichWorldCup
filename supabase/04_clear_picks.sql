-- ============================================================
-- 04_clear_picks.sql
-- XÓA SẠCH dữ liệu "Thánh dự đoán" (bảng xếp hạng).
--
-- ⚠️ KHÔNG KHÔI PHỤC ĐƯỢC. Xóa toàn bộ pick của MỌI người
--    (cả trận đang/sắp đá lẫn đã kết thúc).
--    Bảng `leaderboard` là view tính từ `picks` nên sẽ tự rỗng theo.
--    Tài khoản người dùng (profiles) vẫn được giữ.
--
-- Chạy 1 lần trong Supabase → SQL Editor.
-- ============================================================

truncate table public.picks restart identity;

-- Nếu Supabase chặn TRUNCATE, dùng dòng dưới thay thế:
-- delete from public.picks;
