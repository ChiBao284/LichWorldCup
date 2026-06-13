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

/** Key ngày (yyyy-mm-dd theo giờ VN) để gom nhóm trận đấu. */
export function dateKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}
