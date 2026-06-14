'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    motion,
    useScroll,
    useTransform,
    useInView,
    useSpring,
    useMotionValue,
} from 'motion/react';
import messiShadow from '@/app/assets/messi_shadow.png';
import ronaldoShadow from '@/app/assets/ronaldo_shadow.png';
import { supabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';
import { useLiveScores } from '@/hooks/useLiveScores';
import MatchCard, { StatusBadge } from '@/components/MatchCard';
import PickPanel from '@/components/PickPanel';
import Avatar from '@/components/Avatar';
import type { LeaderboardRow, Match, Team } from '@/lib/types';

/* ---------- Số đếm chạy khi scroll tới ---------- */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const mv = useMotionValue(0);
    const spring = useSpring(mv, { stiffness: 60, damping: 18 });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (inView) mv.set(to);
    }, [inView, mv, to]);

    useEffect(
        () => spring.on('change', (v) => setDisplay(Math.round(v))),
        [spring],
    );

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
    className = '',
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
            className={className}>
            {children}
        </motion.div>
    );
}

type Props = {
    matches: Match[];
    teams: Team[];
    leaderboard: LeaderboardRow[];
};

export default function HomeClient({
    matches: initial,
    teams,
    leaderboard,
}: Props) {
    const [matches, setMatches] = useState(initial);

    /* Realtime: tỉ số & trạng thái trận đấu cập nhật trực tiếp */
    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        const channel = supabaseBrowser()
            .channel('home-matches')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matches' },
                (payload) => {
                    setMatches((prev) =>
                        prev.map((m) =>
                            m.id === (payload.new as Match).id
                                ? { ...m, ...(payload.new as Match) }
                                : m,
                        ),
                    );
                },
            )
            .subscribe();
        return () => {
            supabaseBrowser().removeChannel(channel);
        };
    }, []);

    const live = matches.filter((m) => m.status === 'live');
    /* Tỉ số trực tiếp từ ESPN — chỉ cập nhật phần score cho các trận live */
    const liveScores = useLiveScores(matches);
    const upcoming = matches
        .filter((m) => m.status === 'scheduled' && m.home_team_id)
        .slice(0, 6);
    const finished = matches
        .filter((m) => m.status === 'finished')
        .slice(-6)
        .reverse();

    /* Parallax hero */
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });
    const titleY = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const titleOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <div>
            {/* ================= HERO ================= */}
            <section
                ref={heroRef}
                className="relative flex min-h-[88vh] flex-col justify-center overflow-hidden">
                <motion.div
                    style={{ y: titleY, opacity: titleOpacity }}
                    className="relative z-10 mx-auto w-full max-w-6xl px-4">
                    {/* Eyebrow */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="eyebrow text-accent">
                        11 Jun – 19 Jul · USA · Canada · Mexico
                    </motion.p>

                    {/* Tiêu đề khổ lớn */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            ease: [0.21, 0.6, 0.35, 1],
                        }}
                        className="mt-5 font-display uppercase text-[clamp(56px,13vw,168px)] leading-[0.95] tracking-[-0.015em]">
                        <span className="block text-fg">World Cup</span>
                        <span className="block">
                            <span className="text-fg">20</span>
                            <span className="text-accent">26</span>
                        </span>
                    </motion.h1>

                    {/* Mô tả */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 max-w-xl text-muted text-[clamp(16px,2.2vw,21px)] leading-relaxed">
                        Giải đấu lớn nhất lịch sử — 48 đội, 104 trận, 3 quốc gia
                        chủ nhà. Theo dõi trực tiếp, chọn phe và xem ai đoán
                        giỏi nhất.
                    </motion.p>

                    {/* Lưới số liệu */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="relative mt-12 grid grid-cols-4 gap-px border-y border-hairline"
                        style={{ background: 'var(--hairline)' }}>
                        {[
                            { n: 48, label: 'Đội tuyển' },
                            { n: 104, label: 'Trận đấu' },
                            { n: 16, label: 'Thành phố' },
                            { n: 3, label: 'Chủ nhà' },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="bg-bg px-2 py-6 text-center">
                                <div className="font-display text-fg text-[clamp(34px,5vw,60px)] leading-none">
                                    <Counter to={s.n} />
                                </div>
                                <div className="eyebrow text-muted2 text-[11px] mt-2">
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Messi & Ronaldo — chồng lên nhau ở bên phải, chỉ hiện trên desktop */}
                <div className="pointer-events-none absolute inset-y-0 right-45 z-0 hidden w-[55%] overflow-hidden lg:block">
                    {/* Messi nằm sau, lệch về bên phải */}
                    <Image
                        src={messiShadow}
                        alt="Lionel Messi"
                        priority
                        sizes="55vw"
                        className="absolute top-[22%] right-1 z-10 h-[50%] w-auto select-none object-contain object-bottom opacity-90"
                    />
                    {/* Ronaldo nằm trước */}
                    <Image
                        src={ronaldoShadow}
                        alt="Cristiano Ronaldo"
                        priority
                        sizes="50vw"
                        className="absolute top-[22%] bottom-0 right-[22%] z-20 h-[50%] w-auto select-none object-contain object-bottom"
                    />
                </div>

                {/* Tag LIVE NOW — chỉ hiện trên desktop */}
                <div className="pointer-events-none absolute right-[8%] top-[22%] z-30 hidden lg:block">
                    <span className="inline-block rotate-[-8deg] rounded-xl bg-accent px-4 py-3 font-display uppercase text-pitch leading-none text-2xl animate-wc-float">
                        Live Now
                    </span>
                </div>
            </section>

            {/* ================= MARQUEE 48 ĐỘI ================= */}
            <div className="relative overflow-hidden border-y border-hairline bg-card py-4">
                <div className="flex w-max animate-marquee items-center gap-10 px-5">
                    {[...teams, ...teams].map((t, i) => (
                        <div
                            key={`${t.id}-${i}`}
                            className="flex items-center gap-10">
                            <Link
                                href={`/teams/${t.id}`}
                                title={t.name}
                                className="font-display uppercase tracking-tight text-fg text-[30px] leading-none transition hover:text-accent">
                                {t.flag} {t.name}
                            </Link>
                            <span
                                className="text-accent text-[18px]"
                                aria-hidden>
                                ★
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mx-auto max-w-6xl space-y-24 px-4 py-20">
                {/* ================= TRẬN LIVE TÂM ĐIỂM ================= */}
                <section id="live" className="scroll-mt-20">
                    <Reveal>
                        <p className="eyebrow text-accent flex items-center gap-2">
                            <span className="live-dot inline-block h-2 w-2 rounded-full bg-live" />
                            Đang diễn ra
                        </p>
                        <h2 className="mt-3 font-display uppercase text-fg text-[clamp(34px,6vw,68px)] leading-[0.86] tracking-tight">
                            Trận cầu tâm điểm
                        </h2>
                    </Reveal>

                    {live.length === 0 ? (
                        <Reveal className="mt-8">
                            <div className="glass rounded-[22px] p-10 text-center">
                                <p className="font-display uppercase text-fg text-2xl leading-none">
                                    Chưa có trận nào đang lăn bóng
                                </p>
                                <p className="mt-3 text-muted">
                                    Trận đấu sẽ hiện ở đây ngay khi bóng lăn.{' '}
                                    <Link
                                        href="/schedule"
                                        className="font-semibold text-accent">
                                        Xem các trận sắp tới →
                                    </Link>
                                </p>
                            </div>
                        </Reveal>
                    ) : (
                        <div className="mt-8 space-y-10">
                            {live.map((m, i) => {
                                const ls = liveScores[m.id];
                                const hs = ls ? ls.home : m.home_score;
                                const as = ls ? ls.away : m.away_score;
                                return (
                                <Reveal key={m.id} delay={i * 0.1}>
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <Link
                                            href={`/matches/${m.id}`}
                                            className="glass glass-hover rounded-[22px] p-8">
                                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                                {/* Đội nhà */}
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <span className="text-[clamp(54px,9vw,96px)] leading-none">
                                                        {m.home_team?.flag}
                                                    </span>
                                                    <span className="font-display uppercase text-fg text-[clamp(22px,3.4vw,40px)] leading-[0.9]">
                                                        {m.home_team?.name}
                                                    </span>
                                                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted2">
                                                        {m.home_team_id ?? '?'}{' '}
                                                        · Home
                                                    </span>
                                                </div>

                                                {/* Giữa: live + tỉ số */}
                                                <div className="flex flex-col items-center gap-3">
                                                    <StatusBadge
                                                        match={m}
                                                        detail={ls?.detail}
                                                    />
                                                    <motion.div
                                                        key={`${hs}-${as}`}
                                                        initial={{ scale: 1.4 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 200,
                                                            damping: 14,
                                                        }}
                                                        className="font-display tabular-nums text-fg text-[clamp(48px,11vw,112px)] leading-[0.82]">
                                                        {hs}–{as}
                                                    </motion.div>
                                                </div>

                                                {/* Đội khách */}
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <span className="text-[clamp(54px,9vw,96px)] leading-none">
                                                        {m.away_team?.flag}
                                                    </span>
                                                    <span className="font-display uppercase text-fg text-[clamp(22px,3.4vw,40px)] leading-[0.9]">
                                                        {m.away_team?.name}
                                                    </span>
                                                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted2">
                                                        {m.away_team_id ?? '?'}{' '}
                                                        · Away
                                                    </span>
                                                </div>
                                            </div>

                                            {m.venue && (
                                                <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-wider text-muted2">
                                                    {m.venue}
                                                </p>
                                            )}
                                        </Link>
                                        <PickPanel match={m} />
                                    </div>
                                </Reveal>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ================= SẮP DIỄN RA ================= */}
                <section>
                    <Reveal>
                        <div className="mb-8 flex items-end justify-between gap-4">
                            <h2 className="font-display uppercase text-fg text-[clamp(34px,6vw,68px)] leading-[0.86] tracking-tight">
                                Sắp diễn ra
                            </h2>
                            <Link
                                href="/schedule"
                                className="shrink-0 font-mono text-[12px] uppercase tracking-wider text-accent hover:underline">
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
                            <h2 className="mb-8 font-display uppercase text-fg text-[clamp(34px,6vw,68px)] leading-[0.86] tracking-tight">
                                Kết quả gần đây
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
                        className="glass glass-hover block rounded-[22px] p-10 text-center">
                        <div className="text-5xl">🏆</div>
                        <h2 className="mt-4 font-display uppercase text-fg text-[clamp(34px,6vw,68px)] leading-[0.86] tracking-tight">
                            Nhánh đấu loại trực tiếp
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-muted">
                            32 đội · từ vòng 1/16 đến trận Chung kết tại MetLife
                            Stadium, New York.
                        </p>
                        <span className="mt-6 inline-block rounded-full border border-accent px-6 py-2.5 font-mono text-[12px] uppercase tracking-wider text-accent">
                            Khám phá →
                        </span>
                    </Link>
                </Reveal>

                {/* ================= BXH THÁNH DỰ ĐOÁN ================= */}
                <section>
                    <Reveal>
                        <p className="eyebrow text-accent text-center">
                            Bảng vàng dự đoán
                        </p>
                        <h2 className="mt-3 text-center font-display uppercase text-fg text-[clamp(34px,6vw,68px)] leading-[0.86] tracking-tight">
                            Thánh dự đoán
                        </h2>
                    </Reveal>

                    {leaderboard.length === 0 ? (
                        <Reveal className="mt-8">
                            <p className="text-center text-muted2">
                                Chưa có ai trên bảng — pick vài trận để lên bảng
                                vàng nào!
                            </p>
                        </Reveal>
                    ) : (
                        <div className="mt-10 flex items-end justify-center gap-4 sm:gap-8">
                            {[leaderboard[1], leaderboard[0], leaderboard[2]]
                                .filter(Boolean)
                                .map((row, idx) => {
                                    const isFirst =
                                        row.user_id === leaderboard[0].user_id;
                                    return (
                                        <Reveal
                                            key={row.user_id}
                                            delay={idx * 0.15}
                                            className="text-center">
                                            <div
                                                className={`mx-auto flex items-center justify-center overflow-hidden rounded-full border bg-card ${
                                                    isFirst
                                                        ? 'h-24 w-24 border-2 border-accent text-5xl'
                                                        : 'h-18 w-18 border-hairline text-4xl'
                                                }`}>
                                                <Avatar value={row.avatar} />
                                            </div>
                                            <div className="mt-3 font-semibold text-fg max-w-24 truncate mx-auto">
                                                {row.username}
                                            </div>
                                            <div className="font-display tabular-nums text-accent text-2xl leading-none">
                                                {row.win_rate ?? 0}%
                                            </div>
                                            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted2">
                                                {row.correct_picks}/
                                                {row.total_picks} trận
                                            </div>
                                        </Reveal>
                                    );
                                })}
                        </div>
                    )}

                    <Reveal className="mt-8 text-center">
                        <Link
                            href="/leaderboard"
                            className="inline-block font-mono text-[12px] uppercase tracking-wider text-accent hover:underline">
                            Xem BXH đầy đủ →
                        </Link>
                    </Reveal>
                </section>
            </div>
        </div>
    );
}
