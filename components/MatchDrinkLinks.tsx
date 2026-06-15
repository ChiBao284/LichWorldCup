'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import Avatar from '@/components/Avatar';
import type { DrinkLink } from '@/lib/types';

/** Bucket Storage chứa ảnh QR chuyển khoản (xem supabase/05_drink_link_qr.sql). */
const QR_BUCKET = 'drink-qr';

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
 * Thu nhỏ ảnh QR về tối đa 800px cạnh dài rồi xuất PNG (giữ nét các ô QR,
 * file nhẹ ~vài chục KB). Trả về Blob để upload.
 */
async function compressQr(file: File): Promise<Blob> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('Không đọc được ảnh'));
        im.src = dataUrl;
    });
    const MAX = 800;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Nén ảnh thất bại'))),
            'image/png',
        ),
    );
}

/** Upload ảnh QR vào Storage, trả về public URL. */
async function uploadQr(file: File, userId: string): Promise<string> {
    const blob = await compressQr(file);
    const path = `${userId}/${crypto.randomUUID()}.png`;
    const sb = supabaseBrowser();
    const { error } = await sb.storage
        .from(QR_BUCKET)
        .upload(path, blob, { contentType: 'image/png', upsert: false });
    if (error) throw error;
    return sb.storage.from(QR_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Lấy path trong bucket từ public URL (để xoá ảnh cũ khi thay/xoá link). */
function qrPathFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const marker = `/${QR_BUCKET}/`;
    const i = url.indexOf(marker);
    return i === -1 ? null : url.slice(i + marker.length);
}

/** Xoá ảnh QR khỏi Storage (best-effort, bỏ qua lỗi). */
async function deleteQr(url: string | null | undefined): Promise<void> {
    const path = qrPathFromUrl(url);
    if (!path) return;
    await supabaseBrowser().storage.from(QR_BUCKET).remove([path]);
}

/**
 * Ô chọn ảnh QR dùng chung cho cả form thêm mới & form sửa.
 * Hiển thị preview + nút đổi/xoá, hoặc nút "thêm ảnh" khi chưa có.
 */
function QrField({
    previewSrc,
    onPick,
    onClear,
    disabled,
}: {
    previewSrc: string | null;
    onPick: (file: File) => void;
    onClear: () => void;
    disabled?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPick(f);
                    e.target.value = ''; // cho phép chọn lại cùng một file
                }}
            />
            {previewSrc ? (
                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-card p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewSrc}
                        alt="QR chuyển khoản"
                        className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain p-1"
                    />
                    <div className="flex flex-1 flex-col gap-1.5">
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => inputRef.current?.click()}
                            className="rounded-lg border border-hairline px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted2 transition hover:text-fg disabled:opacity-50">
                            Đổi ảnh
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={onClear}
                            className="rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted2 transition hover:text-live disabled:opacity-50">
                            Xoá ảnh
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted2 transition hover:border-accent hover:text-accent disabled:opacity-50">
                    📷 Thêm ảnh QR chuyển khoản (không bắt buộc)
                </button>
            )}
        </div>
    );
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
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Sửa link của chính mình
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editQrFile, setEditQrFile] = useState<File | null>(null); // ảnh QR mới chọn
    const [editQrUrl, setEditQrUrl] = useState<string | null>(null); // ảnh QR hiện có (null = đã xoá)

    // Preview ảnh QR (object URL của file đang chọn). Nhớ thu hồi để khỏi rò bộ nhớ.
    const qrPreview = useMemo(
        () => (qrFile ? URL.createObjectURL(qrFile) : null),
        [qrFile],
    );
    useEffect(() => {
        return () => {
            if (qrPreview) URL.revokeObjectURL(qrPreview);
        };
    }, [qrPreview]);

    const editQrNewPreview = useMemo(
        () => (editQrFile ? URL.createObjectURL(editQrFile) : null),
        [editQrFile],
    );
    useEffect(() => {
        return () => {
            if (editQrNewPreview) URL.revokeObjectURL(editQrNewPreview);
        };
    }, [editQrNewPreview]);
    // Form sửa hiển thị: ảnh mới chọn (nếu có) > ảnh hiện tại.
    const editQrPreview = editQrNewPreview ?? editQrUrl;

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
        try {
            const qr_url = qrFile ? await uploadQr(qrFile, user.id) : null;
            await supabaseBrowser()
                .from('drink_links')
                .insert({
                    match_id: matchId,
                    user_id: user.id,
                    url: url.trim(),
                    note: note.trim() || null,
                    qr_url,
                });
            setUrl('');
            setNote('');
            setQrFile(null);
            setShowForm(false); // gắn xong thì thu form lại
        } catch (err) {
            console.error(err);
            alert('Tải ảnh QR thất bại, thử lại nhé.');
        } finally {
            setBusy(false);
        }
    }

    function startEdit(l: DrinkLink) {
        setEditingId(l.id);
        setEditUrl(l.url);
        setEditNote(l.note ?? '');
        setEditQrFile(null);
        setEditQrUrl(l.qr_url ?? null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditUrl('');
        setEditNote('');
        setEditQrFile(null);
        setEditQrUrl(null);
    }

    async function saveEdit(id: number) {
        if (!user || !editUrl.trim() || busy) return;
        setBusy(true);
        try {
            const url = editUrl.trim();
            const note = editNote.trim() || null;
            const original = links.find((l) => l.id === id);
            // Ảnh mới chọn > giữ ảnh hiện tại (editQrUrl đã =null nếu người dùng xoá).
            const qr_url = editQrFile
                ? await uploadQr(editQrFile, user.id)
                : editQrUrl;
            // Cập nhật ngay cho mượt, realtime sẽ đồng bộ lại sau.
            setLinks((prev) =>
                prev.map((l) =>
                    l.id === id ? { ...l, url, note, qr_url } : l,
                ),
            );
            await supabaseBrowser()
                .from('drink_links')
                .update({ url, note, qr_url })
                .eq('id', id);
            // Dọn ảnh cũ trên Storage nếu đã thay hoặc đã xoá.
            if (original?.qr_url && original.qr_url !== qr_url) {
                await deleteQr(original.qr_url);
            }
            cancelEdit();
        } catch (err) {
            console.error(err);
            alert('Lưu thất bại, thử lại nhé.');
        } finally {
            setBusy(false);
        }
    }

    async function remove(id: number) {
        if (busy) return;
        if (!confirm('Xoá link nước này?')) return;
        setBusy(true);
        const original = links.find((l) => l.id === id);
        setLinks((prev) => prev.filter((l) => l.id !== id));
        await supabaseBrowser().from('drink_links').delete().eq('id', id);
        if (original?.qr_url) await deleteQr(original.qr_url); // dọn ảnh QR kèm theo
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
                                            <QrField
                                                previewSrc={editQrPreview}
                                                onPick={setEditQrFile}
                                                onClear={() => {
                                                    setEditQrFile(null);
                                                    setEditQrUrl(null);
                                                }}
                                                disabled={busy}
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

                                            {/* QR chuyển khoản — bấm để xem lớn */}
                                            {l.qr_url && (
                                                <a
                                                    href={l.qr_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-hairline bg-card/60 p-2 transition hover:border-accent">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={l.qr_url}
                                                        alt="QR chuyển khoản"
                                                        className="h-40 w-40 shrink-0 rounded-lg bg-white object-contain p-1"
                                                    />
                                                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted2">
                                                        📱 Quét QR để chuyển
                                                        khoản
                                                        <span className="mt-0.5 block font-normal normal-case text-muted3">
                                                            Bấm để xem ảnh lớn
                                                        </span>
                                                    </span>
                                                </a>
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
                            <QrField
                                previewSrc={qrPreview}
                                onPick={setQrFile}
                                onClear={() => setQrFile(null)}
                                disabled={busy}
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
                                            setQrFile(null);
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
