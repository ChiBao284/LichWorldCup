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
   - [`supabase/02_worldcup_live.sql`](supabase/02_worldcup_live.sql) — thêm cột đồng bộ + xoá seed giả (DB sẽ được nạp dữ liệu THẬT qua `/api/sync`)
   - [`supabase/05_drink_link_qr.sql`](supabase/05_drink_link_qr.sql) — cột `qr_url` + bucket Storage `drink-qr` để gắn ảnh QR chuyển khoản vào link nước (schema.sql mới đã có sẵn; chạy file này nếu DB tạo từ trước)
   - (không cần `seed.sql` nữa — lịch/đội/tỉ số lấy thật từ `worldcup.json`; cầu thủ đọc từ [`app/data/worldcup.squads.json`](app/data/worldcup.squads.json))
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

## 4. Dữ liệu thật & cập nhật live (worldcup.json)

Lịch thi đấu + tỉ số + diễn biến bàn thắng được lấy THẬT từ
`https://raw.githubusercontent.com/upbound-web/worldcup-live.json/master/2026/worldcup.json`.

- **Route `/api/sync`** ([app/api/sync/route.ts](app/api/sync/route.ts)) tải file đó về, ánh xạ
  (tên đội Anh → mã FIFA + cờ, round → vòng, parse giờ kèm offset UTC, suy ra trạng thái
  live/finished, lưu `goals1/goals2`) rồi **upsert** vào bảng `teams` + `matches` (khoá `ext_id`).
  Picks / đặt nước / BXH vẫn chạy trên các bảng này như cũ — **không vỡ**.
- **Tự gọi mỗi 90s**: [components/LiveSync.tsx](components/LiveSync.tsx) gọi `/api/sync` khi mở app
  và lặp lại mỗi 90 giây. DB cập nhật → mọi client đang mở thấy ngay nhờ Supabase Realtime.
- **Cần** `SUPABASE_SERVICE_ROLE_KEY` trong env (route ghi DB bằng service role). Thiếu key thì
  route bỏ qua an toàn.
- (Tuỳ chọn) thêm **Vercel Cron** gọi `/api/sync` mỗi phút để cập nhật ngay cả khi không ai mở web.

> Vẫn còn `/api/admin/score` để chỉnh tay một trận, nhưng lần sync kế tiếp sẽ ghi đè bằng dữ liệu thật.

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

API github lây team member
```
curl -L \
  -H "Accept: application/vnd.github.raw+json" \
  "https://api.github.com/repos/upbound-web/worldcup-live.json/contents/2026/worldcup.squads.json"
```