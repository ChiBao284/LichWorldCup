import Link from "next/link";
import type { Match } from "@/lib/types";
import type { LiveScore } from "@/hooks/useLiveScores";
import { STAGE_LABELS } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/format";

function TeamSide({
  name,
  flag,
  align,
}: {
  name: string;
  flag: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="shrink-0 text-2xl">{flag}</span>
      <span className="min-w-0 truncate text-sm font-semibold sm:text-base">
        {name}
      </span>
    </div>
  );
}

export function StatusBadge({
  match,
  detail,
}: {
  match: Match;
  /** Đồng hồ trực tiếp (vd "67'", "HT") — ưu tiên hơn match.minute nếu có. */
  detail?: string;
}) {
  if (match.status === "live") {
    const clock = detail ?? (match.minute ? `${match.minute}'` : "");
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
        LIVE {clock}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full border border-hairline px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted2">
        Kết thúc
      </span>
    );
  }
  return (
    <span className="rounded-full border border-hairline px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted2">
      {formatDate(match.kickoff_at)}
    </span>
  );
}

/** Card một trận đấu — dùng ở trang chủ, lịch đấu. */
export default function MatchCard({
  match,
  liveScore,
}: {
  match: Match;
  /** Tỉ số trực tiếp từ ESPN — chỉ truyền cho trận đang live. */
  liveScore?: LiveScore;
}) {
  const home = match.home_team;
  const away = match.away_team;
  const showScore = match.status !== "scheduled";
  const homeScore = liveScore ? liveScore.home : match.home_score;
  const awayScore = liveScore ? liveScore.away : match.away_score;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`glass glass-hover block rounded-2xl p-4 ${
        match.status === "live" ? "border-accent" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted2">
          {STAGE_LABELS[match.stage]}
          {match.group_name ? ` · Bảng ${match.group_name}` : ""}
        </span>
        <StatusBadge match={match} detail={liveScore?.detail} />
      </div>

      <div className="flex items-center gap-3">
        <TeamSide
          name={home?.name ?? match.home_placeholder ?? "?"}
          flag={home?.flag ?? "🏳️"}
          align="left"
        />
        <div className="shrink-0 text-center">
          {showScore ? (
            <span
              className={`font-display text-2xl tabular-nums ${
                match.status === "live" ? "text-accent" : "text-fg"
              }`}
            >
              {homeScore} - {awayScore}
            </span>
          ) : (
            <span className="font-mono text-base text-muted tabular-nums">
              {formatTime(match.kickoff_at)}
            </span>
          )}
        </div>
        <TeamSide
          name={away?.name ?? match.away_placeholder ?? "?"}
          flag={away?.flag ?? "🏳️"}
          align="right"
        />
      </div>

      {match.venue && (
        <p className="mt-3 truncate text-center font-mono text-[11px] uppercase tracking-wider text-muted3">
          {match.venue}
        </p>
      )}
    </Link>
  );
}
