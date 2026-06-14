-- ============================================================
-- Migration: chuyển sang dữ liệu THẬT từ worldcup.json (qua /api/sync)
-- Chạy MỘT LẦN trong Supabase SQL Editor (sau schema.sql).
-- ============================================================

-- 1) Thêm cột phục vụ đồng bộ (an toàn nếu đã có)
alter table public.matches add column if not exists ext_id text;
create unique index if not exists matches_ext_id_key on public.matches (ext_id);
alter table public.matches add column if not exists home_goals jsonb;
alter table public.matches add column if not exists away_goals jsonb;

-- 2) Xoá dữ liệu seed cũ (đội + trận giả) để /api/sync nạp dữ liệu thật.
--    (picks / drink_links tham chiếu sẽ bị xoá theo — đây chỉ là dữ liệu test.)
delete from public.matches;
delete from public.players;   -- cầu thủ giờ đọc trực tiếp từ app/data/worldcup.squads.json
delete from public.teams;

-- 3) Sau khi chạy xong: gọi GET/POST tới /api/sync (hoặc mở web — LiveSync tự gọi)
--    để nạp 48 đội + 104 trận thật. Cần có SUPABASE_SERVICE_ROLE_KEY trong env.
