"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import Avatar from "@/components/Avatar";
import { formatTimeDate, matchMinuteAt } from "@/lib/format";
import type { Match, Pick } from "@/lib/types";

/**
 * Tỉ số tại một phút trận: đếm số bàn của mỗi đội có minute <= phút đó.
 * minute = null (pick trước giờ bóng lăn) → 0-0.
 */
function scoreAt(match: Match, minute: number | null): [number, number] {
  if (minute === null) return [0, 0];
  const h = (match.home_goals ?? []).filter((g) => g.minute <= minute).length;
  const a = (match.away_goals ?? []).filter((g) => g.minute <= minute).length;
  return [h, a];
}

/**
 * Modal nhật ký pick: liệt kê mọi người theo thứ tự thời gian, kèm
 * thời điểm pick và tỉ số trận tại đúng lúc đó.
 * Render qua portal ra <body> để không bị cha (overflow-hidden) cắt mất.
 */
export default function PickLogModal({
  match,
  picks,
  youId,
  onClose,
}: {
  match: Match;
  picks: Pick[];
  youId?: string;
  onClose: () => void;
}) {
  // Đóng bằng Esc + khoá cuộn nền khi mở.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const home = match.home_team;
  const away = match.away_team;
  // Cũ → mới cho đúng dòng thời gian (picks vốn đã sort theo created_at).
  const ordered = [...picks].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-hairline p-5">
          <div className="min-w-0">
            <h3 className="font-display text-xl uppercase leading-none tracking-tight">
              Nhật ký pick
            </h3>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-muted2">
              {ordered.length} người · tỉ số lúc pick ({home?.flag} nhà –{" "}
              {away?.flag} khách)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1 -mt-1 shrink-0 rounded-full px-2.5 py-1 text-lg text-muted2 transition hover:bg-soft hover:text-fg"
          >
            ✕
          </button>
        </div>

        {/* Danh sách */}
        {ordered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted2">
            Chưa có ai pick trận này.
          </p>
        ) : (
          <ul className="divide-y divide-hairline overflow-y-auto">
            {ordered.map((p) => {
              const isYou = !!youId && p.user_id === youId;
              const pickedHome = p.team_id === match.home_team_id;
              const team = pickedHome ? home : away;
              const minute = matchMinuteAt(match.kickoff_at, p.created_at);
              const [h, a] = scoreAt(match, minute);
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft text-base">
                    <Avatar value={p.profiles?.avatar} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
                      {p.profiles?.username ?? "Ẩn danh"}
                      {isYou && (
                        <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold text-pitch">
                          BẠN
                        </span>
                      )}
                    </p>
                    <p
                      className={`mt-0.5 truncate text-xs font-medium ${
                        pickedHome ? "text-home" : "text-away"
                      }`}
                    >
                      chọn {team?.flag} {team?.name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                      {minute === null ? "Trước trận" : `Phút ${minute}'`}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted3">
                      {formatTimeDate(p.created_at)}
                    </p>
                    <p className="mt-1 inline-block rounded-md bg-soft px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-fg">
                      {h} – {a}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
