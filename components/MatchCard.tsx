import Link from "next/link";
import type { Match } from "@/lib/types";
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
      className={`flex flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="text-2xl drop-shadow">{flag}</span>
      <span className="truncate text-sm font-semibold sm:text-base">{name}</span>
    </div>
  );
}

export function StatusBadge({ match }: { match: Match }) {
  if (match.status === "live") {
    return (
      <span className="live-dot inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        LIVE {match.minute ? `${match.minute}'` : ""}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
        Kết thúc
      </span>
    );
  }
  return (
    <span className="rounded-full bg-ice/10 px-2.5 py-0.5 text-xs font-semibold text-ice">
      {formatDate(match.kickoff_at)}
    </span>
  );
}

/** Card một trận đấu — dùng ở trang chủ, lịch đấu. */
export default function MatchCard({ match }: { match: Match }) {
  const home = match.home_team;
  const away = match.away_team;
  const showScore = match.status !== "scheduled";

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`glass glass-hover block rounded-2xl p-4 ${
        match.status === "live" ? "border-red-500/30" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>
          {STAGE_LABELS[match.stage]}
          {match.group_name ? ` · Bảng ${match.group_name}` : ""}
        </span>
        <StatusBadge match={match} />
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
              className={`text-xl font-black tabular-nums sm:text-2xl ${
                match.status === "live" ? "text-gradient-hot" : ""
              }`}
            >
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <span className="text-lg font-bold text-slate-300 tabular-nums">
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
        <p className="mt-3 truncate text-center text-xs text-slate-500">
          📍 {match.venue}
        </p>
      )}
    </Link>
  );
}
