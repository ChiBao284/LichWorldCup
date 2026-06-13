import type { Metadata } from "next";
import { fetchLeaderboard } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bảng xếp hạng thánh dự đoán — World Cup 2026",
};

export default async function LeaderboardPage() {
  const rows: LeaderboardRow[] = await fetchLeaderboard();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-4xl font-black sm:text-5xl">
        🔮 Thánh <span className="text-gradient">dự đoán</span>
      </h1>
      <p className="mb-10 text-slate-400">
        Xếp hạng theo tỉ lệ pick trúng đội thắng (chỉ tính trận đã kết thúc, hòa
        không tính trúng).
      </p>

      {rows.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-slate-400">
          Chưa có ai trên bảng — pick vài trận để trở thành thánh dự đoán đầu tiên! 🥇
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <li
                key={row.user_id}
                className={`glass flex items-center gap-4 rounded-2xl px-4 py-3 ${
                  i === 0 ? "border-gold/40 shadow-[0_0_30px_-10px_rgba(255,209,102,0.4)]" : ""
                }`}
              >
                <span className="w-8 text-center text-lg font-black text-slate-400">
                  {medal ?? i + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface text-2xl">
                  {row.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{row.username}</p>
                  <p className="text-xs text-slate-400">
                    Trúng {row.correct_picks}/{row.total_picks} trận
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gradient text-2xl font-black tabular-nums">
                    {row.win_rate ?? 0}%
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
