/** Format ngày giờ theo tiếng Việt, múi giờ Việt Nam. */

const TZ = "Asia/Ho_Chi_Minh";

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** Giờ + ngày gọn cho tooltip, vd "22:34, 06/06". */
export function formatTimeDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

/**
 * Số phút trận đấu tại một thời điểm (tính từ giờ bóng lăn).
 * Trả về null nếu thời điểm đó trước khi bóng lăn (pick "trước trận").
 * Lưu ý: chỉ là phút thực trôi qua kể từ kickoff — bỏ qua giờ nghỉ/bù giờ.
 */
export function matchMinuteAt(kickoffIso: string, atIso: string): number | null {
  const diffMs = new Date(atIso).getTime() - new Date(kickoffIso).getTime();
  if (diffMs < 0) return null;
  return Math.floor(diffMs / 60000) + 1; // phút 1 = ngay sau khi bóng lăn
}

/** Key ngày (yyyy-mm-dd theo giờ VN) để gom nhóm trận đấu. */
export function dateKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}
