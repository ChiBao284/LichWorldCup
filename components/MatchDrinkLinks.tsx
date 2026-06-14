'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import Avatar from '@/components/Avatar';
import type { DrinkLink } from '@/lib/types';

/** Lấy danh sách link nước của một trận (kèm người gắn). */
async function fetchLinks(matchId: number): Promise<DrinkLink[]> {
    const { data } = await supabaseBrowser()
        .from('drink_links')
        .select('*, profiles(*)')
        .eq('match_id', matchId)
        .order('created_at');
    return (data as DrinkLink[]) ?? [];
}

/**
 * Khu link nước gọn nằm trong panel pick:
 * mọi người dán link quán nước (kèm chú thích), người khác bấm để mở/đặt.
 * Chủ link có thể tự sửa / xoá link của mình. Realtime.
 */
export default function MatchDrinkLinks({ matchId }: { matchId: number }) {
    const { user, signInWithGoogle } = useUser();
    const [links, setLinks] = useState<DrinkLink[]>([]);
    const [url, setUrl] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);

    // Sửa link của chính mình
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editNote, setEditNote] = useState('');

    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        fetchLinks(matchId).then(setLinks);
        const channel = supabaseBrowser()
            .channel(`drinklinks-${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'drink_links',
                    filter: `match_id=eq.${matchId}`,
                },
                () => fetchLinks(matchId).then(setLinks),
            )
            .subscribe();
        return () => {
            supabaseBrowser().removeChannel(channel);
        };
    }, [matchId]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) {
            signInWithGoogle();
            return;
        }
        if (!url.trim() || busy) return;
        setBusy(true);
        await supabaseBrowser().from('drink_links').insert({
            match_id: matchId,
            user_id: user.id,
            url: url.trim(),
            note: note.trim() || null,
        });
        setUrl('');
        setNote('');
        setBusy(false);
    }

    function startEdit(l: DrinkLink) {
        setEditingId(l.id);
        setEditUrl(l.url);
        setEditNote(l.note ?? '');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditUrl('');
        setEditNote('');
    }

    async function saveEdit(id: number) {
        if (!editUrl.trim() || busy) return;
        setBusy(true);
        const url = editUrl.trim();
        const note = editNote.trim() || null;
        // Cập nhật ngay cho mượt, realtime sẽ đồng bộ lại sau.
        setLinks((prev) =>
            prev.map((l) => (l.id === id ? { ...l, url, note } : l)),
        );
        await supabaseBrowser()
            .from('drink_links')
            .update({ url, note })
            .eq('id', id);
        cancelEdit();
        setBusy(false);
    }

    async function remove(id: number) {
        if (busy) return;
        if (!confirm('Xoá link nước này?')) return;
        setBusy(true);
        setLinks((prev) => prev.filter((l) => l.id !== id));
        await supabaseBrowser().from('drink_links').delete().eq('id', id);
        if (editingId === id) cancelEdit();
        setBusy(false);
    }

    return (
        <div className="mt-5 border-t border-hairline pt-4">
            <p className="eyebrow mb-2 text-[11px] text-muted2">
                🧋 Link nước — thua kèo thì khao
            </p>

            {/* Danh sách link — bấm để mở quán & đặt nước */}
            {links.length > 0 && (
                <ul className="mb-3 space-y-2">
                    <AnimatePresence>
                        {links.map((l) => {
                            const mine = !!user && l.user_id === user.id;
                            const editing = editingId === l.id;
                            return (
                                <motion.li
                                    key={l.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-xl border border-hairline bg-card/40 p-2.5">
                                    {editing ? (
                                        /* ----- Chế độ sửa link của mình ----- */
                                        <div className="space-y-2">
                                            <input
                                                value={editUrl}
                                                onChange={(e) =>
                                                    setEditUrl(e.target.value)
                                                }
                                                type="url"
                                                placeholder="Link quán nước"
                                                className="w-full rounded-lg border border-hairline bg-card px-2.5 py-1.5 text-sm outline-none placeholder:text-muted3 focus:border-accent"
                                            />
                                            <input
                                                value={editNote}
                                                onChange={(e) =>
                                                    setEditNote(e.target.value)
                                                }
                                                type="text"
                                                maxLength={120}
                                                placeholder="Chú thích (không bắt buộc)"
                                                className="w-full rounded-lg border border-hairline bg-card px-2.5 py-1.5 text-sm outline-none placeholder:text-muted3 focus:border-accent"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveEdit(l.id)}
                                                    disabled={
                                                        busy || !editUrl.trim()
                                                    }
                                                    className="rounded-lg bg-accent px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-pitch transition hover:opacity-90 disabled:opacity-50">
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={busy}
                                                    className="rounded-lg border border-hairline px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted2 transition hover:text-fg">
                                                    Huỷ
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ----- Hiển thị link ----- */
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft text-base">
                                                    <Avatar
                                                        value={l.profiles?.avatar}
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-sm text-muted2">
                                                    {l.profiles?.username ??
                                                        'Ẩn danh'}
                                                </span>
                                                {mine && (
                                                    <div className="flex shrink-0 gap-1">
                                                        <button
                                                            onClick={() =>
                                                                startEdit(l)
                                                            }
                                                            title="Sửa link của bạn"
                                                            className="rounded-md px-1.5 py-0.5 text-sm text-muted2 transition hover:bg-soft hover:text-fg">
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                remove(l.id)
                                                            }
                                                            disabled={busy}
                                                            title="Xoá link của bạn"
                                                            className="rounded-md px-1.5 py-0.5 text-sm text-muted2 transition hover:bg-soft hover:text-live disabled:opacity-50">
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {l.note && (
                                                <p className="mt-1.5 text-sm text-muted">
                                                    {l.note}
                                                </p>
                                            )}

                                            <a
                                                href={l.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-block rounded-full bg-accent px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-pitch transition hover:opacity-90">
                                                Click vào đây để đặt nước →
                                            </a>
                                        </>
                                    )}
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}

            {/* Ô dán link — mọi người đăng nhập đều gắn được */}
            {user ? (
                <form onSubmit={submit} className="space-y-2">
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        type="url"
                        placeholder="Dán link quán nước (GrabFood, ShopeeFood...)"
                        className="w-full min-w-0 rounded-xl border border-hairline bg-card px-3 py-2 text-sm outline-none placeholder:text-muted3 focus:border-accent"
                    />
                    <div className="flex gap-2">
                        <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            type="text"
                            maxLength={120}
                            placeholder="Chú thích (vd: gần sân, ship nhanh...) — không bắt buộc"
                            className="min-w-0 flex-1 rounded-xl border border-hairline bg-card px-3 py-2 text-sm outline-none placeholder:text-muted3 focus:border-accent"
                        />
                        <button
                            type="submit"
                            disabled={busy || !url.trim()}
                            className="shrink-0 rounded-xl bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-pitch transition hover:opacity-90 disabled:opacity-50">
                            {busy ? '...' : 'Gắn'}
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={signInWithGoogle}
                    className="font-mono text-sm text-accent hover:underline">
                    Đăng nhập để gắn link nước →
                </button>
            )}
        </div>
    );
}
