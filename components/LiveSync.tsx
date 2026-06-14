"use client";

import { useEffect } from "react";

/**
 * Cứ mỗi 90s gọi /api/sync để kéo dữ liệu mới nhất từ worldcup.json về Supabase.
 * Sau khi DB cập nhật, các trang đang mở sẽ tự thấy thay đổi nhờ Supabase Realtime.
 */
export default function LiveSync() {
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const data = await res.json().catch(() => null);
        if (data?.error || data?.skipped) {
          console.warn("[LiveSync] sync chưa chạy:", data.error ?? data.skipped);
        }
      } catch {
        /* offline / lỗi mạng — bỏ qua, lần sau thử lại */
      }
    };
    run(); // chạy ngay khi mở app
    const timer = setInterval(run, 90_000);
    const onFocus = () => run();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
