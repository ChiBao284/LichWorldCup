"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import AvatarStack from "@/components/AvatarStack";
import MatchDrinkLinks from "@/components/MatchDrinkLinks";
import type { Match, Pick, Team } from "@/lib/types";

/** Lấy danh sách pick của một trận (kèm profile người pick). */
async function fetchPicks(matchId: number): Promise<Pick[]> {
  const { data } = await supabaseBrowser()
    .from("picks")
    .select("*, profiles(*)")
    .eq("match_id", matchId)
    .order("created_at");
  return (data as Pick[]) ?? [];
}

/** Số % đếm mượt khi thay đổi. */
function Pct({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return <span className="tabular-nums">{display}%</span>;
}

/**
 * Panel pick đội yêu thích cho một trận đấu.
 * Realtime: avatar mọi người + % chọn mỗi đội cập nhật trực tiếp.
 */
export default function PickPanel({ match }: { match: Match }) {
  const { user, signInWithGoogle } = useUser();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [saving, setSaving] = useState(false);

  const locked = match.status === "finished";
  const home = match.home_team;
  const away = match.away_team;

  const loadPicks = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setPicks(await fetchPicks(match.id));
  }, [match.id]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchPicks(match.id).then(setPicks);
    const channel = supabaseBrowser()
      .channel(`picks-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "picks",
          filter: `match_id=eq.${match.id}`,
        },
        () => fetchPicks(match.id).then(setPicks)
      )
      .subscribe();
    return () => {
      supabaseBrowser().removeChannel(channel);
    };
  }, [match.id]);

  const { homePicks, awayPicks, homePct, awayPct, total } = useMemo(() => {
    const h = picks.filter((p) => p.team_id === match.home_team_id);
    const a = picks.filter((p) => p.team_id === match.away_team_id);
    const t = h.length + a.length;
    return {
      homePicks: h,
      awayPicks: a,
      total: t,
      homePct: t ? Math.round((h.length / t) * 100) : 50,
      awayPct: t ? 100 - Math.round((h.length / t) * 100) : 50,
    };
  }, [picks, match.home_team_id, match.away_team_id]);

  const myPick = user ? picks.find((p) => p.user_id === user.id) : undefined;
  const leader =
    total === 0 || homePct === awayPct ? null : homePct > awayPct ? home?.id : away?.id;

  async function pick(teamId: string | null) {
    if (!teamId || locked || saving) return;
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSaving(true);
    await supabaseBrowser()
      .from("picks")
      .upsert(
        { match_id: match.id, user_id: user.id, team_id: teamId },
        { onConflict: "match_id,user_id" }
      );
    await loadPicks();
    setSaving(false);
  }

  if (!home || !away) return null;

  const sides: {
    team: Team;
    picksList: Pick[];
    pct: number;
    pctClass: string; // màu chữ % theo đội
    mineBorder: string; // viền + nền nhạt khi mình chọn đội này
    barClass: string; // màu thanh kéo co
  }[] = [
    {
      team: home,
      picksList: homePicks,
      pct: homePct,
      pctClass: "text-home",
      mineBorder: "border-home bg-home/10",
      barClass: "bg-home",
    },
    {
      team: away,
      picksList: awayPicks,
      pct: awayPct,
      pctClass: "text-away",
      mineBorder: "border-away bg-away/10",
      barClass: "bg-away",
    },
  ];

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <h3 className="font-display text-2xl uppercase leading-[0.86] tracking-tight sm:text-3xl">
          Bạn đứng về phe nào?
        </h3>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted2">
          {total} người
        </span>
      </div>

      {/* Hai đội */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {sides.map(({ team, picksList, pct, pctClass, mineBorder }) => {
          const isMine = myPick?.team_id === team.id;
          const isLeader = leader === team.id;
          return (
            <motion.button
              key={team.id}
              onClick={() => pick(team.id)}
              disabled={locked || saving}
              whileHover={locked ? undefined : { scale: 1.03, y: -2 }}
              whileTap={locked ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-colors ${
                isMine
                  ? mineBorder
                  : "border-hairline bg-card hover:border-fg/30"
              } ${locked ? "cursor-default opacity-90" : "cursor-pointer"}`}
            >
              {/* Vương miện đội đang dẫn */}
              <AnimatePresence>
                {isLeader && total > 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: -8, rotate: -20 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-3 top-2 text-lg"
                    title="Đang được chọn nhiều hơn"
                  >
                    👑
                  </motion.span>
                )}
              </AnimatePresence>

              <div className="relative mb-1 flex items-center gap-2">
                <motion.span
                  className="text-3xl"
                  whileHover={{ scale: 1.15, rotate: -6 }}
                >
                  {team.flag}
                </motion.span>
                <span className="truncate font-semibold">{team.name}</span>
              </div>

              <div
                className={`mb-2 font-display text-4xl tabular-nums leading-none ${pctClass}`}
              >
                <Pct value={pct} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <AvatarStack picks={picksList} youId={user?.id} />
                {isMine && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-bold text-pitch"
                  >
                    ✓ BẠN
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Thanh kéo co với nút trượt */}
      <div className="relative mt-6 h-7">
        <div className="absolute inset-x-0 top-1/2 flex h-4 -translate-y-1/2 overflow-hidden rounded-full border border-hairline bg-soft">
          <motion.div
            className="bg-home"
            animate={{ width: `${homePct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          <motion.div
            className="bg-away"
            animate={{ width: `${awayPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        {/* Nút trượt ở ranh giới — mang cờ đội đang dẫn */}
        <motion.div
          className="absolute top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-card bg-card text-sm shadow-md"
          animate={{ left: `${homePct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          {total === 0
            ? "⚖️"
            : homePct === awayPct
              ? "🤝"
              : homePct > awayPct
                ? home.flag
                : away.flag}
        </motion.div>
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] uppercase tracking-wider">
        <span className="text-home">
          {home.flag} {homePicks.length} người
        </span>
        <span className="text-away">
          {awayPicks.length} người {away.flag}
        </span>
      </div>

      {locked ? (
        <p className="mt-4 text-center text-xs text-muted3">
          Trận đã kết thúc — hết pick rồi nha 😉
        </p>
      ) : !user ? (
        <p className="mt-4 text-center text-xs text-muted2">
          Bấm vào một đội để{" "}
          <button
            onClick={signInWithGoogle}
            className="font-semibold text-accent underline underline-offset-2"
          >
            đăng nhập Google
          </button>{" "}
          và pick
        </p>
      ) : null}

      {/* Link nước: ai cũng dán được, bấm để mở quán & đặt nước */}
      <MatchDrinkLinks matchId={match.id} />
    </div>
  );
}
