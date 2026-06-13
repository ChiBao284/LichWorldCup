"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";

/** Theo dõi class `dark` trên <html> mà không gây setState-in-effect. */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

/** Nút chuyển sáng/tối, lưu lựa chọn vào localStorage. Mặc định: sáng. */
export default function ThemeToggle() {
  // getServerSnapshot = false ⇒ SSR luôn render theo giao diện sáng mặc định
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* bỏ qua nếu trình duyệt chặn localStorage */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={dark ? "Giao diện sáng" : "Giao diện tối"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-soft text-lg transition hover:border-accent/40"
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -40, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        {dark ? "🌙" : "☀️"}
      </motion.span>
    </button>
  );
}
