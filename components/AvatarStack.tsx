"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Pick } from "@/lib/types";

const MAX_VISIBLE = 10;

/**
 * Dãy avatar hình tròn của những người đã pick một đội.
 * Hiển thị tối đa 10 người, còn lại gộp thành "+N".
 */
export default function AvatarStack({ picks }: { picks: Pick[] }) {
  const visible = picks.slice(0, MAX_VISIBLE);
  const extra = picks.length - visible.length;

  return (
    <div className="flex items-center -space-x-2.5">
      <AnimatePresence mode="popLayout">
        {visible.map((p) => (
          <motion.div
            key={p.user_id}
            layout
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            title={p.profiles?.username ?? "Ẩn danh"}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg bg-card text-base shadow-md"
          >
            {p.profiles?.avatar ?? "🙂"}
          </motion.div>
        ))}
        {extra > 0 && (
          <motion.div
            key="extra"
            layout
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="z-10 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-bg bg-gradient-to-br from-neon/80 to-ice/80 px-1 text-xs font-black text-pitch shadow-md"
            title={`Còn ${extra} người nữa`}
          >
            +{extra}
          </motion.div>
        )}
      </AnimatePresence>
      {picks.length === 0 && (
        <span className="text-xs text-muted3">Chưa có ai pick</span>
      )}
    </div>
  );
}
