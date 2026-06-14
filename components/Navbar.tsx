"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useUser } from "@/hooks/useUser";
import { isAnonymousName } from "@/lib/avatars";
import Avatar from "@/components/Avatar";

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
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1 font-mono font-bold tracking-wider text-fg"
        >
          <span className="text-sm">WORLDCUP</span>
          <span className="rounded bg-accent px-1.5 text-sm font-bold text-pitch">
            26
          </span>
        </Link>

        <div className="ml-2 flex flex-1 items-center gap-4 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap border-b-2 pb-0.5 font-mono text-[12px] uppercase tracking-wider transition-colors ${
                pathname === l.href
                  ? "border-accent text-fg"
                  : "border-transparent text-muted2 hover:text-fg"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-accent sm:flex">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
          LIVE
        </span>

        <div className="relative shrink-0">
          {loading ? (
            <div className="h-9 w-9 rounded-full shimmer" />
          ) : user && profile ? (
            <>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`flex items-center gap-2 rounded-full border border-hairline bg-card px-2.5 py-1.5 text-sm transition hover:border-fg/30 ${
                  isAnonymousName(profile.username) ? "ring-2 ring-accent" : ""
                }`}
                title={
                  isAnonymousName(profile.username)
                    ? "Bạn đang ẩn danh — bấm để đặt tên & chọn avatar!"
                    : profile.username
                }
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-soft text-base leading-none">
                  <Avatar value={profile.avatar} />
                </span>
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
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-hairline bg-card p-1.5 shadow-lg"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-soft"
                    >
                      ✏️ Đổi tên & avatar
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-soft"
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
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-pitch transition hover:opacity-90"
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
