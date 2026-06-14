"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Avatar from "@/components/Avatar";
import type { DrinkLink } from "@/lib/types";

/** Lấy danh sách link nước của một trận (kèm người gắn). */
async function fetchLinks(matchId: number): Promise<DrinkLink[]> {
  const { data } = await supabaseBrowser()
    .from("drink_links")
    .select("*, profiles(*)")
    .eq("match_id", matchId)
    .order("created_at");
  return (data as DrinkLink[]) ?? [];
}

/**
 * Khu link nước gọn nằm trong panel pick:
 * mọi người dán link quán nước, người khác bấm để mở/đặt. Realtime.
 */
export default function MatchDrinkLinks({ matchId }: { matchId: number }) {
  const { user, signInWithGoogle } = useUser();
  const [links, setLinks] = useState<DrinkLink[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchLinks(matchId).then(setLinks);
    const channel = supabaseBrowser()
      .channel(`drinklinks-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drink_links",
          filter: `match_id=eq.${matchId}`,
        },
        () => fetchLinks(matchId).then(setLinks)
      )
      .subscribe();
    return () => {
      supabaseBrowser().removeChannel(channel);
    };
  }, [matchId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      signInWithGoogle();
      return;
    }
    if (!url.trim() || busy) return;
    setBusy(true);
    await supabaseBrowser().from("drink_links").insert({
      match_id: matchId,
      user_id: user.id,
      url: url.trim(),
    });
    setUrl("");
    setBusy(false);
  }

  return (
    <div className="mt-5 border-t border-hairline pt-4">
      <p className="eyebrow mb-2 text-[11px] text-muted2">
        🧋 Link nước — thua kèo thì khao
      </p>

      {/* Danh sách link — bấm để mở quán & đặt nước */}
      {links.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          <AnimatePresence>
            {links.map((l) => (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft text-base">
                  <Avatar value={l.profiles?.avatar} />
                </span>
                <span className="min-w-0 flex-1 truncate text-muted2">
                  {l.profiles?.username ?? "Ẩn danh"}
                </span>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-accent px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-pitch transition hover:opacity-90"
                >
                  Đặt nước →
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Ô dán link — mọi người đăng nhập đều gắn được */}
      {user ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="Dán link quán nước (GrabFood, ShopeeFood...)"
            className="min-w-0 flex-1 rounded-xl border border-hairline bg-card px-3 py-2 text-sm outline-none placeholder:text-muted3 focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="shrink-0 rounded-xl bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-pitch transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "..." : "Gắn"}
          </button>
        </form>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="font-mono text-sm text-accent hover:underline"
        >
          Đăng nhập để gắn link nước →
        </button>
      )}
    </div>
  );
}
