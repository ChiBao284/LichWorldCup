'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { supabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';
import { useLiveScores } from '@/hooks/useLiveScores';
import { StatusBadge } from '@/components/MatchCard';
import MatchEvents from '@/components/MatchEvents';
import PickPanel from '@/components/PickPanel';
import DrinkSection from '@/components/DrinkSection';
import { STAGE_LABELS } from '@/lib/types';
import { formatFullDate } from '@/lib/format';
import type { GoalEvent, Match } from '@/lib/types';

export default function MatchDetailClient({
    match: initial,
}: {
    match: Match;
}) {
    const [match, setMatch] = useState(initial);

    /* Realtime tỉ số trận này */
    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        const channel = supabaseBrowser()
            .channel(`match-${initial.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                    filter: `id=eq.${initial.id}`,
                },
                (payload) =>
                    setMatch((m) => ({ ...m, ...(payload.new as Match) })),
            )
            .subscribe();
        return () => {
            supabaseBrowser().removeChannel(channel);
        };
    }, [initial.id]);

    /* Tỉ số trực tiếp từ ESPN — chỉ cập nhật score khi trận đang live */
    const liveScores = useLiveScores([match]);
    const ls = liveScores[match.id];

    const home = match.home_team;
    const away = match.away_team;
    const showScore = match.status !== 'scheduled';
    const homeScore = ls ? ls.home : match.home_score;
    const awayScore = ls ? ls.away : match.away_score;

    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
            <Link
                href="/schedule"
                className="text-sm text-muted2 hover:text-accent">
                ← Lịch thi đấu
            </Link>

            {/* Bảng tỉ số */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass relative overflow-hidden rounded-3xl p-8 sm:p-10 ${
                    match.status === 'live' ? 'border-red-500/30' : ''
                }`}>
                {match.status === 'live' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-hot/10" />
                )}
                <div className="relative">
                    <div className="mb-6 flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted2">
                            {STAGE_LABELS[match.stage]}
                            {match.group_name
                                ? ` · Bảng ${match.group_name}`
                                : ''}
                        </span>
                        <StatusBadge match={match} detail={ls?.detail} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <TeamBlock
                            flag={home?.flag}
                            name={
                                home?.name ??
                                match.home_placeholder ??
                                'Chưa xác định'
                            }
                            href={home ? `/teams/${home.id}` : undefined}
                        />
                        <div className="text-center">
                            {showScore ? (
                                <motion.div
                                    key={`${homeScore}-${awayScore}`}
                                    initial={{ scale: 1.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 14,
                                    }}
                                    className={`text-5xl font-black tabular-nums sm:text-7xl ${
                                        match.status === 'live'
                                            ? 'text-gradient-hot'
                                            : 'text-gradient'
                                    }`}>
                                    {homeScore}-{awayScore}
                                </motion.div>
                            ) : (
                                <div className="text-3xl font-black text-muted sm:text-5xl">
                                    VS
                                </div>
                            )}
                        </div>
                        <TeamBlock
                            flag={away?.flag}
                            name={
                                away?.name ??
                                match.away_placeholder ??
                                'Chưa xác định'
                            }
                            href={away ? `/teams/${away.id}` : undefined}
                        />
                    </div>

                    {/* Diễn biến trận đấu */}
                    {ls?.events?.length ? (
                        // Trận đang diễn ra: bàn thắng + thẻ vàng/đỏ từ ESPN
                        <MatchEvents events={ls.events} />
                    ) : (
                        showScore &&
                        ((match.home_goals?.length ?? 0) > 0 ||
                            (match.away_goals?.length ?? 0) > 0) && (
                            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-hairline pt-5 text-sm">
                                <GoalList
                                    goals={match.home_goals}
                                    align="left"
                                />
                                <GoalList
                                    goals={match.away_goals}
                                    align="right"
                                />
                            </div>
                        )
                    )}

                    <div className="mt-7 space-y-1 text-center text-sm text-muted2">
                        <p className="capitalize">
                            🗓 {formatFullDate(match.kickoff_at)} (giờ VN)
                        </p>
                        {match.venue && <p>📍 {match.venue}</p>}
                    </div>
                </div>
            </motion.div>

            {/* Pick đội */}
            {home && away && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}>
                    <PickPanel match={match} />
                </motion.div>
            )}

            {/* Góc đền nước (chỉ hiện khi trận kết thúc) */}
            {/* {home && away && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DrinkSection match={match} />
        </motion.div>
      )} */}
        </div>
    );
}

/** Danh sách bàn thắng của một đội. */
function GoalList({
    goals,
    align,
}: {
    goals?: GoalEvent[] | null;
    align: 'left' | 'right';
}) {
    if (!goals || goals.length === 0) return <div />;
    return (
        <ul
            className={`space-y-1.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
            {goals.map((g, i) => (
                <li
                    key={`${g.name}-${g.minute}-${i}`}
                    className={`flex items-center gap-1.5 ${
                        align === 'right' ? 'flex-row-reverse' : ''
                    }`}>
                    <span>⚽</span>
                    <span className="font-semibold">
                        {g.name}
                        <span className="ml-1 font-mono text-xs text-muted2">
                            {g.minute}&apos;
                        </span>
                        {g.penalty && (
                            <span className="ml-1 text-xs text-muted2">
                                (pen)
                            </span>
                        )}
                        {g.owngoal && (
                            <span className="ml-1 text-xs text-muted2">
                                (OG)
                            </span>
                        )}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function TeamBlock({
    flag,
    name,
    href,
}: {
    flag?: string;
    name: string;
    href?: string;
}) {
    const content = (
        <div className="flex flex-1 flex-col items-center gap-3">
            <span className="text-6xl drop-shadow-xl sm:text-8xl">
                {flag ?? '🏳️'}
            </span>
            <span className="text-center text-base font-extrabold sm:text-xl">
                {name}
            </span>
        </div>
    );
    return href ? (
        <Link href={href} className="flex-1 transition hover:scale-105">
            {content}
        </Link>
    ) : (
        content
    );
}
