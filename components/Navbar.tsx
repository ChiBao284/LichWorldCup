"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useUser } from "@/hooks/useUser";
import { isAnonymousName } from "@/lib/avatars";

const LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/schedule", label: "Lịch đấu" },
  { href: "/bracket", label: "Nhánh đấu" },
  { href: "/teams", label: "Đội tuyển" },
  { href: "/leaderboard", label: "BXH" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, loading, signInWithGoogle, signOut } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-x-0 border-t-0">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-black">
          <span className="text-xl animate-spin-slow inline-block">⚽</span>
          <span className="text-gradient text-lg tracking-tight">WC26</span>
        </Link>

        <div className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-neon/15 text-neon"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="relative shrink-0">
          {loading ? (
            <div className="h-9 w-9 rounded-full shimmer" />
          ) : user && profile ? (
            <>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm transition hover:border-neon/40 ${
                  isAnonymousName(profile.username) ? "ring-2 ring-hot/60" : ""
                }`}
                title={
                  isAnonymousName(profile.username)
                    ? "Bạn đang ẩn danh — bấm để đặt tên & chọn avatar!"
                    : profile.username
                }
              >
                <span className="text-lg leading-none">{profile.avatar}</span>
                <span className="hidden max-w-28 truncate font-medium sm:block">
                  {profile.username}
                </span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="glass absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-white/5"
                    >
                      ✏️ Đổi tên & avatar
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                    >
                      👋 Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-neon to-ice px-4 py-1.5 text-sm font-bold text-pitch transition hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                  fill="currentColor"
                  d="M21.35 11.1H12v2.9h5.3c-.5 2.5-2.6 4.2-5.3 4.2a5.7 5.7 0 1 1 0-11.4c1.4 0 2.7.5 3.7 1.4l2.1-2.1A8.6 8.6 0 1 0 12 20.6c4.9 0 8.6-3.5 8.6-8.6 0-.3 0-.6-.1-.9z"
                />
              </svg>
              Đăng nhập
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
