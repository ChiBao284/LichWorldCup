import type { MatchStage } from "@/lib/types";

/** 48 đội World Cup 2026 (mã FIFA · tên · cờ · bảng) — khớp worldcup.json. */
export const TEAMS: { code: string; name: string; flag: string; group: string }[] = [
  { code: "MEX", name: "Mexico", flag: "🇲🇽", group: "A" },
  { code: "KOR", name: "South Korea", flag: "🇰🇷", group: "A" },
  { code: "CZE", name: "Czech Republic", flag: "🇨🇿", group: "A" },
  { code: "RSA", name: "South Africa", flag: "🇿🇦", group: "A" },
  { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B" },
  { code: "SUI", name: "Switzerland", flag: "🇨🇭", group: "B" },
  { code: "QAT", name: "Qatar", flag: "🇶🇦", group: "B" },
  { code: "BIH", name: "Bosnia and Herzegovina", flag: "🇧🇦", group: "B" },
  { code: "BRA", name: "Brazil", flag: "🇧🇷", group: "C" },
  { code: "MAR", name: "Morocco", flag: "🇲🇦", group: "C" },
  { code: "SCO", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C" },
  { code: "HAI", name: "Haiti", flag: "🇭🇹", group: "C" },
  { code: "USA", name: "United States", flag: "🇺🇸", group: "D" },
  { code: "AUS", name: "Australia", flag: "🇦🇺", group: "D" },
  { code: "PAR", name: "Paraguay", flag: "🇵🇾", group: "D" },
  { code: "TUR", name: "Turkey", flag: "🇹🇷", group: "D" },
  { code: "GER", name: "Germany", flag: "🇩🇪", group: "E" },
  { code: "CIV", name: "Ivory Coast", flag: "🇨🇮", group: "E" },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", group: "E" },
  { code: "CUW", name: "Curaçao", flag: "🇨🇼", group: "E" },
  { code: "JPN", name: "Japan", flag: "🇯🇵", group: "F" },
  { code: "NED", name: "Netherlands", flag: "🇳🇱", group: "F" },
  { code: "TUN", name: "Tunisia", flag: "🇹🇳", group: "F" },
  { code: "SWE", name: "Sweden", flag: "🇸🇪", group: "F" },
  { code: "BEL", name: "Belgium", flag: "🇧🇪", group: "G" },
  { code: "EGY", name: "Egypt", flag: "🇪🇬", group: "G" },
  { code: "IRN", name: "Iran", flag: "🇮🇷", group: "G" },
  { code: "NZL", name: "New Zealand", flag: "🇳🇿", group: "G" },
  { code: "ESP", name: "Spain", flag: "🇪🇸", group: "H" },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", group: "H" },
  { code: "KSA", name: "Saudi Arabia", flag: "🇸🇦", group: "H" },
  { code: "CPV", name: "Cape Verde", flag: "🇨🇻", group: "H" },
  { code: "FRA", name: "France", flag: "🇫🇷", group: "I" },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", group: "I" },
  { code: "NOR", name: "Norway", flag: "🇳🇴", group: "I" },
  { code: "IRQ", name: "Iraq", flag: "🇮🇶", group: "I" },
  { code: "ARG", name: "Argentina", flag: "🇦🇷", group: "J" },
  { code: "AUT", name: "Austria", flag: "🇦🇹", group: "J" },
  { code: "ALG", name: "Algeria", flag: "🇩🇿", group: "J" },
  { code: "JOR", name: "Jordan", flag: "🇯🇴", group: "J" },
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K" },
  { code: "COL", name: "Colombia", flag: "🇨🇴", group: "K" },
  { code: "UZB", name: "Uzbekistan", flag: "🇺🇿", group: "K" },
  { code: "COD", name: "DR Congo", flag: "🇨🇩", group: "K" },
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L" },
  { code: "CRO", name: "Croatia", flag: "🇭🇷", group: "L" },
  { code: "GHA", name: "Ghana", flag: "🇬🇭", group: "L" },
  { code: "PAN", name: "Panama", flag: "🇵🇦", group: "L" },
];

/** Tên đội (theo worldcup.json) → mã FIFA. Có thêm vài alias khác biệt chính tả. */
export const NAME_TO_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const t of TEAMS) m[t.name] = t.code;
  // Alias: worldcup.json viết khác squads/teams
  m["Bosnia & Herzegovina"] = "BIH";
  m["USA"] = "USA";
  m["Türkiye"] = "TUR";
  m["Côte d'Ivoire"] = "CIV";
  return m;
})();

/** "Group A" → "A". */
export function groupLetter(group?: string | null): string | null {
  if (!group) return null;
  const m = group.match(/Group\s+([A-L])/i);
  return m ? m[1].toUpperCase() : group;
}

/** round (worldcup.json) → stage trong DB. */
export function roundToStage(round: string): MatchStage {
  if (/^Matchday/i.test(round)) return "group";
  if (/Round of 32/i.test(round)) return "r32";
  if (/Round of 16/i.test(round)) return "r16";
  if (/Quarter/i.test(round)) return "qf";
  if (/Semi/i.test(round)) return "sf";
  if (/third/i.test(round)) return "third";
  if (/Final/i.test(round)) return "final";
  return "group";
}

/**
 * "2026-06-11" + "13:00 UTC-6" → ISO UTC string.
 * Trả null nếu không parse được (sẽ bỏ qua trận đó).
 */
export function parseKickoff(date: string, time: string): string | null {
  const m = time.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})/i);
  if (!m) return null;
  const [, hh, mm, off] = m;
  const sign = off.startsWith("-") ? "-" : "+";
  const offH = String(Math.abs(parseInt(off, 10))).padStart(2, "0");
  const iso = `${date}T${hh.padStart(2, "0")}:${mm}:00${sign}${offH}:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Placeholder knockout ("2A", "3A/B/C/D/F", "W74", "L101") → chữ tiếng Việt.
 * Null nếu là tên đội thật (đã map được mã).
 */
export function prettyPlaceholder(token: string): string {
  const t = token.trim();
  let m = t.match(/^([123])([A-L])$/);
  if (m) {
    const rank = m[1] === "1" ? "Nhất" : m[1] === "2" ? "Nhì" : "Ba";
    return `${rank} bảng ${m[2]}`;
  }
  if (/^3[A-L/]+$/.test(t)) return `Hạng 3 (${t.slice(1)})`;
  m = t.match(/^W(\d+)$/i);
  if (m) return `Thắng trận ${m[1]}`;
  m = t.match(/^L(\d+)$/i);
  if (m) return `Thua trận ${m[1]}`;
  return t;
}

/** Khoá ổn định cho mỗi trận (dùng upsert vào DB vì API không có id). */
export function matchExtId(round: string, team1: string, team2: string): string {
  return `${round}__${team1}__${team2}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
