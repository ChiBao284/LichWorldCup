"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  useMotionValue,
} from "motion/react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import MatchCard, { StatusBadge } from "@/components/MatchCard";
import PickPanel from "@/components/PickPanel";
import type { LeaderboardRow, Match, Team } from "@/lib/types";

/* ---------- Số đếm chạy khi scroll tới ---------- */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

/* ---------- Section wrapper với hiệu ứng hiện dần ---------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type Props = {
  matches: Match[];
  teams: Team[];
  leaderboard: LeaderboardRow[];
};

export default function HomeClient({ matches: initial, teams, leaderboard }: Props) {
  const [matches, setMatches] = useState(initial);

  /* Realtime: tỉ số & trạng thái trận đấu cập nhật trực tiếp */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabaseBrowser()
      .channel("home-matches")
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

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches
    .filter((m) => m.status === "scheduled" && m.home_team_id)
    .slice(0, 6);
  const finished = matches
    .filter((m) => m.status === "finished")
    .slice(-6)
    .reverse();

  /* Parallax hero */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const ballRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <div>
      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4"
      >
        {/* Quầng sáng parallax */}
        <motion.div
          style={{ y: orbY1 }}
          className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-neon/15 blur-[120px]"
        />
        <motion.div
          style={{ y: orbY2 }}
          className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-ice/15 blur-[100px]"
        />
        <motion.div
          style={{ y: orbY1 }}
          className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-hot/10 blur-[110px]"
        />

        {/* Bóng đá bay lơ lửng */}
        <motion.div
          style={{ rotate: ballRotate }}
          className="absolute right-[12%] top-[18%] text-6xl opacity-80 animate-float sm:text-8xl"
        >
          ⚽
        </motion.div>
        <div className="absolute left-[10%] top-[30%] text-4xl opacity-60 animate-float-slow">
          🏆
        </div>
        <div className="absolute bottom-[28%] left-[18%] text-3xl opacity-50 animate-float">
          🧋
        </div>

        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="relative z-10 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 inline-block rounded-full border border-neon/30 bg-neon/10 px-4 py-1.5 text-sm font-semibold text-neon"
          >
            🇺🇸 🇨🇦 🇲🇽 · 11.06 — 19.07.2026
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.21, 0.6, 0.35, 1] }}
            className="text-6xl font-black leading-none tracking-tighter sm:text-8xl lg:text-9xl"
          >
            <span className="text-gradient block">WORLD CUP</span>
            <span
              className="block text-transparent"
              style={{ WebkitTextStroke: "2px rgba(232,237,247,0.85)" }}
            >
              2026
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-6 max-w-xl text-base text-slate-300 sm:text-lg"
          >
            Lịch thi đấu · Tỉ số trực tiếp · Pick đội cùng đồng nghiệp —{" "}
            <span className="text-gradient-hot font-bold">thua thì mua nước</span> 🧋
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/schedule"
              className="rounded-full bg-gradient-to-r from-neon to-ice px-7 py-3 font-bold text-pitch shadow-[0_0_40px_-8px_rgba(0,255,135,0.6)] transition hover:scale-105"
            >
              Xem lịch đấu 📅
            </Link>
            <Link
              href="#live"
              className="glass rounded-full px-7 py-3 font-bold transition hover:scale-105 hover:border-hot/40"
            >
              Pick đội ngay 🔥
            </Link>
          </motion.div>

          {/* Thống kê */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-4 gap-6 text-center"
          >
            {[
              { n: 48, label: "đội tuyển" },
              { n: 104, label: "trận đấu" },
              { n: 16, label: "thành phố" },
              { n: 3, label: "quốc gia" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-gradient sm:text-4xl">
                  <Counter to={s.n} />
                </div>
                <div className="text-xs text-slate-400 sm:text-sm">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mũi tên scroll */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-6 text-2xl text-slate-500"
        >
          ↓
        </motion.div>
      </section>

      {/* ================= MARQUEE CỜ 48 ĐỘI ================= */}
      <div className="relative border-y border-white/5 bg-white/[0.02] py-4">
        <div className="flex w-max animate-marquee gap-10 px-5 text-4xl">
          {[...teams, ...teams].map((t, i) => (
            <Link
              key={`${t.id}-${i}`}
              href={`/teams/${t.id}`}
              title={t.name}
              className="transition hover:scale-125"
            >
              {t.flag}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20">
        {/* ================= ĐANG DIỄN RA ================= */}
        <section id="live" className="scroll-mt-20">
          <Reveal>
            <h2 className="mb-2 flex items-center gap-3 text-3xl font-black sm:text-4xl">
              <span className="live-dot inline-block h-3 w-3 rounded-full bg-red-500" />
              <span className="text-gradient-hot">Đang diễn ra</span>
            </h2>
            <p className="mb-8 text-slate-400">
              Tỉ số cập nhật trực tiếp — pick đội của bạn trước khi hết trận!
            </p>
          </Reveal>

          {live.length === 0 ? (
            <Reveal>
              <div className="glass rounded-3xl p-10 text-center text-slate-400">
                😴 Chưa có trận nào đang lăn bóng.{" "}
                <Link href="/schedule" className="font-bold text-neon underline">
                  Xem các trận sắp tới →
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-10">
              {live.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.1}>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Link
                      href={`/matches/${m.id}`}
                      className="glass glass-hover relative flex flex-col justify-center overflow-hidden rounded-3xl border-red-500/20 p-8"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-hot/10" />
                      <div className="relative">
                        <div className="mb-5 flex justify-center">
                          <StatusBadge match={m} />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-1 flex-col items-center gap-2">
                            <span className="text-6xl drop-shadow-lg">
                              {m.home_team?.flag}
                            </span>
                            <span className="text-center font-bold">
                              {m.home_team?.name}
                            </span>
                          </div>
                          <motion.div
                            key={`${m.home_score}-${m.away_score}`}
                            initial={{ scale: 1.6 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 14 }}
                            className="text-5xl font-black tabular-nums text-gradient-hot sm:text-6xl"
                          >
                            {m.home_score}-{m.away_score}
                          </motion.div>
                          <div className="flex flex-1 flex-col items-center gap-2">
                            <span className="text-6xl drop-shadow-lg">
                              {m.away_team?.flag}
                            </span>
                            <span className="text-center font-bold">
                              {m.away_team?.name}
                            </span>
                          </div>
                        </div>
                        {m.venue && (
                          <p className="mt-5 text-center text-xs text-slate-400">
                            📍 {m.venue}
                          </p>
                        )}
                      </div>
                    </Link>
                    <PickPanel match={m} />
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* ================= SẮP DIỄN RA ================= */}
        <section>
          <Reveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black sm:text-4xl">
                  <span className="text-gradient">Sắp diễn ra</span> ⏳
                </h2>
                <p className="mt-2 text-slate-400">Đặt lịch hóng kèo dần đi là vừa</p>
              </div>
              <Link
                href="/schedule"
                className="hidden text-sm font-bold text-neon hover:underline sm:block"
              >
                Xem tất cả →
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.07}>
                <MatchCard match={m} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= KẾT QUẢ GẦN ĐÂY ================= */}
        {finished.length > 0 && (
          <section>
            <Reveal>
              <h2 className="mb-8 text-3xl font-black sm:text-4xl">
                Kết quả <span className="text-gradient">gần đây</span> 📊
              </h2>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {finished.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.07}>
                  <MatchCard match={m} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ================= NHÁNH ĐẤU TEASER ================= */}
        <Reveal>
          <Link
            href="/bracket"
            className="glass glass-hover relative block overflow-hidden rounded-3xl p-10 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon/5 via-transparent to-ice/5" />
            <div className="relative">
              <div className="mb-3 text-5xl">🏆</div>
              <h2 className="text-3xl font-black sm:text-4xl">
                Nhánh đấu <span className="text-gradient">loại trực tiếp</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-400">
                32 đội · từ vòng 1/16 đến trận Chung kết tại MetLife Stadium, New York
              </p>
              <span className="mt-6 inline-block rounded-full border border-neon/40 px-6 py-2.5 font-bold text-neon transition group-hover:bg-neon/10">
                Khám phá nhánh đấu →
              </span>
            </div>
          </Link>
        </Reveal>

        {/* ================= BXH THÁNH DỰ ĐOÁN ================= */}
        <section>
          <Reveal>
            <h2 className="mb-2 text-center text-3xl font-black sm:text-4xl">
              🔮 Thánh dự đoán
            </h2>
            <p className="mb-10 text-center text-slate-400">
              Ai pick trúng đội thắng nhiều nhất?
            </p>
          </Reveal>

          {leaderboard.length === 0 ? (
            <Reveal>
              <p className="text-center text-slate-500">
                Chưa có ai trên bảng — pick vài trận để lên bảng vàng nào!
              </p>
            </Reveal>
          ) : (
            <div className="flex items-end justify-center gap-4 sm:gap-8">
              {[leaderboard[1], leaderboard[0], leaderboard[2]]
                .filter(Boolean)
                .map((row, idx) => {
                  const isFirst = row.user_id === leaderboard[0].user_id;
                  const medal = isFirst ? "🥇" : idx === 0 ? "🥈" : "🥉";
                  return (
                    <Reveal key={row.user_id} delay={idx * 0.15} className="text-center">
                      <div
                        className={`mx-auto flex items-center justify-center rounded-full border-2 bg-surface shadow-xl ${
                          isFirst
                            ? "h-24 w-24 border-gold text-5xl shadow-gold/20"
                            : "h-18 w-18 border-white/20 text-4xl"
                        }`}
                      >
                        {row.avatar}
                      </div>
                      <div className="mt-2 text-2xl">{medal}</div>
                      <div className="max-w-24 truncate font-bold">{row.username}</div>
                      <div className="text-gradient text-xl font-black">
                        {row.win_rate ?? 0}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {row.correct_picks}/{row.total_picks} trận
                      </div>
                    </Reveal>
                  );
                })}
            </div>
          )}

          <Reveal className="mt-8 text-center">
            <Link
              href="/leaderboard"
              className="inline-block font-bold text-neon hover:underline"
            >
              Xem bảng xếp hạng đầy đủ →
            </Link>
          </Reveal>
        </section>

        {/* ================= CTA NƯỚC ================= */}
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl p-10 text-center sm:p-14">
            <div className="absolute inset-0 bg-gradient-to-br from-hot/10 via-transparent to-gold/10" />
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="mb-4 inline-block text-6xl"
              >
                🧋
              </motion.div>
              <h2 className="text-3xl font-black sm:text-4xl">
                Luật chơi: <span className="text-gradient-hot">thua là mua nước</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-300">
                Pick sai đội? Vào trang trận đấu nhập link quán nước, cả team sẽ
                &quot;giúp&quot; bạn đặt món ngay lập tức 😈
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
