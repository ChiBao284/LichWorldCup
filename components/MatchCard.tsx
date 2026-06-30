import Link from "next/link";
import type { Match } from "@/lib/types";
import type { LiveScore } from "@/hooks/useLiveScores";
import { STAGE_LABELS } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/format";
import FlagImg from "@/components/FlagImg";
import { effectiveMatchStatus } from "@/lib/matchStatus";

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
      <FlagImg emoji={flag} className="shrink-0 h-6 w-auto object-contain" />
      <span className="min-w-0 truncate text-sm font-semibold sm:text-base">
        {name}
      </span>
    </div>
  );
}

export function StatusBadge({
  match,
  liveScore,
}: {
  match: Match;
  /** Tỉ số trực tiếp từ ESPN — dùng để biết trận đã thực sự kết thúc chưa (kể cả luân lưu). */
  liveScore?: LiveScore;
}) {
  const eff = effectiveMatchStatus(match, liveScore);
  if (eff.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
        LIVE {eff.clock}
      </span>
    );
  }
  if (eff.status === "finished") {
    return (
      <span className="rounded-full border border-hairline px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted2">
        {eff.shootout ? `Luân lưu ${eff.shootout.home}-${eff.shootout.away}` : "Kết thúc"}
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
  const eff = effectiveMatchStatus(match, liveScore);
  const showScore = eff.status !== "scheduled";

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`glass glass-hover block rounded-2xl p-4 ${
        eff.status === "live" ? "border-accent" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted2">
          {STAGE_LABELS[match.stage]}
          {match.group_name ? ` · Bảng ${match.group_name}` : ""}
        </span>
        <StatusBadge match={match} liveScore={liveScore} />
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
                eff.status === "live" ? "text-accent" : "text-fg"
              }`}
            >
              {eff.home} - {eff.away}
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
