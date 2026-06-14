import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchTeam, fetchPlayers, fetchMatches } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import {
  getSquad,
  sortRoster,
  POSITION_COLORS,
  POSITION_NAMES,
  type SquadPos,
} from "@/lib/squads";
import type { Match, Player } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đội tuyển — World Cup 2026",
};

const POS_ORDER: SquadPos[] = ["GK", "DF", "MF", "FW"];

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

  // Đội hình: ưu tiên dữ liệu từ worldcup.squads.json (theo mã FIFA),
  // nếu JSON không có đội này thì rơi về dữ liệu cầu thủ trong DB.
  const squad = getSquad(team.id);
  const roster: { number: number | null; pos: SquadPos; name: string }[] = squad
    ? squad
    : sortRoster(
        (players as Player[]).map((p) => ({
          number: p.shirt_number,
          pos: p.position as SquadPos,
          name: p.name,
        }))
      );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/teams" className="text-sm text-muted2 hover:text-accent">
        ← Tất cả đội tuyển
      </Link>

      <div className="mb-10 mt-4 flex items-center gap-5">
        <span className="text-7xl drop-shadow-xl sm:text-8xl">{team.flag}</span>
        <div>
          <h1 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">
            {team.name}
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted2">
            Bảng {team.group_name}
            {team.fifa_rank ? ` · Hạng ${team.fifa_rank} FIFA` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Đội hình */}
        <section>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-display text-2xl uppercase tracking-tight">
              Đội hình
            </h2>
            {roster.length > 0 && (
              <span className="font-mono text-xs uppercase tracking-wider text-muted2">
                {roster.length} cầu thủ
              </span>
            )}
          </div>

          {/* Chú thích màu vị trí */}
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider">
            {POS_ORDER.map((pos) => (
              <span key={pos} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: POSITION_COLORS[pos] }}
                />
                <span className="text-muted2">{POSITION_NAMES[pos]}</span>
              </span>
            ))}
          </div>

          {roster.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted2">
              Đội hình đang được cập nhật... 📋
            </div>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {roster.map((p, i) => (
                <li
                  key={`${p.pos}-${p.number ?? "x"}-${i}`}
                  className="glass flex items-center gap-3 rounded-xl px-3 py-2.5"
                >
                  {/* Vị trí (màu) — bên trái tên cầu thủ */}
                  <span
                    className="flex w-9 shrink-0 items-center justify-center rounded-md py-1 text-[11px] font-black tracking-wide"
                    style={{
                      color: POSITION_COLORS[p.pos],
                      backgroundColor: `${POSITION_COLORS[p.pos]}1A`,
                    }}
                    title={POSITION_NAMES[p.pos]}
                  >
                    {p.pos}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {p.name}
                  </span>
                  {p.number != null && (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted3">
                      #{p.number}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lịch đấu của đội */}
        <section>
          <h2 className="mb-5 font-display text-2xl uppercase tracking-tight">
            Lịch đấu
          </h2>
          <div className="space-y-3">
            {teamMatches.length === 0 ? (
              <p className="text-muted3">Chưa có trận nào.</p>
            ) : (
              teamMatches.map((m: Match) => <MatchCard key={m.id} match={m} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
