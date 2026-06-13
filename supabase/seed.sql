-- ============================================================
-- LỊCH WORLD CUP 2026 — Seed Data (demo)
-- Chạy SAU schema.sql trong Supabase SQL Editor.
--
-- Lưu ý: đây là dữ liệu demo theo đúng thể thức 48 đội / 12 bảng
-- của World Cup 2026. Bảng đấu & lịch chính xác có thể cập nhật
-- lại bằng SQL hoặc qua API /api/admin/score.
-- Seed tự tính trạng thái trận đấu theo thời điểm chạy (now()):
-- trận quá khứ -> finished + tỉ số ngẫu nhiên, có 2 trận live demo.
-- ============================================================

-- ---------- 48 ĐỘI / 12 BẢNG ----------
insert into public.teams (id, name, flag, group_name, fifa_rank) values
-- Bảng A
('MEX','Mexico','🇲🇽','A',14),('KOR','Hàn Quốc','🇰🇷','A',22),('CIV','Bờ Biển Ngà','🇨🇮','A',40),('DEN','Đan Mạch','🇩🇰','A',21),
-- Bảng B
('CAN','Canada','🇨🇦','B',30),('SUI','Thụy Sĩ','🇨🇭','B',19),('QAT','Qatar','🇶🇦','B',51),('UKR','Ukraine','🇺🇦','B',25),
-- Bảng C
('BRA','Brazil','🇧🇷','C',5),('MAR','Maroc','🇲🇦','C',12),('SCO','Scotland','🏴󠁧󠁢󠁳󠁣󠁴󠁿','C',38),('HAI','Haiti','🇭🇹','C',86),
-- Bảng D
('USA','Mỹ','🇺🇸','D',16),('JPN','Nhật Bản','🇯🇵','D',17),('PAR','Paraguay','🇵🇾','D',43),('ITA','Ý','🇮🇹','D',9),
-- Bảng E
('ARG','Argentina','🇦🇷','E',1),('AUT','Áo','🇦🇹','E',23),('ALG','Algeria','🇩🇿','E',36),('NZL','New Zealand','🇳🇿','E',89),
-- Bảng F
('FRA','Pháp','🇫🇷','F',2),('SEN','Senegal','🇸🇳','F',18),('NOR','Na Uy','🇳🇴','F',33),('JAM','Jamaica','🇯🇲','F',63),
-- Bảng G
('ESP','Tây Ban Nha','🇪🇸','G',3),('URU','Uruguay','🇺🇾','G',15),('EGY','Ai Cập','🇪🇬','G',34),('CPV','Cape Verde','🇨🇻','G',70),
-- Bảng H
('ENG','Anh','🏴󠁧󠁢󠁥󠁮󠁧󠁿','H',4),('CRO','Croatia','🇭🇷','H',10),('TUN','Tunisia','🇹🇳','H',49),('BOL','Bolivia','🇧🇴','H',77),
-- Bảng I
('POR','Bồ Đào Nha','🇵🇹','I',6),('COL','Colombia','🇨🇴','I',13),('UZB','Uzbekistan','🇺🇿','I',57),('GHA','Ghana','🇬🇭','I',73),
-- Bảng J
('GER','Đức','🇩🇪','J',11),('IRN','Iran','🇮🇷','J',20),('PAN','Panama','🇵🇦','J',31),('CUW','Curaçao','🇨🇼','J',82),
-- Bảng K
('NED','Hà Lan','🇳🇱','K',7),('ECU','Ecuador','🇪🇨','K',24),('KSA','Ả Rập Xê Út','🇸🇦','K',60),('TUR','Thổ Nhĩ Kỳ','🇹🇷','K',27),
-- Bảng L
('BEL','Bỉ','🇧🇪','L',8),('AUS','Úc','🇦🇺','L',26),('JOR','Jordan','🇯🇴','L',62),('COD','CHDC Congo','🇨🇩','L',56);

-- ---------- CẦU THỦ (tên + vị trí) ----------
insert into public.players (team_id, name, position, shirt_number) values
-- Argentina
('ARG','Emiliano Martínez','GK',23),('ARG','Nahuel Molina','DF',26),('ARG','Cristian Romero','DF',13),('ARG','Nicolás Otamendi','DF',19),('ARG','Nicolás Tagliafico','DF',3),('ARG','Rodrigo De Paul','MF',7),('ARG','Enzo Fernández','MF',24),('ARG','Alexis Mac Allister','MF',20),('ARG','Lionel Messi','FW',10),('ARG','Julián Álvarez','FW',9),('ARG','Lautaro Martínez','FW',22),
-- Brazil
('BRA','Alisson Becker','GK',1),('BRA','Danilo','DF',2),('BRA','Marquinhos','DF',4),('BRA','Éder Militão','DF',3),('BRA','Gabriel Magalhães','DF',6),('BRA','Casemiro','MF',5),('BRA','Bruno Guimarães','MF',8),('BRA','Lucas Paquetá','MF',7),('BRA','Vinícius Júnior','FW',10),('BRA','Rodrygo','FW',11),('BRA','Raphinha','FW',19),('BRA','Endrick','FW',21),
-- Pháp
('FRA','Mike Maignan','GK',16),('FRA','Jules Koundé','DF',5),('FRA','William Saliba','DF',17),('FRA','Dayot Upamecano','DF',4),('FRA','Theo Hernández','DF',22),('FRA','Aurélien Tchouaméni','MF',8),('FRA','Eduardo Camavinga','MF',6),('FRA','Antoine Griezmann','MF',7),('FRA','Ousmane Dembélé','FW',11),('FRA','Kylian Mbappé','FW',10),('FRA','Marcus Thuram','FW',15),
-- Anh
('ENG','Jordan Pickford','GK',1),('ENG','Trent Alexander-Arnold','DF',2),('ENG','John Stones','DF',5),('ENG','Marc Guéhi','DF',6),('ENG','Reece James','DF',12),('ENG','Declan Rice','MF',4),('ENG','Jude Bellingham','MF',10),('ENG','Phil Foden','MF',11),('ENG','Cole Palmer','MF',7),('ENG','Bukayo Saka','FW',17),('ENG','Harry Kane','FW',9),
-- Tây Ban Nha
('ESP','Unai Simón','GK',23),('ESP','Dani Carvajal','DF',2),('ESP','Robin Le Normand','DF',3),('ESP','Aymeric Laporte','DF',14),('ESP','Marc Cucurella','DF',24),('ESP','Rodri','MF',16),('ESP','Pedri','MF',20),('ESP','Fabián Ruiz','MF',8),('ESP','Lamine Yamal','FW',19),('ESP','Álvaro Morata','FW',7),('ESP','Nico Williams','FW',17),
-- Bồ Đào Nha
('POR','Diogo Costa','GK',22),('POR','João Cancelo','DF',20),('POR','Rúben Dias','DF',4),('POR','António Silva','DF',3),('POR','Nuno Mendes','DF',19),('POR','João Neves','MF',18),('POR','Vitinha','MF',23),('POR','Bruno Fernandes','MF',8),('POR','Bernardo Silva','MF',10),('POR','Cristiano Ronaldo','FW',7),('POR','Rafael Leão','FW',15),
-- Đức
('GER','Marc-André ter Stegen','GK',1),('GER','Joshua Kimmich','DF',6),('GER','Antonio Rüdiger','DF',2),('GER','Jonathan Tah','DF',4),('GER','David Raum','DF',18),('GER','Aleksandar Pavlović','MF',45),('GER','Jamal Musiala','MF',10),('GER','Florian Wirtz','MF',17),('GER','Leroy Sané','FW',19),('GER','Kai Havertz','FW',7),('GER','Niclas Füllkrug','FW',9),
-- Hà Lan
('NED','Bart Verbruggen','GK',1),('NED','Denzel Dumfries','DF',22),('NED','Virgil van Dijk','DF',4),('NED','Nathan Aké','DF',5),('NED','Micky van de Ven','DF',3),('NED','Frenkie de Jong','MF',21),('NED','Tijjani Reijnders','MF',14),('NED','Xavi Simons','MF',7),('NED','Cody Gakpo','FW',11),('NED','Memphis Depay','FW',10),('NED','Donyell Malen','FW',18),
-- Bỉ
('BEL','Thibaut Courtois','GK',1),('BEL','Timothy Castagne','DF',21),('BEL','Wout Faes','DF',3),('BEL','Arthur Theate','DF',5),('BEL','Kevin De Bruyne','MF',7),('BEL','Youri Tielemans','MF',8),('BEL','Amadou Onana','MF',6),('BEL','Jérémy Doku','FW',11),('BEL','Leandro Trossard','FW',9),('BEL','Romelu Lukaku','FW',10),('BEL','Charles De Ketelaere','FW',14),
-- Nhật Bản
('JPN','Zion Suzuki','GK',1),('JPN','Takehiro Tomiyasu','DF',4),('JPN','Ko Itakura','DF',3),('JPN','Hiroki Ito','DF',2),('JPN','Wataru Endo','MF',6),('JPN','Hidemasa Morita','MF',5),('JPN','Daichi Kamada','MF',15),('JPN','Kaoru Mitoma','FW',7),('JPN','Takefusa Kubo','FW',11),('JPN','Ritsu Doan','FW',8),('JPN','Ayase Ueda','FW',9),
-- Hàn Quốc
('KOR','Kim Seung-gyu','GK',1),('KOR','Kim Min-jae','DF',4),('KOR','Kim Young-gwon','DF',19),('KOR','Seol Young-woo','DF',3),('KOR','Hwang In-beom','MF',6),('KOR','Lee Kang-in','MF',18),('KOR','Paik Seung-ho','MF',8),('KOR','Lee Jae-sung','MF',7),('KOR','Son Heung-min','FW',10),('KOR','Hwang Hee-chan','FW',11),('KOR','Cho Gue-sung','FW',9),
-- Mỹ
('USA','Matt Turner','GK',1),('USA','Sergiño Dest','DF',2),('USA','Chris Richards','DF',3),('USA','Tim Ream','DF',13),('USA','Antonee Robinson','DF',5),('USA','Tyler Adams','MF',4),('USA','Weston McKennie','MF',8),('USA','Yunus Musah','MF',6),('USA','Christian Pulisic','FW',10),('USA','Folarin Balogun','FW',20),('USA','Timothy Weah','FW',21),
-- Mexico
('MEX','Luis Malagón','GK',1),('MEX','Jorge Sánchez','DF',19),('MEX','César Montes','DF',3),('MEX','Johan Vásquez','DF',2),('MEX','Jesús Gallardo','DF',23),('MEX','Edson Álvarez','MF',4),('MEX','Luis Chávez','MF',24),('MEX','Orbelín Pineda','MF',10),('MEX','Hirving Lozano','FW',22),('MEX','Santiago Giménez','FW',9),('MEX','Alexis Vega','FW',11),
-- Canada
('CAN','Maxime Crépeau','GK',16),('CAN','Alistair Johnston','DF',2),('CAN','Moïse Bombito','DF',4),('CAN','Derek Cornelius','DF',13),('CAN','Alphonso Davies','DF',19),('CAN','Stephen Eustáquio','MF',7),('CAN','Ismaël Koné','MF',8),('CAN','Jonathan Osorio','MF',21),('CAN','Tajon Buchanan','FW',11),('CAN','Jonathan David','FW',9),('CAN','Cyle Larin','FW',17),
-- Maroc
('MAR','Yassine Bounou','GK',1),('MAR','Achraf Hakimi','DF',2),('MAR','Nayef Aguerd','DF',5),('MAR','Romain Saïss','DF',6),('MAR','Noussair Mazraoui','DF',3),('MAR','Sofyan Amrabat','MF',4),('MAR','Azzedine Ounahi','MF',8),('MAR','Hakim Ziyech','MF',7),('MAR','Brahim Díaz','FW',10),('MAR','Youssef En-Nesyri','FW',19),('MAR','Soufiane Rahimi','FW',9),
-- Na Uy
('NOR','Ørjan Nyland','GK',1),('NOR','Kristoffer Ajer','DF',3),('NOR','Leo Østigård','DF',6),('NOR','David Møller Wolfe','DF',18),('NOR','Sander Berge','MF',8),('NOR','Martin Ødegaard','MF',10),('NOR','Fredrik Aursnes','MF',16),('NOR','Antonio Nusa','FW',21),('NOR','Erling Haaland','FW',9),('NOR','Alexander Sørloth','FW',19),('NOR','Oscar Bobb','FW',11),
-- Croatia
('CRO','Dominik Livaković','GK',1),('CRO','Josip Juranović','DF',22),('CRO','Joško Gvardiol','DF',20),('CRO','Josip Šutalo','DF',5),('CRO','Borna Sosa','DF',19),('CRO','Luka Modrić','MF',10),('CRO','Mateo Kovačić','MF',8),('CRO','Marcelo Brozović','MF',11),('CRO','Lovro Majer','MF',7),('CRO','Andrej Kramarić','FW',9),('CRO','Bruno Petković','FW',16),
-- Uruguay
('URU','Sergio Rochet','GK',1),('URU','Ronald Araújo','DF',4),('URU','José María Giménez','DF',2),('URU','Mathías Olivera','DF',16),('URU','Nahitan Nández','DF',17),('URU','Federico Valverde','MF',15),('URU','Manuel Ugarte','MF',5),('URU','Rodrigo Bentancur','MF',6),('URU','Facundo Pellistri','FW',8),('URU','Darwin Núñez','FW',9),('URU','Maximiliano Araújo','FW',7);

-- ---------- SINH 72 TRẬN VÒNG BẢNG ----------
do $$
declare
  g record;
  t text[];
  gi int := 0;
  base_date date := date '2026-06-11';   -- ngày khai mạc
  md1 date; md2 date; md3 date;
  venues text[] := array[
    'SVĐ Azteca — Mexico City','SoFi Stadium — Los Angeles','MetLife Stadium — New York',
    'AT&T Stadium — Dallas','BC Place — Vancouver','Estadio BBVA — Monterrey',
    'Hard Rock Stadium — Miami','Lumen Field — Seattle','NRG Stadium — Houston',
    'Mercedes-Benz Stadium — Atlanta','Levi''s Stadium — San Francisco','Arrowhead Stadium — Kansas City'
  ];
begin
  for g in
    select group_name, array_agg(id order by fifa_rank) as ids
    from public.teams group by group_name order by group_name
  loop
    t := g.ids;
    md1 := base_date + (gi % 4);
    md2 := md1 + 6;
    md3 := md1 + 12;

    insert into public.matches (stage, group_name, home_team_id, away_team_id, kickoff_at, venue) values
      -- Lượt 1
      ('group', g.group_name, t[1], t[4], (md1 + time '16:00')::timestamp at time zone 'utc', venues[(gi % 12) + 1]),
      ('group', g.group_name, t[2], t[3], (md1 + time '19:00')::timestamp at time zone 'utc', venues[((gi + 5) % 12) + 1]),
      -- Lượt 2
      ('group', g.group_name, t[1], t[3], (md2 + time '16:00')::timestamp at time zone 'utc', venues[((gi + 2) % 12) + 1]),
      ('group', g.group_name, t[4], t[2], (md2 + time '22:00')::timestamp at time zone 'utc', venues[((gi + 7) % 12) + 1]),
      -- Lượt 3 (đá cùng giờ)
      ('group', g.group_name, t[2], t[1], (md3 + time '20:00')::timestamp at time zone 'utc', venues[((gi + 4) % 12) + 1]),
      ('group', g.group_name, t[3], t[4], (md3 + time '20:00')::timestamp at time zone 'utc', venues[((gi + 9) % 12) + 1]);

    gi := gi + 1;
  end loop;
end $$;

-- ---------- VÒNG LOẠI TRỰC TIẾP (placeholder, 32 đội) ----------
do $$
declare
  i int;
  r32_date date := date '2026-06-29';
  labels text[] := array['A','B','C','D','E','F','G','H','I','J','K','L'];
begin
  -- Vòng 1/16 (R32): 16 trận
  for i in 1..16 loop
    insert into public.matches (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
    values ('r32', i,
      case when i <= 12 then 'Nhất bảng ' || labels[i] else 'Nhì bảng ' || labels[i - 12] end,
      case when i <= 12 then 'Ba bảng '   || labels[(i % 12) + 1] else 'Nhì bảng ' || labels[i - 8] end,
      ((r32_date + ((i - 1) / 4))::timestamp + make_interval(hours => 16 + ((i - 1) % 4) * 3)) at time zone 'utc',
      'Vòng 1/16');
  end loop;
  -- Vòng 1/8 (R16): 8 trận
  for i in 1..8 loop
    insert into public.matches (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
    values ('r16', i, 'Thắng trận ' || (72 + i * 2 - 1), 'Thắng trận ' || (72 + i * 2),
      ((date '2026-07-04' + ((i - 1) / 2))::timestamp + make_interval(hours => 17 + ((i - 1) % 2) * 4)) at time zone 'utc',
      'Vòng 1/8');
  end loop;
  -- Tứ kết
  for i in 1..4 loop
    insert into public.matches (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue)
    values ('qf', i, 'Thắng trận ' || (88 + i * 2 - 1), 'Thắng trận ' || (88 + i * 2),
      ((date '2026-07-09' + ((i - 1) / 2))::timestamp + make_interval(hours => 17 + ((i - 1) % 2) * 4)) at time zone 'utc',
      'Tứ kết');
  end loop;
  -- Bán kết
  insert into public.matches (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue) values
    ('sf', 1, 'Thắng TK 1', 'Thắng TK 2', timestamptz '2026-07-14 20:00+00', 'Bán kết — AT&T Stadium, Dallas'),
    ('sf', 2, 'Thắng TK 3', 'Thắng TK 4', timestamptz '2026-07-15 20:00+00', 'Bán kết — Mercedes-Benz, Atlanta');
  -- Tranh hạng 3 & Chung kết
  insert into public.matches (stage, round_slot, home_placeholder, away_placeholder, kickoff_at, venue) values
    ('third', 1, 'Thua BK 1', 'Thua BK 2', timestamptz '2026-07-18 19:00+00', 'Hard Rock Stadium — Miami'),
    ('final', 1, 'Thắng BK 1', 'Thắng BK 2', timestamptz '2026-07-19 19:00+00', 'MetLife Stadium — New York');
end $$;

-- ---------- TRẠNG THÁI & TỈ SỐ THEO THỜI ĐIỂM CHẠY SEED ----------
-- Trận đã qua: kết thúc với tỉ số ngẫu nhiên
update public.matches set
  status = 'finished',
  home_score = floor(random() * 4)::int,
  away_score = floor(random() * 4)::int,
  minute = null
where stage = 'group' and kickoff_at < now() - interval '2 hours';

-- 2 trận gần nhất: chuyển thành ĐANG LIVE để demo
with nearest as (
  select id, row_number() over (order by abs(extract(epoch from (kickoff_at - now())))) as rn
  from public.matches
  where stage = 'group' and status <> 'finished'
)
update public.matches m set
  status = 'live',
  kickoff_at = now() - make_interval(mins => (35 + n.rn * 17)::int),
  minute = (35 + n.rn * 17)::int,
  home_score = n.rn::int,
  away_score = 1
from nearest n
where m.id = n.id and n.rn <= 2;
