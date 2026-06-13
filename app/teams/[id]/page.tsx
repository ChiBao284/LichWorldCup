import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchTeam, fetchPlayers, fetchMatches } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import { POSITION_LABELS } from "@/lib/types";
import type { Match, Player } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đội tuyển — World Cup 2026",
};

const POSITION_ORDER: Player["position"][] = ["GK", "DF", "MF", "FW"];
const POSITION_ICONS: Record<Player["position"], string> = {
  GK: "🧤",
  DF: "🛡️",
  MF: "🎯",
  FW: "⚡",
};

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [team, players, allMatches] = await Promise.all([
    fetchTeam(id.toUpperCase()),
    fetchPlayers(id.toUpperCase()),
    fetchMatches(),
  ]);
  if (!team) notFound();

  const teamMatches = allMatches.filter(
    (m: Match) => m.home_team_id === team.id || m.away_team_id === team.id
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/teams" className="text-sm text-slate-400 hover:text-neon">
        ← Tất cả đội tuyển
      </Link>

      <div className="mb-10 mt-4 flex items-center gap-5">
        <span className="text-7xl drop-shadow-xl sm:text-8xl">{team.flag}</span>
        <div>
          <h1 className="text-4xl font-black sm:text-5xl">{team.name}</h1>
          <p className="mt-1 text-slate-400">
            Bảng {team.group_name}
            {team.fifa_rank ? ` · Hạng ${team.fifa_rank} FIFA` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Đội hình */}
        <section>
          <h2 className="mb-5 text-2xl font-black">
            Đội hình <span className="text-gradient">⚽</span>
          </h2>
          {players.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-slate-400">
              Đội hình đang được cập nhật... 📋
            </div>
          ) : (
            <div className="space-y-6">
              {POSITION_ORDER.map((pos) => {
                const list = players.filter((p: Player) => p.position === pos);
                if (list.length === 0) return null;
                return (
                  <div key={pos}>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                      {POSITION_ICONS[pos]} {POSITION_LABELS[pos]}
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {list.map((p: Player) => (
                        <li
                          key={p.id}
                          className="glass flex items-center gap-3 rounded-xl px-4 py-2.5"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-black text-neon tabular-nums">
                            {p.shirt_number ?? "–"}
                          </span>
                          <span className="truncate font-semibold">{p.name}</span>
                          <span className="ml-auto shrink-0 text-xs text-slate-500">
                            {POSITION_LABELS[p.position]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Lịch đấu của đội */}
        <section>
          <h2 className="mb-5 text-2xl font-black">
            Lịch đấu <span className="text-gradient">📅</span>
          </h2>
          <div className="space-y-3">
            {teamMatches.length === 0 ? (
              <p className="text-slate-500">Chưa có trận nào.</p>
            ) : (
              teamMatches.map((m: Match) => <MatchCard key={m.id} match={m} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
