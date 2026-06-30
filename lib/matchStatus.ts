import type { Match } from "@/lib/types";
import type { LiveScore } from "@/hooks/useLiveScores";

export type EffectiveMatchStatus = {
  status: "scheduled" | "live" | "finished";
  home: number | null;
  away: number | null;
  winner: "home" | "away" | null;
  shootout: { home: number; away: number } | null;
  clock: string;
};

/**
 * Trạng thái/tỉ số "thực tế" của một trận — ưu tiên ESPN khi ESPN báo trận đã
 * kết thúc (kể cả luân lưu), vì nguồn worldcup.json của app đôi khi không có
 * (hoặc chậm có) tỉ số cuối cho các trận knockout đá hiệp phụ/luân lưu.
 */
export function effectiveMatchStatus(
  match: Match,
  liveScore?: LiveScore
): EffectiveMatchStatus {
  if (liveScore?.completed) {
    return {
      status: "finished",
      home: liveScore.home,
      away: liveScore.away,
      winner: liveScore.winner,
      shootout: liveScore.shootout,
      clock: "Kết thúc",
    };
  }

  if (match.status === "finished") {
    return {
      status: "finished",
      home: match.home_score,
      away: match.away_score,
      winner:
        match.home_score > match.away_score
          ? "home"
          : match.away_score > match.home_score
            ? "away"
            : null,
      shootout: null,
      clock: "Kết thúc",
    };
  }

  if (match.status === "live") {
    return {
      status: "live",
      home: liveScore ? liveScore.home : match.home_score,
      away: liveScore ? liveScore.away : match.away_score,
      winner: null,
      shootout: null,
      clock: liveScore?.detail ?? (match.minute ? `${match.minute}'` : ""),
    };
  }

  return { status: "scheduled", home: null, away: null, winner: null, shootout: null, clock: "" };
}
