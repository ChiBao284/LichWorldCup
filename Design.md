# World Cup 2026 — Tài liệu thiết kế

Trang web dự đoán & theo dõi World Cup 2026 (USA · Canada · Mexico). Phong cách **editorial sạch sẽ** — typography khổ lớn, nhiều khoảng trắng, animation sống động khi cuộn.

> ⚠️ Đây là **prototype thiết kế**. Dữ liệu trận đấu, đăng nhập Gmail và "real-time" đều được **mô phỏng trong trình duyệt** — không có backend thật.

---

## 1. Định hướng thẩm mỹ

| Yếu tố | Lựa chọn |
|---|---|
| Vibe | Editorial / sport-broadcast, bold typography |
| Tâm trạng | Năng lượng, tự tin, "ngầu" nhưng vẫn sạch sẽ |
| Thiết bị | Responsive (desktop + mobile) |

---

## 2. Bảng màu

| Token | Mã màu | Dùng cho |
|---|---|---|
| Paper (nền) | `#FBFAF7` | Nền trang, giấy ấm |
| Ink (mực) | `#16140F` | Chữ chính, header, footer, khối tỉ số |
| Accent đỏ | `#E8351F` | Nhấn mạnh, LIVE, "2026", highlight |
| Home green | `#0B6E4F` | Đội nhà / tỉ lệ Mexico |
| Away blue | `#1F4FE8` | Đội khách / tỉ lệ USA |
| Live green | `#16A34A` | Chấm LIVE nhấp nháy |
| Muted | `#6B675E` / `#46433C` | Chữ phụ, caption mono |

Quy tắc: tối đa 1 nền (giấy ấm) + 1 nền tối (footer mực đen). Đỏ là accent duy nhất xuyên suốt.

---

## 3. Typography

| Font | Vai trò |
|---|---|
| **Anton** | Tiêu đề khổ lớn, tỉ số, số liệu thống kê (uppercase, line-height chặt) |
| **Archivo** | Body, nút, mô tả (300–800) |
| **Space Mono** | Caption, nhãn kỹ thuật, số liệu nhỏ, ngày giờ (letter-spacing rộng) |

Cặp tương phản: serif-less display khổng lồ (Anton) ↔ mono kỹ thuật (Space Mono) tạo nhịp "thể thao - dữ liệu".

---

## 4. Cấu trúc trang (top → bottom)

1. **Header sticky** — logo "WORLDCUP/26", chip LIVE nhấp nháy, nút đăng nhập / avatar người dùng. Nền blur trong suốt.
2. **Hero** — eyebrow ngày & 3 nước chủ nhà, tiêu đề "WORLD CUP 2026" khổng lồ, mô tả ngắn, hàng số liệu (48 đội · 104 trận · 16 thành phố · 3 chủ nhà).
3. **Marquee** — dải cờ + tên đội cuộn ngang vô tận.
4. **Trận LIVE tâm điểm** — Mexico vs USA, tỉ số & phút thi đấu cập nhật giả lập real-time, chấm LIVE.
5. **Pick đội** — 2 thẻ đội, avatar circle xếp chồng (tối đa 10 + badge "++"), % mỗi đội + thanh bar động, nút chọn phe.
6. **Kết quả đã đấu** — danh sách trận vòng bảng đã kết thúc với tỉ số FT.
7. **Bảng xếp hạng dự đoán** — người đoán trúng cao nhất (avatar, tên, số trận đúng, % chính xác).
8. **Footer** — call-to-action khổng lồ "Đoán đi. Cổ vũ đi. Thắng." trên nền mực đen.

---

## 5. Tính năng & tương tác

### Đăng nhập (mô phỏng)
- Bấm "Đăng nhập" → modal.
- "Tiếp tục với Google" → tự sinh tên gợi ý.
- Nhập tên hiển thị + chọn **1 trong 12 avatar cartoon** (emoji động vật) **hoặc ẩn danh** (vòng tròn `?` kiểu Google Docs).
- Sau khi vào: avatar + tên hiện ở header.

### Pick đội real-time
- Phải đăng nhập mới pick được (nếu chưa → mở modal).
- Avatar người dùng (viền đỏ) nhảy lên đầu stack của đội đã chọn.
- "Bot" tự động vào chọn mỗi ~2.4s để mô phỏng đám đông → stack & % thay đổi liên tục.
- Stack hiển thị tối đa 10 vòng tròn chồng nhau, dư ra hiện badge `+N`.
- Thanh bar tỉ lệ 2 màu (xanh lá / xanh dương) cập nhật mượt theo %.

### Tỉ số LIVE (mô phỏng)
- Đồng hồ tăng mỗi ~1.7s; ngẫu nhiên ghi bàn; đạt 90′ → FULL TIME.

### Reveal khi cuộn
- Mỗi section mờ + trượt lên khi vào viewport (ngưỡng ~86% chiều cao màn hình).

---

## 6. Kiến trúc kỹ thuật

- **Định dạng:** Design Component (`World Cup 2026.dc.html`) — template + logic class, style inline.
- **State:** quản lý trong `Component extends DCLogic` (user, picks, tỉ số, danh sách reveal).
- **Animation:** CSS keyframes (`wc-pulse`, `wc-marquee`, `wc-float`, `wc-pop`, `wc-fadein`) + transition reveal điều khiển bằng scroll listener.
- **Bản standalone:** `World Cup 2026 (standalone).html` — tự chứa, chạy offline (đã inline font + assets).

---

## 7. Việc có thể làm tiếp (chưa triển khai)

- Nhánh **bracket vòng loại trực tiếp**.
- **Danh sách cầu thủ** từng đội (tên + vị trí).
- Tính năng **"link quán nước"**: đội thua tạo đơn nhóm & dán link để mọi người vào chọn nước.
- Kết nối **dữ liệu / đăng nhập thật** (cần backend).
