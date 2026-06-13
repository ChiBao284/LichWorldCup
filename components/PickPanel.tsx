'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { supabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import AvatarStack from '@/components/AvatarStack';
import type { Match, Pick } from '@/lib/types';

/** Lấy danh sách pick của một trận (kèm profile người pick). */
async function fetchPicks(matchId: number): Promise<Pick[]> {
    const { data } = await supabaseBrowser()
        .from('picks')
        .select('*, profiles(*)')
        .eq('match_id', matchId)
        .order('created_at');
    return (data as Pick[]) ?? [];
}

/**
 * Panel pick đội yêu thích cho một trận đấu.
 * Realtime: avatar mọi người + % chọn mỗi đội cập nhật trực tiếp.
 */
export default function PickPanel({ match }: { match: Match }) {
    const { user, signInWithGoogle } = useUser();
    const [picks, setPicks] = useState<Pick[]>([]);
    const [saving, setSaving] = useState(false);

    const locked = match.status === 'finished';
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
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'picks',
                    filter: `match_id=eq.${match.id}`,
                },
                () => fetchPicks(match.id).then(setPicks),
            )
            .subscribe();
        return () => {
            supabaseBrowser().removeChannel(channel);
        };
    }, [match.id]);

    const { homePicks, awayPicks, homePct, awayPct } = useMemo(() => {
        const h = picks.filter((p) => p.team_id === match.home_team_id);
        const a = picks.filter((p) => p.team_id === match.away_team_id);
        const total = h.length + a.length;
        return {
            homePicks: h,
            awayPicks: a,
            homePct: total ? Math.round((h.length / total) * 100) : 50,
            awayPct: total ? 100 - Math.round((h.length / total) * 100) : 50,
        };
    }, [picks, match.home_team_id, match.away_team_id]);

    const myPick = user ? picks.find((p) => p.user_id === user.id) : undefined;

    async function pick(teamId: string | null) {
        if (!teamId || locked || saving) return;
        if (!user) {
            signInWithGoogle();
            return;
        }
        setSaving(true);
        await supabaseBrowser()
            .from('picks')
            .upsert(
                { match_id: match.id, user_id: user.id, team_id: teamId },
                { onConflict: 'match_id,user_id' },
            );
        await loadPicks();
        setSaving(false);
    }

    if (!home || !away) return null;

    const sides = [
        { team: home, picksList: homePicks, pct: homePct },
        { team: away, picksList: awayPicks, pct: awayPct },
    ];

    return (
        <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-extrabold sm:text-lg">
                    🔥 Bạn đứng về phe nào?
                </h3>
                <span className="text-xs text-slate-400">
                    {picks.length} người đã pick
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {sides.map(({ team, picksList, pct }) => {
                    const isMine = myPick?.team_id === team.id;
                    return (
                        <button
                            key={team.id}
                            onClick={() => pick(team.id)}
                            disabled={locked || saving}
                            className={`group rounded-2xl border p-4 text-left transition-all ${
                                isMine
                                    ? 'border-neon bg-neon/10 shadow-[0_0_30px_-8px_rgba(0,255,135,0.5)]'
                                    : 'border-white/10 bg-white/[0.03] hover:border-neon/40'
                            } ${locked ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2 font-bold">
                                    <span className="text-2xl">
                                        {team.flag}
                                    </span>
                                    <span className="truncate">
                                        {team.name}
                                    </span>
                                </span>
                                {isMine && (
                                    <span className="rounded-full bg-neon px-2 py-0.5 text-[10px] font-black text-pitch">
                                        BẠN
                                    </span>
                                )}
                            </div>
                            <motion.div
                                key={pct}
                                initial={{ scale: 0.85, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="mb-3 text-3xl font-black tabular-nums text-gradient">
                                {pct}%
                            </motion.div>
                            <AvatarStack picks={picksList} />
                        </button>
                    );
                })}
            </div>

            {/* Thanh tỉ lệ % hai đội */}
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/5">
                <motion.div
                    className="bg-gradient-to-r from-neon to-ice"
                    animate={{ width: `${homePct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
                <motion.div
                    className="bg-gradient-to-r from-hot to-gold"
                    animate={{ width: `${awayPct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                <span>
                    {home.flag} {homePicks.length} người
                </span>
                <span>
                    {awayPicks.length} người {away.flag}
                </span>
            </div>

            {locked ? (
                <p className="mt-4 text-center text-xs text-slate-500">
                    Trận đã kết thúc — hết pick rồi nha 😉
                </p>
            ) : !user ? (
                <p className="mt-4 text-center text-xs text-slate-400">
                    Bấm vào một đội để{' '}
                    <button
                        onClick={signInWithGoogle}
                        className="font-bold text-neon underline">
                        đăng nhập Google
                    </button>{' '}
                    và pick
                </p>
            ) : null}
        </div>
    );
}
