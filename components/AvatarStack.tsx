"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Pick } from "@/lib/types";
import Avatar from "@/components/Avatar";
import { formatTimeDate, matchMinuteAt } from "@/lib/format";

const MAX_VISIBLE = 10;

/**
 * Tooltip cho 1 avatar: tên + thời gian pick + số phút trận tại lúc pick.
 * Dùng thuộc tính title (nhiều dòng qua "\n") vì nút cha có overflow-hidden
 * sẽ cắt mất tooltip tuỳ chỉnh.
 */
function pickTooltip(p: Pick, kickoffAt?: string): string {
  const name = p.profiles?.username ?? "Ẩn danh";
  const lines = [name, `🕐 ${formatTimeDate(p.created_at)}`];
  if (kickoffAt) {
    const min = matchMinuteAt(kickoffAt, p.created_at);
    lines.push(min === null ? "⏱️ Pick trước trận" : `⏱️ Phút ${min}'`);
  }
  return lines.join("\n");
}

/**
 * Dãy avatar hình tròn của những người đã pick một đội.
 * Hiển thị tối đa 10 người, còn lại gộp thành "+N".
 * Avatar của chính người dùng (youId) được viền đỏ và đẩy lên đầu stack.
 * Hover một avatar sẽ hiện thời gian pick + số phút trận tại lúc đó (cần kickoffAt).
 */
export default function AvatarStack({
  picks,
  youId,
  kickoffAt,
}: {
  picks: Pick[];
  youId?: string;
  kickoffAt?: string;
}) {
  // Đưa avatar của mình lên đầu stack (z cao) nhưng KHÔNG đổi dữ liệu gốc.
  const ordered = youId
    ? [...picks].sort((a, b) => {
        if (a.user_id === youId) return -1;
        if (b.user_id === youId) return 1;
        return 0;
      })
    : picks;

  const visible = ordered.slice(0, MAX_VISIBLE);
  const extra = ordered.length - visible.length;

  return (
    <div className="flex items-center -space-x-2.5">
      <AnimatePresence mode="popLayout">
        {visible.map((p, i) => {
          const isYou = !!youId && p.user_id === youId;
          return (
            <motion.div
              key={p.user_id}
              layout
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              title={pickTooltip(p, kickoffAt)}
              className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 bg-card text-base shadow-sm ${
                isYou
                  ? "z-30 border-accent ring-2 ring-accent"
                  : "border-bg"
              }`}
              style={{ zIndex: isYou ? 30 : MAX_VISIBLE - i }}
            >
              <Avatar value={p.profiles?.avatar} />
            </motion.div>
          );
        })}
        {extra > 0 && (
          <motion.div
            key="extra"
            layout
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="z-10 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-bg bg-fg px-1 font-mono text-[11px] font-bold text-pitch shadow-sm"
            title={`Còn ${extra} người nữa`}
          >
            +{extra}
          </motion.div>
        )}
      </AnimatePresence>
      {ordered.length === 0 && (
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted3">
          Chưa có ai pick
        </span>
      )}
    </div>
  );
}
