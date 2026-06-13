# ⚽ Lịch World Cup 2026

Web lịch thi đấu World Cup 2026 cho team chơi cùng nhau: live score realtime,
pick đội yêu thích, bảng xếp hạng thánh dự đoán, và luật vui **thua là mua nước** 🧋

**Stack:** Next.js (App Router) · Tailwind CSS v4 · Motion (Framer Motion) · Supabase (Auth + Postgres + Realtime) · Vercel

## Tính năng

- 🔴 **Live score** — trận đang diễn ra highlight ở trang chủ, tỉ số cập nhật realtime (Supabase Realtime)
- 📅 **Lịch thi đấu** — lọc theo trạng thái (live / sắp tới / kết quả), bảng đấu, tìm theo đội; lưu lại toàn bộ kết quả các trận đã đá
- 🏆 **Nhánh đấu knockout** — UI bracket từ vòng 1/16 đến Chung kết
- 🌍 **48 đội tuyển** — danh sách cầu thủ (tên + vị trí) từng đội
- 🔐 **Đăng nhập Google** — tự đặt username + chọn avatar cartoon; chưa chọn thì được gán "🦊 Cáo ẩn danh" kiểu Google Docs
- 🎯 **Pick đội** — chọn đội yêu thích cho trận hiện tại, avatar mọi người hiện realtime dạng vòng tròn (tối đa 10, còn lại "+N"), kèm % chọn mỗi đội
- 🔮 **BXH thánh dự đoán** — xếp hạng theo tỉ lệ pick trúng đội thắng
- 🧋 **Góc đền nước** — ai pick đội thua nhập link quán nước, người khác vào đặt món (realtime)
- ✨ Trang chủ nhiều animation: parallax scroll, marquee cờ 48 đội, counter, reveal khi scroll...

## 1. Thiết lập Supabase

1. Tạo project tại [supabase.com](https://supabase.com).
2. Mở **SQL Editor**, chạy lần lượt:
   - [`supabase/schema.sql`](supabase/schema.sql) — bảng, RLS, trigger, realtime
   - [`supabase/seed.sql`](supabase/seed.sql) — 48 đội, cầu thủ, 104 trận (tự tính trận nào đã đá/đang live theo thời điểm chạy)
3. Bật đăng nhập Google: **Authentication → Providers → Google**
   - Tạo OAuth Client tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (loại Web).
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Dán Client ID + Secret vào Supabase.
4. Thêm domain vào **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (sau này đổi thành domain Vercel)
   - Redirect URLs: thêm cả `http://localhost:3000/**` và `https://<app>.vercel.app/**`

> Dữ liệu seed là demo theo đúng thể thức 48 đội/12 bảng. Muốn sửa bảng đấu,
> lịch, đội hình... chỉnh trực tiếp trong Supabase Table Editor.

## 2. Chạy local

```bash
cp .env.example .env.local   # điền URL + anon key từ Supabase
npm install
npm run dev
```

Mở http://localhost:3000 🎉

## 3. Deploy lên Vercel

```bash
npm i -g vercel
vercel
```

Thêm các biến môi trường trong Vercel (Settings → Environment Variables):

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ⛔ chỉ server | Cho API admin cập nhật tỉ số |
| `ADMIN_SECRET` | ⛔ chỉ server | Mật khẩu gọi API admin |

Sau khi deploy, nhớ cập nhật Site URL/Redirect URLs trong Supabase thành domain Vercel.

## 4. Cập nhật tỉ số live

Tỉ số đổi trong database là mọi client thấy ngay (Realtime). Hai cách:

**Cách 1 — Supabase Table Editor:** sửa trực tiếp `home_score`, `away_score`, `status` (`scheduled` → `live` → `finished`), `minute`.

**Cách 2 — API admin:**

```bash
curl -X POST https://<domain>/api/admin/score \
  -H "x-admin-secret: $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{"match_id": 1, "home_score": 2, "away_score": 1, "status": "live", "minute": 67}'
```

Khi trận knockout xác định được 2 đội, cập nhật `home_team_id`/`away_team_id`
của trận đó trong bảng `matches` là bracket tự hiện tên đội.

## Cấu trúc chính

```
app/
  page.tsx              # Trang chủ (hero animation + live + BXH)
  schedule/             # Lịch thi đấu
  matches/[id]/         # Chi tiết trận: pick đội + góc đền nước
  bracket/              # Nhánh đấu knockout
  teams/, teams/[id]/   # 48 đội + cầu thủ
  leaderboard/          # BXH thánh dự đoán
  profile/              # Đổi tên + avatar
  api/admin/score/      # API cập nhật tỉ số
components/             # PickPanel, DrinkSection, BracketView, ...
lib/                    # Supabase clients, types, avatars, format
supabase/               # schema.sql + seed.sql
```
