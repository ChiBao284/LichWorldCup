import type { MatchEvent } from "@/hooks/useLiveScores";

/** Icon cho từng loại sự kiện. */
function eventIcon(e: MatchEvent): string {
  if (e.kind === "yellow") return "🟨";
  if (e.kind === "red") return "🟥";
  return "⚽"; // bàn thắng
}

/** Hậu tố: (P) penalty, (OG) phản lưới. */
function suffix(e: MatchEvent): string {
  if (e.kind !== "goal") return "";
  if (e.ownGoal) return " (OG)";
  if (e.penalty) return " (P)";
  return "";
}

function EventRow({ e, align }: { e: MatchEvent; align: "left" | "right" }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="shrink-0 text-sm leading-none">{eventIcon(e)}</span>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted2">
        {e.minute}
      </span>
      <span className="truncate font-medium text-fg">
        {e.player || "—"}
        {suffix(e)}
      </span>
    </li>
  );
}

/**
 * Diễn biến trận đấu trực tiếp: bàn thắng + thẻ vàng/đỏ.
 * Cột trái = đội nhà, cột phải = đội khách (theo thời gian).
 */
export default function MatchEvents({ events }: { events: MatchEvent[] }) {
  if (!events.length) return null;
  const home = events.filter((e) => e.side === "home");
  const away = events.filter((e) => e.side === "away");

  return (
    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-hairline pt-5 text-sm">
      <ul className="min-w-0 space-y-2">
        {home.map((e, i) => (
          <EventRow key={`h-${i}`} e={e} align="left" />
        ))}
      </ul>
      <ul className="min-w-0 space-y-2">
        {away.map((e, i) => (
          <EventRow key={`a-${i}`} e={e} align="right" />
        ))}
      </ul>
    </div>
  );
}
