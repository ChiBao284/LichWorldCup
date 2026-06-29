-- ============================================================
-- 07 — Dọn dẹp nhánh đấu: xoá duplicate + gán đúng round_slot
--
-- Nguyên nhân lỗi: 06_fix_bracket.sql chèn match không có ext_id.
-- Khi /api/sync chạy lại, nó upsert by ext_id → match thật tồn tại
-- song song với match thủ công → cặp đấu hiện 2 lần trên bracket.
--
-- Cách fix:
--   1) Xoá toàn bộ match knockout KHÔNG có ext_id (do tay chèn vào).
--   2) Gán lại round_slot cho 16 trận R32 thật theo đúng vị trí ảnh:
--      slot 1-8  → cánh trái  (BracketView r32.slice(0,8))
--      slot 9-16 → cánh phải (BracketView r32.slice(8,16))
-- ============================================================

-- ── Bước 1: xoá match thủ công (không có ext_id) ────────────
delete from public.matches
where stage in ('r32','r16','qf','sf','third','final')
  and ext_id is null;

-- ── Bước 2: gán round_slot đúng cho R32 ─────────────────────
-- Dùng cả hai chiều home/away đề phòng worldcup.json đảo thứ tự.

-- ─── Cánh trái (slot 1–8) ───────────────────────────────────
update public.matches set round_slot = 1  where stage = 'r32'
  and ((home_team_id = 'GER' and away_team_id = 'PAR') or (home_team_id = 'PAR' and away_team_id = 'GER'));

update public.matches set round_slot = 2  where stage = 'r32'
  and ((home_team_id = 'FRA' and away_team_id = 'SWE') or (home_team_id = 'SWE' and away_team_id = 'FRA'));

update public.matches set round_slot = 3  where stage = 'r32'
  and ((home_team_id = 'RSA' and away_team_id = 'CAN') or (home_team_id = 'CAN' and away_team_id = 'RSA'));

update public.matches set round_slot = 4  where stage = 'r32'
  and ((home_team_id = 'NED' and away_team_id = 'MAR') or (home_team_id = 'MAR' and away_team_id = 'NED'));

update public.matches set round_slot = 5  where stage = 'r32'
  and ((home_team_id = 'POR' and away_team_id = 'CRO') or (home_team_id = 'CRO' and away_team_id = 'POR'));

update public.matches set round_slot = 6  where stage = 'r32'
  and ((home_team_id = 'ESP' and away_team_id = 'AUT') or (home_team_id = 'AUT' and away_team_id = 'ESP'));

update public.matches set round_slot = 7  where stage = 'r32'
  and ((home_team_id = 'USA' and away_team_id = 'BIH') or (home_team_id = 'BIH' and away_team_id = 'USA'));

update public.matches set round_slot = 8  where stage = 'r32'
  and ((home_team_id = 'BEL' and away_team_id = 'SEN') or (home_team_id = 'SEN' and away_team_id = 'BEL'));

-- ─── Cánh phải (slot 9–16) ──────────────────────────────────
update public.matches set round_slot = 9  where stage = 'r32'
  and ((home_team_id = 'BRA' and away_team_id = 'JPN') or (home_team_id = 'JPN' and away_team_id = 'BRA'));

update public.matches set round_slot = 10 where stage = 'r32'
  and ((home_team_id = 'CIV' and away_team_id = 'NOR') or (home_team_id = 'NOR' and away_team_id = 'CIV'));

update public.matches set round_slot = 11 where stage = 'r32'
  and ((home_team_id = 'MEX' and away_team_id = 'ECU') or (home_team_id = 'ECU' and away_team_id = 'MEX'));

update public.matches set round_slot = 12 where stage = 'r32'
  and ((home_team_id = 'ENG' and away_team_id = 'COD') or (home_team_id = 'COD' and away_team_id = 'ENG'));

update public.matches set round_slot = 13 where stage = 'r32'
  and ((home_team_id = 'ARG' and away_team_id = 'CPV') or (home_team_id = 'CPV' and away_team_id = 'ARG'));

update public.matches set round_slot = 14 where stage = 'r32'
  and ((home_team_id = 'EGY' and away_team_id = 'AUS') or (home_team_id = 'AUS' and away_team_id = 'EGY'));

update public.matches set round_slot = 15 where stage = 'r32'
  and ((home_team_id = 'SUI' and away_team_id = 'ALG') or (home_team_id = 'ALG' and away_team_id = 'SUI'));

update public.matches set round_slot = 16 where stage = 'r32'
  and ((home_team_id = 'COL' and away_team_id = 'GHA') or (home_team_id = 'GHA' and away_team_id = 'COL'));
