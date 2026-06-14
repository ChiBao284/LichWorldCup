"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLiveScores } from "@/hooks/useLiveScores";
import MatchCard from "@/components/MatchCard";
import { formatDate, dateKey } from "@/lib/format";
import type { Match } from "@/lib/types";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "live", label: "🔴 Live" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "finished", label: "Kết quả" },
] as const;

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function ScheduleClient({ matches: initial }: { matches: Match[] }) {
  const [matches, setMatches] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [group, setGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /* Tỉ số trực tiếp từ ESPN — chỉ cập nhật score cho các trận đang live */
  const liveScores = useLiveScores(matches);

  /* Realtime cập nhật tỉ số / trạng thái */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabaseBrowser()
      .channel("schedule-matches")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) =>
            prev.map((m) =>
              m.id === (payload.new as Match).id
                ? { ...m, ...(payload.new as Match) }
                : m
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabaseBrowser().removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = matches;
    if (tab === "live") list = list.filter((m) => m.status === "live");
    if (tab === "upcoming") list = list.filter((m) => m.status === "scheduled");
    if (tab === "finished")
      list = [...list.filter((m) => m.status === "finished")].reverse();
    if (group) list = list.filter((m) => m.group_name === group);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.home_team?.name.toLowerCase().includes(q) ||
          m.away_team?.name.toLowerCase().includes(q) ||
          m.home_team_id?.toLowerCase().includes(q) ||
          m.away_team_id?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [matches, tab, group, search]);

  /* Gom nhóm theo ngày (giờ VN) */
  const byDate = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const k = dateKey(m.kickoff_at);
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-4xl font-black sm:text-5xl"
      >
        Lịch <span className="text-gradient">thi đấu</span> 📅
      </motion.h1>

      {/* Bộ lọc */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                tab === t.key
                  ? "bg-gradient-to-r from-neon to-ice text-pitch"
                  : "glass text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm đội... (vd: Việt... à nhầm, Brazil 😅)"
            className="glass ml-auto w-full rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted3 focus:border-neon/50 sm:w-64"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setGroup(null)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              group === null ? "bg-neon/20 text-accent" : "bg-soft text-muted2 hover:text-fg"
            }`}
          >
            Mọi bảng
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(group === g ? null : g)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                group === g ? "bg-neon/20 text-accent" : "bg-soft text-muted2 hover:text-fg"
              }`}
            >
              Bảng {g}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách theo ngày */}
      {byDate.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted2">
          Không tìm thấy trận nào 🤷
        </div>
      ) : (
        <div className="space-y-10">
          {byDate.map(([day, dayMatches]) => (
            <section key={day}>
              <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold capitalize">
                <span className="h-px flex-1 bg-gradient-to-r from-neon/40 to-transparent" />
                {formatDate(dayMatches[0].kickoff_at)}
                <span className="h-px flex-1 bg-gradient-to-l from-neon/40 to-transparent" />
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    liveScore={
                      m.status === "live" ? liveScores[m.id] : undefined
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
