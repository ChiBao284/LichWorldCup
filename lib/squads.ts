import squadsData from "@/app/data/worldcup.squads.json";

export type SquadPos = "GK" | "DF" | "MF" | "FW";

export type SquadPlayer = {
  number: number | null;
  pos: SquadPos;
  name: string;
  date_of_birth?: string;
};

type SquadTeam = {
  name: string;
  fifa_code: string;
  group: string;
  players: SquadPlayer[];
};

const squads = squadsData as unknown as SquadTeam[];

/** Tra cứu đội theo mã FIFA (vd 'ARG'). */
const byCode = new Map(squads.map((t) => [t.fifa_code.toUpperCase(), t]));

/** Màu theo vị trí (yêu cầu thiết kế). */
export const POSITION_COLORS: Record<SquadPos, string> = {
  GK: "#F6BD2B", // thủ môn
  DF: "#0F5AD0", // hậu vệ
  MF: "#21AA49", // tiền vệ
  FW: "#F60001", // tiền đạo
};

export const POSITION_NAMES: Record<SquadPos, string> = {
  GK: "Thủ môn",
  DF: "Hậu vệ",
  MF: "Tiền vệ",
  FW: "Tiền đạo",
};

const ORDER: SquadPos[] = ["GK", "DF", "MF", "FW"];

/** Sắp xếp đội hình: theo nhóm vị trí rồi số áo. */
export function sortRoster<T extends { pos: SquadPos; number: number | null }>(
  list: T[]
): T[] {
  return [...list].sort(
    (a, b) =>
      ORDER.indexOf(a.pos) - ORDER.indexOf(b.pos) ||
      (a.number ?? 99) - (b.number ?? 99)
  );
}

/** Đội hình của một đội theo mã FIFA, đã sắp xếp. Null nếu JSON không có đội đó. */
export function getSquad(fifaCode: string): SquadPlayer[] | null {
  const team = byCode.get(fifaCode.toUpperCase());
  if (!team) return null;
  return sortRoster(team.players);
}
