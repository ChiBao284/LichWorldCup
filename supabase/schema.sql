-- ============================================================
-- LỊCH WORLD CUP 2026 — Database Schema
-- Chạy file này trong Supabase SQL Editor (trước seed.sql)
-- ============================================================

-- ---------- TEAMS ----------
create table public.teams (
  id text primary key,              -- mã FIFA, vd: 'ARG'
  name text not null,               -- tên tiếng Việt
  flag text not null,               -- emoji cờ
  group_name text not null,         -- bảng 'A'..'L'
  fifa_rank int
);

-- ---------- PLAYERS ----------
create table public.players (
  id bigint generated always as identity primary key,
  team_id text not null references public.teams(id) on delete cascade,
  name text not null,
  position text not null check (position in ('GK','DF','MF','FW')),
  shirt_number int
);
create index players_team_idx on public.players(team_id);

-- ---------- MATCHES ----------
create table public.matches (
  id bigint generated always as identity primary key,
  stage text not null check (stage in ('group','r32','r16','qf','sf','third','final')),
  group_name text,                  -- chỉ dùng cho vòng bảng
  round_slot int,                   -- vị trí trong nhánh đấu (1..n theo từng vòng)
  home_team_id text references public.teams(id),
  away_team_id text references public.teams(id),
  home_placeholder text,            -- vd: 'Nhất bảng A' khi chưa xác định đội
  away_placeholder text,
  kickoff_at timestamptz not null,
  venue text,
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  home_score int not null default 0,
  away_score int not null default 0,
  minute int,                       -- phút thi đấu khi đang live
  ext_id text unique,               -- khoá ổn định để /api/sync upsert (worldcup.json)
  home_goals jsonb,                 -- diễn biến bàn thắng đội nhà
  away_goals jsonb                  -- diễn biến bàn thắng đội khách
);
create index matches_kickoff_idx on public.matches(kickoff_at);
create index matches_status_idx on public.matches(status);

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar text not null default '🙂',
  created_at timestamptz not null default now()
);

-- Tự tạo profile "ẩn danh" (kiểu Google Docs) khi user đăng nhập lần đầu
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  animals text[] := array['Cáo','Gấu trúc','Hổ','Sư tử','Ếch','Bạch tuộc','Kỳ lân','Cánh cụt','Koala','Thỏ','Khủng long','Cú mèo','Cá voi','Rùa','Mèo','Bướm'];
  emojis  text[] := array['🦊','🐼','🐯','🦁','🐸','🐙','🦄','🐧','🐨','🐰','🦖','🦉','🐳','🐢','🐱','🦋'];
  i int := 1 + floor(random() * 16)::int;
  -- Lấy tên + ảnh từ tài khoản Google (nếu đăng nhập bằng Gmail)
  g_name text := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', '')
  );
  g_avatar text := coalesce(
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'picture', '')
  );
begin
  -- Mặc định = tên & ảnh Google; nếu không có thì rơi về "ẩn danh" ngẫu nhiên
  insert into public.profiles (id, username, avatar)
  values (
    new.id,
    coalesce(g_name, animals[i] || ' ẩn danh'),
    coalesce(g_avatar, emojis[i])
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- PICKS (chọn đội yêu thích cho từng trận) ----------
create table public.picks (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id text not null references public.teams(id),
  created_at timestamptz not null default now(),
  unique (match_id, user_id)
);
create index picks_match_idx on public.picks(match_id);

-- ---------- DRINK LINKS (đội thua nhập link nước) ----------
create table public.drink_links (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  note text,
  qr_url text,                      -- ảnh QR chuyển khoản (tuỳ chọn), ở bucket 'drink-qr'
  created_at timestamptz not null default now()
);
create index drink_links_match_idx on public.drink_links(match_id);

-- ---------- DRINK ORDERS (người khác vào đặt nước) ----------
create table public.drink_orders (
  id bigint generated always as identity primary key,
  link_id bigint not null references public.drink_links(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item text not null,
  created_at timestamptz not null default now()
);
create index drink_orders_link_idx on public.drink_orders(link_id);

-- ---------- LEADERBOARD VIEW ----------
-- Tỉ lệ chọn đúng đội thắng (chỉ tính các trận đã kết thúc, hòa = không đúng)
create or replace view public.leaderboard
with (security_invoker = on) as
select
  pr.id as user_id,
  pr.username,
  pr.avatar,
  count(pk.id) as total_picks,
  count(pk.id) filter (where
    (m.home_score > m.away_score and pk.team_id = m.home_team_id) or
    (m.away_score > m.home_score and pk.team_id = m.away_team_id)
  ) as correct_picks,
  round(
    100.0 * count(pk.id) filter (where
      (m.home_score > m.away_score and pk.team_id = m.home_team_id) or
      (m.away_score > m.home_score and pk.team_id = m.away_team_id)
    ) / nullif(count(pk.id), 0), 1
  ) as win_rate
from public.profiles pr
join public.picks pk on pk.user_id = pr.id
join public.matches m on m.id = pk.match_id and m.status = 'finished'
group by pr.id, pr.username, pr.avatar;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.profiles enable row level security;
alter table public.picks enable row level security;
alter table public.drink_links enable row level security;
alter table public.drink_orders enable row level security;

-- Dữ liệu công khai: ai cũng đọc được
create policy "public read teams"    on public.teams    for select using (true);
create policy "public read players"  on public.players  for select using (true);
create policy "public read matches"  on public.matches  for select using (true);
create policy "public read profiles" on public.profiles for select using (true);
create policy "public read picks"    on public.picks    for select using (true);
create policy "public read drinks"   on public.drink_links  for select using (true);
create policy "public read orders"   on public.drink_orders for select using (true);

-- Người dùng chỉ sửa dữ liệu của mình
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "insert own pick" on public.picks
  for insert with check (auth.uid() = user_id);
create policy "update own pick" on public.picks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own pick" on public.picks
  for delete using (auth.uid() = user_id);

create policy "insert own drink link" on public.drink_links
  for insert with check (auth.uid() = user_id);
drop policy if exists "update own drink link" on public.drink_links;
create policy "update own drink link" on public.drink_links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own drink link" on public.drink_links
  for delete using (auth.uid() = user_id);

create policy "insert own order" on public.drink_orders
  for insert with check (auth.uid() = user_id);
create policy "delete own order" on public.drink_orders
  for delete using (auth.uid() = user_id);

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.picks;
alter publication supabase_realtime add table public.drink_links;
alter publication supabase_realtime add table public.drink_orders;

-- ---------- STORAGE: ẢNH QR LINK NƯỚC ----------
-- Bucket công khai chứa ảnh QR chuyển khoản đính kèm link nước.
-- Đường dẫn file: {user_id}/{uuid}.png → chủ sở hữu mới được ghi/sửa/xoá.
insert into storage.buckets (id, name, public)
values ('drink-qr', 'drink-qr', true)
on conflict (id) do nothing;

create policy "drink-qr public read" on storage.objects
  for select using (bucket_id = 'drink-qr');

create policy "drink-qr owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'drink-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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

create policy "drink-qr owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'drink-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
