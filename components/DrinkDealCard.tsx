/**
 * Card "giờ vàng đặt nước" — hiện dưới khu vực đội bóng ở thẻ trận sắp đá.
 * Vòng đếm ngược tới giờ bóng lăn + lời mời đặt nước. Thuần trang trí
 * (pointer-events-none) để click rơi xuống Link phủ toàn thẻ → vào trang trận.
 */

/** Cửa sổ "đặt nước trước trận" — khớp SOON_MS (30') ở HomeClient. */
const DEAL_WINDOW_MIN = 30;

export default function DrinkDealCard({
    minutesLeft,
}: {
    minutesLeft: number;
}) {
    const left = Math.max(0, minutesLeft);
    const frac = Math.max(0, Math.min(1, left / DEAL_WINDOW_MIN));
    const R = 52;
    const C = 2 * Math.PI * R;

    return (
        <div className="pointer-events-none relative mt-6 flex flex-col items-center gap-4 rounded-2xl border border-hairline bg-soft/60 px-6 py-7 text-center">
            {/* Vòng đếm ngược */}
            <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle
                        cx="60"
                        cy="60"
                        r={R}
                        fill="none"
                        stroke="var(--hairline)"
                        strokeWidth="9"
                    />
                    <circle
                        cx="60"
                        cy="60"
                        r={R}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={C}
                        strokeDashoffset={C * (1 - frac)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display tabular-nums leading-none text-accent text-[44px]">
                        {left}′
                    </span>
                    <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted2">
                        phút nữa
                    </span>
                </div>
            </div>

            {/* Tiêu đề + mô tả */}
            <h4 className="font-display uppercase leading-[0.95] text-fg text-2xl">
                Còn {left}′ · Đặt nước đi
            </h4>
            <p className="max-w-xs text-sm text-muted2">
                Đừng bỏ lỡ — Full topping đi 🧋
            </p>
        </div>
    );
}
