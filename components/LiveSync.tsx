"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Cứ mỗi 90s gọi /api/sync để kéo dữ liệu mới nhất từ worldcup.json về Supabase.
 * Sau khi sync, gọi router.refresh() để server re-render với dữ liệu mới nhất —
 * tránh race condition khi Realtime WebSocket chưa kịp subscribe khi mới mở trang.
 */
export default function LiveSync() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    const run = async (andRefresh = false) => {
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const data = await res.json().catch(() => null);
        if (data?.error || data?.skipped) {
          console.warn("[LiveSync] sync chưa chạy:", data.error ?? data.skipped);
        }
        if (andRefresh) routerRef.current.refresh();
      } catch {
        /* offline / lỗi mạng — bỏ qua, lần sau thử lại */
      }
    };
    run(true); // mở app: sync + refresh để lấy dữ liệu mới nhất từ server
    const timer = setInterval(() => run(), 90_000);
    const onFocus = () => run(true); // quay lại tab: refresh luôn
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
