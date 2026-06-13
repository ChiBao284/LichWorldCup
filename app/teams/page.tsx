import type { Metadata } from "next";
import Link from "next/link";
import { fetchTeams } from "@/lib/supabase/server";
import type { Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "48 đội tuyển — World Cup 2026",
};

export default async function TeamsPage() {
  const teams: Team[] = await fetchTeams();

  const groups = new Map<string, Team[]>();
  for (const t of teams) {
    groups.set(t.group_name, [...(groups.get(t.group_name) ?? []), t]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-4xl font-black sm:text-5xl">
        48 <span className="text-gradient">đội tuyển</span> 🌍
      </h1>
      <p className="mb-10 text-slate-400">
        12 bảng đấu — bấm vào đội để xem danh sách cầu thủ.
      </p>

      {teams.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-slate-400">
          Chưa có dữ liệu — chạy seed.sql trong Supabase nhé!
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...groups.entries()].map(([g, list]) => (
            <section key={g} className="glass rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-neon">
                Bảng {g}
              </h2>
              <ul className="space-y-1">
                {list.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/teams/${t.id}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/5"
                    >
                      <span className="text-2xl">{t.flag}</span>
                      <span className="flex-1 font-semibold">{t.name}</span>
                      {t.fifa_rank && (
                        <span className="text-xs text-slate-500">#{t.fifa_rank} FIFA</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
