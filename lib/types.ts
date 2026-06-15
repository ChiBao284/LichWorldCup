export type Team = {
  id: string;
  name: string;
  flag: string;
  group_name: string;
  fifa_rank: number | null;
};

export type Player = {
  id: number;
  team_id: string;
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  shirt_number: number | null;
};

export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type MatchStatus = "scheduled" | "live" | "finished";

/** Một bàn thắng (từ worldcup.json goals1/goals2). */
export type GoalEvent = {
  name: string;
  minute: number;
  offset?: number;
  owngoal?: boolean;
  penalty?: boolean;
};

export type Match = {
  id: number;
  stage: MatchStage;
  group_name: string | null;
  round_slot: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  kickoff_at: string;
  venue: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  minute: number | null;
  home_goals?: GoalEvent[] | null;
  away_goals?: GoalEvent[] | null;
  home_team?: Team | null;
  away_team?: Team | null;
};

export type Profile = {
  id: string;
  username: string;
  avatar: string;
  created_at: string;
};

export type Pick = {
  id: number;
  match_id: number;
  user_id: string;
  team_id: string;
  created_at: string;
  profiles?: Profile | null;
};

export type DrinkLink = {
  id: number;
  match_id: number;
  user_id: string;
  url: string;
  note: string | null;
  qr_url: string | null; // ảnh QR chuyển khoản (tuỳ chọn), lưu ở Storage bucket 'drink-qr'
  created_at: string;
  profiles?: Profile | null;
};

export type DrinkOrder = {
  id: number;
  link_id: number;
  user_id: string;
  item: string;
  created_at: string;
  profiles?: Profile | null;
};

export type LeaderboardRow = {
  user_id: string;
  username: string;
  avatar: string;
  total_picks: number;
  correct_picks: number;
  win_rate: number | null;
};

export const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Vòng bảng",
  r32: "Vòng 1/16",
  r16: "Vòng 1/8",
  qf: "Tứ kết",
  sf: "Bán kết",
  third: "Tranh hạng 3",
  final: "Chung kết",
};

export const POSITION_LABELS: Record<Player["position"], string> = {
  GK: "Thủ môn",
  DF: "Hậu vệ",
  MF: "Tiền vệ",
  FW: "Tiền đạo",
};
