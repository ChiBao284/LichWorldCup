import type { Metadata } from "next";
import { fetchTopScorers } from "@/lib/supabase/server";
import FlagImg from "@/components/FlagImg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vua phá lưới — World Cup 2026",
};

export default async function LeaderboardPage() {
  const scorers = await fetchTopScorers();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-4xl font-black sm:text-5xl">
        Vua <span className="text-gradient">phá lưới</span> ⚽
      </h1>
      <p className="mb-10 text-muted2">
        Xếp hạng cầu thủ ghi nhiều bàn thắng nhất (không tính phản lưới).
      </p>

      {scorers.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted2">
          Chưa có bàn thắng nào được ghi nhận.
        </div>
      ) : (
        <ol className="space-y-2">
          {scorers.map((s, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <li
                key={`${s.name}|${s.team_name}`}
                className={`glass flex items-center gap-4 rounded-2xl px-4 py-3 ${
                  i === 0 ? "border-gold/40 shadow-[0_0_30px_-10px_rgba(255,209,102,0.4)]" : ""
                }`}
              >
                <span className="w-8 shrink-0 text-center text-lg font-black text-muted2">
                  {medal ?? i + 1}
                </span>
                <FlagImg
                  emoji={s.team_flag}
                  className="h-8 w-auto shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted2">{s.team_name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-gradient text-2xl font-black tabular-nums">
                    {s.goals}
                  </span>
                  <span className="ml-1 text-xs text-muted3">bàn</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
