"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Match } from "@/lib/types";
import { formatTime, formatDate, dateKey } from "@/lib/format";
import FlagImg from "@/components/FlagImg";

/* Chiều cao phần thân bracket — mọi cột & line đều tính % theo chiều cao này */
const BODY = "h-[760px]";
const LINE = "bg-line";

/* Một ô trận đấu nhỏ trong nhánh */
function BracketCard({ match, isToday }: { match: Match; isToday: boolean }) {
  const done = match.status === "finished";
  const live = match.status === "live";
  const homeWin = done && match.home_score > match.away_score;
  const awayWin = done && match.away_score > match.home_score;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`glass glass-hover relative block w-44 shrink-0 rounded-xl p-2.5 text-xs ${
        live
          ? "live-dot border-red-500/50"
          : isToday
            ? "border-today shadow-[0_0_24px_-4px_var(--today)]"
            : ""
      }`}
    >
      {isToday && !live && (
        <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-today px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
          ⚡ Hôm nay
        </span>
      )}
      <Row
        flag={match.home_team?.flag}
        name={match.home_team?.name ?? match.home_placeholder ?? "—"}
        score={match.status !== "scheduled" ? match.home_score : null}
        winner={homeWin}
      />
      <div className="my-1.5 h-px bg-soft2" />
      <Row
        flag={match.away_team?.flag}
        name={match.away_team?.name ?? match.away_placeholder ?? "—"}
        score={match.status !== "scheduled" ? match.away_score : null}
        winner={awayWin}
      />
      <p className="mt-1.5 text-center text-[10px] text-muted3">
        {live ? (
          <span className="font-bold text-red-400">● LIVE {match.minute}&apos;</span>
        ) : done ? (
          "Kết thúc"
        ) : (
          <span className={isToday ? "font-bold text-today" : ""}>
            {formatDate(match.kickoff_at)} · {formatTime(match.kickoff_at)}
          </span>
        )}
      </p>
    </Link>
  );
}

function Row({
  flag,
  name,
  score,
  winner,
}: {
  flag?: string;
  name: string;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${
        winner ? "font-extrabold text-accent" : score !== null && !winner ? "text-muted2" : ""
      }`}
    >
      <FlagImg emoji={flag ?? "🏳️"} className="h-4 w-auto object-contain shrink-0" />
      <span className="flex-1 truncate">{name}</span>
      {score !== null && <span className="tabular-nums font-bold">{score}</span>}
    </div>
  );
}

/* Cột một vòng đấu: các trận dàn đều theo chiều dọc (justify-around) */
function RoundColumn({
  title,
  matches,
  todayKey,
  delay,
}: {
  title: string;
  matches: Match[];
  todayKey: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex shrink-0 flex-col"
    >
      <h3 className="mb-3 h-4 text-center text-xs font-black uppercase tracking-wider text-muted2">
        {title}
      </h3>
      <div className={`flex ${BODY} flex-col justify-around`}>
        {matches.map((m) => (
          <BracketCard key={m.id} match={m} isToday={dateKey(m.kickoff_at) === todayKey} />
        ))}
      </div>
    </motion.div>
  );
}

/*
 * Cột line nối giữa 2 vòng. `pairs` = số trận của vòng sau (mỗi trận nhận
 * 2 đường từ vòng trước). Tâm trận i trong cột n trận = (i + 0.5) / n.
 * `mirror` đảo chiều cho cánh phải của bracket.
 */
function Connectors({ pairs, mirror }: { pairs: number; mirror?: boolean }) {
  const sources = pairs * 2;
  return (
    <div className="flex w-8 shrink-0 flex-col" aria-hidden>
      <div className="mb-3 h-4" />
      <div className={`relative ${BODY}`}>
        {Array.from({ length: pairs }, (_, j) => {
          const yTop = ((2 * j + 0.5) / sources) * 100;
          const yBot = ((2 * j + 1.5) / sources) * 100;
          return (
            <div
              key={j}
              className="absolute inset-x-0"
              style={{ top: `${yTop}%`, height: `${yBot - yTop}%` }}
            >
              {/* 2 nhánh vào từ vòng trước */}
              <div className={`absolute top-0 h-px w-1/2 ${LINE} ${mirror ? "right-0" : "left-0"}`} />
              <div className={`absolute bottom-0 h-px w-1/2 ${LINE} ${mirror ? "right-0" : "left-0"}`} />
              {/* thanh dọc */}
              <div className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 ${LINE}`} />
              {/* nhánh ra vòng sau */}
              <div className={`absolute top-1/2 h-px w-1/2 ${LINE} ${mirror ? "left-0" : "right-0"}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Line thẳng nối Bán kết ↔ Chung kết */
function StraightConnector() {
  return (
    <div className="flex w-8 shrink-0 flex-col" aria-hidden>
      <div className="mb-3 h-4" />
      <div className={`relative ${BODY}`}>
        <div className={`absolute top-1/2 h-px w-full ${LINE}`} />
      </div>
    </div>
  );
}

export default function BracketView({ matches }: { matches: Match[] }) {
  const todayKey = dateKey(new Date().toISOString());

  const byStage = (stage: string) =>
    matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => (a.round_slot ?? 0) - (b.round_slot ?? 0));

  const r32 = byStage("r32");
  const r16 = byStage("r16");
  const qf = byStage("qf");
  const sf = byStage("sf");
  const final = byStage("final")[0];
  const third = byStage("third")[0];

  if (matches.length === 0) {
    return (
      <div className="glass rounded-3xl p-12 text-center text-muted2">
        Nhánh đấu sẽ hiện khi có dữ liệu — chạy seed.sql trong Supabase nhé!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex w-max gap-0 px-2">
        {/* ───── Cánh trái ───── */}
        <RoundColumn title="Vòng 1/16" matches={r32.slice(0, 8)} todayKey={todayKey} delay={0} />
        <Connectors pairs={4} />
        <RoundColumn title="Vòng 1/8" matches={r16.slice(0, 4)} todayKey={todayKey} delay={0.08} />
        <Connectors pairs={2} />
        <RoundColumn title="Tứ kết" matches={qf.slice(0, 2)} todayKey={todayKey} delay={0.16} />
        <Connectors pairs={1} />
        <RoundColumn title="Bán kết" matches={sf.slice(0, 1)} todayKey={todayKey} delay={0.24} />
        <StraightConnector />

        {/* ───── Chung kết (giữa) ───── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="flex shrink-0 flex-col"
        >
          <h3 className="mb-3 h-4 text-center text-xs font-black uppercase tracking-wider text-trophy">
            🏆 Chung kết
          </h3>
          <div className={`relative flex ${BODY} flex-col justify-center`}>
            {final && (
              <div className="rounded-2xl bg-gradient-to-b from-gold/30 to-transparent p-[2px] shadow-[0_0_50px_-10px_rgba(255,209,102,0.4)]">
                <BracketCard match={final} isToday={dateKey(final.kickoff_at) === todayKey} />
              </div>
            )}
            {third && (
              <div className="absolute inset-x-0 bottom-2">
                <p className="mb-2 text-center text-[10px] font-bold uppercase text-muted3">
                  Tranh hạng 3
                </p>
                <BracketCard match={third} isToday={dateKey(third.kickoff_at) === todayKey} />
              </div>
            )}
          </div>
        </motion.div>

        {/* ───── Cánh phải ───── */}
        <StraightConnector />
        <RoundColumn title="Bán kết" matches={sf.slice(1, 2)} todayKey={todayKey} delay={0.24} />
        <Connectors pairs={1} mirror />
        <RoundColumn title="Tứ kết" matches={qf.slice(2, 4)} todayKey={todayKey} delay={0.16} />
        <Connectors pairs={2} mirror />
        <RoundColumn title="Vòng 1/8" matches={r16.slice(4, 8)} todayKey={todayKey} delay={0.08} />
        <Connectors pairs={4} mirror />
        <RoundColumn title="Vòng 1/16" matches={r32.slice(8, 16)} todayKey={todayKey} delay={0} />
      </div>
    </div>
  );
}
