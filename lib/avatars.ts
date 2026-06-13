/** Bộ avatar cartoon để người dùng chọn làm đại diện. */
export const AVATARS = [
  "🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐧",
  "🐨", "🐰", "🦖", "🦉", "🐳", "🐢", "🐱", "🦋",
  "🐶", "🐹", "🐻", "🐵", "🦅", "🦈", "🐲", "🦜",
  "🤖", "👽", "🥷", "🧙", "🦸", "🧛", "⚽", "🏆",
];

/** Tên động vật "ẩn danh" kiểu Google Docs, khớp với trigger trong DB. */
export const ANONYMOUS_ANIMALS: { emoji: string; name: string }[] = [
  { emoji: "🦊", name: "Cáo" },
  { emoji: "🐼", name: "Gấu trúc" },
  { emoji: "🐯", name: "Hổ" },
  { emoji: "🦁", name: "Sư tử" },
  { emoji: "🐸", name: "Ếch" },
  { emoji: "🐙", name: "Bạch tuộc" },
  { emoji: "🦄", name: "Kỳ lân" },
  { emoji: "🐧", name: "Cánh cụt" },
  { emoji: "🐨", name: "Koala" },
  { emoji: "🐰", name: "Thỏ" },
  { emoji: "🦖", name: "Khủng long" },
  { emoji: "🦉", name: "Cú mèo" },
  { emoji: "🐳", name: "Cá voi" },
  { emoji: "🐢", name: "Rùa" },
  { emoji: "🐱", name: "Mèo" },
  { emoji: "🦋", name: "Bướm" },
];

export function isAnonymousName(username: string) {
  return username.includes("ẩn danh");
}
