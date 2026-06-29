-- ============================================================
-- 06 — Cập nhật nhánh đấu R32 theo thiết kế
-- Chạy trong Supabase SQL Editor.
-- ⚠ Sẽ xoá và tạo lại toàn bộ trận knockout (r32 → final).
--   Picks liên quan bị cascade-delete theo.
-- ============================================================

-- ── Bổ sung đội còn thiếu trong DB ──────────────────────────
insert into public.teams (id, name, flag, group_name, fifa_rank) values
  ('SWE', 'Thụy Điển', '🇸🇪', 'M', 35),
  ('RSA', 'Nam Phi',   '🇿🇦', 'M', 55),
  ('BIH', 'Bosnia',    '🇧🇦', 'M', 65)
on conflict (id) do nothing;

-- ── Xoá toàn bộ trận knockout cũ ────────────────────────────
delete from public.matches
where stage in ('r32','r16','qf','sf','third','final');

-- ── Vòng 1/16 — 16 trận ────────────────────────────────────
-- slot  1–8  : cánh trái  (BracketView r32.slice(0,8))
-- slot  9–16 : cánh phải  (BracketView r32.slice(8,16))
insert into public.matches
  (stage, round_slot, home_team_id, away_team_id, kickoff_at, venue)
values
  -- ── Cánh trái ──
  ('r32',  1, 'GER', 'PAR', '2026-06-29 16:00+00', 'MetLife Stadium — New York/New Jersey'),
  ('r32',  2, 'FRA', 'SWE', '2026-06-29 19:00+00', 'AT&T Stadium — Dallas'),
  ('r32',  3, 'RSA', 'CAN', '2026-06-30 16:00+00', 'BC Place — Vancouver'),
  ('r32',  4, 'NED', 'MAR', '2026-06-30 19:00+00', 'SoFi Stadium — Los Angeles'),
  ('r32',  5, 'POR', 'CRO', '2026-07-01 16:00+00', 'Hard Rock Stadium — Miami'),
  ('r32',  6, 'ESP', 'AUT', '2026-07-01 19:00+00', 'Mercedes-Benz Stadium — Atlanta'),
  ('r32',  7, 'USA', 'BIH', '2026-07-02 16:00+00', 'Lumen Field — Seattle'),
  ('r32',  8, 'BEL', 'SEN', '2026-07-02 19:00+00', 'NRG Stadium — Houston'),
  -- ── Cánh phải ──
  ('r32',  9, 'BRA', 'JPN', '2026-06-29 22:00+00', 'SVĐ Azteca — Mexico City'),
  ('r32', 10, 'CIV', 'NOR', '2026-06-30 22:00+00', 'Estadio BBVA — Monterrey'),
  ('r32', 11, 'MEX', 'ECU', '2026-07-01 22:00+00', 'Arrowhead Stadium — Kansas City'),
  ('r32', 12, 'ENG', 'COD', '2026-07-02 22:00+00', 'Levi''s Stadium — San Francisco'),
  ('r32', 13, 'ARG', 'CPV', '2026-07-03 16:00+00', 'AT&T Stadium — Dallas'),
  ('r32', 14, 'EGY', 'AUS', '2026-07-03 19:00+00', 'SoFi Stadium — Los Angeles'),
  ('r32', 15, 'SUI', 'ALG', '2026-07-04 16:00+00', 'Hard Rock Stadium — Miami'),
  ('r32', 16, 'COL', 'GHA', '2026-07-04 19:00+00', 'MetLife Stadium — New York/New Jersey');

-- ── Vòng 1/8 — placeholder ──────────────────────────────────
-- slot 1–4: cánh trái / slot 5–8: cánh phải
-- Connectors tự vẽ đường nối (slot 1+2 → r16-1, slot 3+4 → r16-2, …)
insert into public.matches
  (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
values
  ('r16', 1, 'Thắng trận 1',  'Thắng trận 2',  '2026-07-07 20:00+00', 'Vòng 1/8'),
  ('r16', 2, 'Thắng trận 3',  'Thắng trận 4',  '2026-07-07 23:00+00', 'Vòng 1/8'),
  ('r16', 3, 'Thắng trận 5',  'Thắng trận 6',  '2026-07-08 20:00+00', 'Vòng 1/8'),
  ('r16', 4, 'Thắng trận 7',  'Thắng trận 8',  '2026-07-08 23:00+00', 'Vòng 1/8'),
  ('r16', 5, 'Thắng trận 9',  'Thắng trận 10', '2026-07-09 20:00+00', 'Vòng 1/8'),
  ('r16', 6, 'Thắng trận 11', 'Thắng trận 12', '2026-07-09 23:00+00', 'Vòng 1/8'),
  ('r16', 7, 'Thắng trận 13', 'Thắng trận 14', '2026-07-10 20:00+00', 'Vòng 1/8'),
  ('r16', 8, 'Thắng trận 15', 'Thắng trận 16', '2026-07-10 23:00+00', 'Vòng 1/8');

-- ── Tứ kết ──────────────────────────────────────────────────
-- slot 1–2: cánh trái / slot 3–4: cánh phải
insert into public.matches
  (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
values
  ('qf', 1, 'Thắng 1/8 trận 1', 'Thắng 1/8 trận 2', '2026-07-11 20:00+00', 'Tứ kết'),
  ('qf', 2, 'Thắng 1/8 trận 3', 'Thắng 1/8 trận 4', '2026-07-12 20:00+00', 'Tứ kết'),
  ('qf', 3, 'Thắng 1/8 trận 5', 'Thắng 1/8 trận 6', '2026-07-11 23:00+00', 'Tứ kết'),
  ('qf', 4, 'Thắng 1/8 trận 7', 'Thắng 1/8 trận 8', '2026-07-12 23:00+00', 'Tứ kết');

-- ── Bán kết ─────────────────────────────────────────────────
insert into public.matches
  (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
values
  ('sf', 1, 'Thắng TK 1', 'Thắng TK 2', '2026-07-14 20:00+00', 'Bán kết — AT&T Stadium, Dallas'),
  ('sf', 2, 'Thắng TK 3', 'Thắng TK 4', '2026-07-15 20:00+00', 'Bán kết — Mercedes-Benz, Atlanta');

-- ── Tranh hạng 3 & Chung kết ────────────────────────────────
insert into public.matches
  (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
values
  ('third', 1, 'Thua BK 1', 'Thua BK 2', '2026-07-18 19:00+00', 'Hard Rock Stadium — Miami'),
  ('final', 1, 'Thắng BK 1', 'Thắng BK 2', '2026-07-19 19:00+00', 'MetLife Stadium — New York/New Jersey');
