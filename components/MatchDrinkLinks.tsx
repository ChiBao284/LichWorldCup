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

/** Tên miền gọn của link (vd "shopeefood.vn") để hiển thị nhãn. */
function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

/**
 * Khu link nước nằm trong panel pick:
 * mọi người dán link quán nước (kèm chú thích), người khác bấm để mở/đặt.
 * Chủ link có thể tự sửa / xoá link của mình. Realtime.
 */
export default function MatchDrinkLinks({ matchId }: { matchId: number }) {
    const { user, signInWithGoogle } = useUser();
    const [links, setLinks] = useState<DrinkLink[]>([]);
    const [url, setUrl] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [showForm, setShowForm] = useState(false);

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
                    // KHÔNG lọc theo match_id: event DELETE chỉ chứa khoá chính
                    // (không có match_id) nên bộ lọc sẽ chặn mất event xoá →
                    // máy người khác không cập nhật. Lọc lại bằng fetchLinks(matchId).
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
        await supabaseBrowser()
            .from('drink_links')
            .insert({
                match_id: matchId,
                user_id: user.id,
                url: url.trim(),
                note: note.trim() || null,
            });
        setUrl('');
        setNote('');
        setShowForm(false); // gắn xong thì thu form lại
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

    // Còn link đầu tiên rồi thì mặc định ẩn form, chỉ hiện nút "+ Thêm link".
    const formOpen = showForm || links.length === 0;

    const inputClass =
        'w-full min-w-0 rounded-xl border border-hairline bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted3 focus:border-accent';

    return (
        <div className="mt-5 border-t border-hairline pt-4">
            <p className="eyebrow mb-3 flex items-center gap-1.5 text-[11px] text-muted2">
                🧋 Link nước — thua kèo thì khao
                {links.length > 0 && (
                    <span className="rounded-full bg-soft px-1.5 py-0.5 text-[10px] font-bold text-muted">
                        {links.length}
                    </span>
                )}
            </p>

            {/* Danh sách link — bấm để mở quán & đặt nước */}
            {links.length > 0 && (
                <ul className="mb-3 space-y-2.5">
                    <AnimatePresence initial={false}>
                        {links.map((l) => {
                            const mine = !!user && l.user_id === user.id;
                            const editing = editingId === l.id;
                            const host = hostOf(l.url);
                            return (
                                <motion.li
                                    key={l.id}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    className="overflow-hidden rounded-2xl border border-hairline bg-card/60 p-3 shadow-sm">
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
                                                className={inputClass}
                                            />
                                            <input
                                                value={editNote}
                                                onChange={(e) =>
                                                    setEditNote(e.target.value)
                                                }
                                                type="text"
                                                maxLength={120}
                                                placeholder="Chú thích (không bắt buộc)"
                                                className={inputClass}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        saveEdit(l.id)
                                                    }
                                                    disabled={
                                                        busy || !editUrl.trim()
                                                    }
                                                    className="flex-1 rounded-xl bg-accent px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-pitch transition hover:opacity-90 disabled:opacity-50">
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={busy}
                                                    className="rounded-xl border border-hairline px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted2 transition hover:text-fg">
                                                    Huỷ
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ----- Hiển thị link ----- */
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft text-base">
                                                    <Avatar
                                                        value={
                                                            l.profiles?.avatar
                                                        }
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
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
                                                            className="rounded-lg px-1.5 py-0.5 text-sm text-muted2 transition hover:bg-soft hover:text-fg">
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                remove(l.id)
                                                            }
                                                            disabled={busy}
                                                            title="Xoá link của bạn"
                                                            className="rounded-lg px-1.5 py-0.5 text-sm text-muted2 transition hover:bg-soft hover:text-live disabled:opacity-50">
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chú thích — nổi bật hơn */}
                                            {l.note ? (
                                                <p className="mt-2 border-l-2 border-accent/60 pl-2.5 text-sm font-medium leading-snug text-fg">
                                                    {l.note}
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-sm italic text-muted2">
                                                    Quán nước ngon, bấm đặt liền
                                                    👇
                                                </p>
                                            )}

                                            {host && (
                                                <p className="mt-1.5 truncate font-mono text-[11px] text-muted3">
                                                    🔗 {host}
                                                </p>
                                            )}

                                            {/* Nút đặt nước — highlight */}
                                            <a
                                                href={l.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-pitch shadow-md shadow-accent/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/40">
                                                🧋 Click vào đây để đặt nước →
                                            </a>
                                        </>
                                    )}
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}

            {/* Khu gắn link */}
            {!user ? (
                <button
                    onClick={signInWithGoogle}
                    className="font-mono text-sm text-accent hover:underline">
                    Đăng nhập để gắn link nước →
                </button>
            ) : (
                <AnimatePresence mode="wait" initial={false}>
                    {formOpen ? (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            onSubmit={submit}
                            className="space-y-2 rounded-2xl border border-hairline bg-card/40 p-3">
                            <input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                type="url"
                                autoFocus={links.length > 0}
                                placeholder="Dán link quán nước (GrabFood, ShopeeFood...)"
                                className={inputClass}
                            />
                            <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                type="text"
                                maxLength={120}
                                placeholder="Chú thích (vd: trà sữa size L, ship nhanh...)"
                                className={inputClass}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={busy || !url.trim()}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-pitch shadow-md shadow-accent/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/40 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none">
                                    {busy ? '...' : '🔗 LƯU LẠI'}
                                </button>
                                {links.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setUrl('');
                                            setNote('');
                                        }}
                                        className="rounded-xl border border-hairline px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-muted2 transition hover:text-fg">
                                        Huỷ
                                    </button>
                                )}
                            </div>
                        </motion.form>
                    ) : (
                        <motion.button
                            key="add"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(true)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-muted2 transition hover:border-accent hover:text-accent">
                            + Thêm link nước
                        </motion.button>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
