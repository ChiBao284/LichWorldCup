/** Link xem trực tiếp trên VTV3 (vtvgo) — World Cup phát sóng trên VTV3. */
export const VTV3_LIVE_URL = 'https://vtvgo.vn/channel/vtv3-1,3.html';

/**
 * Nút "Xem trực tiếp trên VTV3" — chỉ hiện cho trận đang diễn ra.
 * Mở vtvgo ở tab mới để xem kênh VTV3 đang phát sóng.
 */
export default function WatchLiveButton({
    className = '',
    size = 'md',
}: {
    className?: string;
    /** sm: nút nhỏ vừa nội dung (đặt trên thẻ live) · md: nút lớn (trang chi tiết). */
    size?: 'sm' | 'md';
}) {
    const sizeClass =
        size === 'sm' ? 'px-3 py-2.5 text-[8px]' : 'px-5 py-3.5 text-sm';
    return (
        <a
            href={VTV3_LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-full bg-accent font-mono font-bold uppercase tracking-wider text-pitch shadow-md shadow-accent/40 ring-2 ring-accent/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/50 ${sizeClass} ${className}`}>
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-pitch" />
            Link xem trực tiếp →
        </a>
    );
}
