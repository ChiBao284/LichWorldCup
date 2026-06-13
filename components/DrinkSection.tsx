"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import type { DrinkLink, DrinkOrder, Match, Pick } from "@/lib/types";

type DrinkData = {
  links: DrinkLink[];
  orders: DrinkOrder[];
  myPick: Pick | null;
};

/** Lấy link nước + đơn đặt + pick của user cho một trận. */
async function fetchDrinkData(matchId: number, userId?: string): Promise<DrinkData> {
  const supabase = supabaseBrowser();
  const [linksRes, myPickRes] = await Promise.all([
    supabase
      .from("drink_links")
      .select("*, profiles(*)")
      .eq("match_id", matchId)
      .order("created_at"),
    userId
      ? supabase
          .from("picks")
          .select("*")
          .eq("match_id", matchId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const links = (linksRes.data as DrinkLink[]) ?? [];

  let orders: DrinkOrder[] = [];
  if (links.length) {
    const { data } = await supabase
      .from("drink_orders")
      .select("*, profiles(*)")
      .in(
        "link_id",
        links.map((l) => l.id)
      )
      .order("created_at");
    orders = (data as DrinkOrder[]) ?? [];
  }
  return { links, orders, myPick: (myPickRes.data as Pick) ?? null };
}

/**
 * Khu vực "đền nước" sau trận: ai pick đội thua thì nhập link quán nước,
 * người khác vào đặt món. Realtime toàn bộ.
 */
export default function DrinkSection({ match }: { match: Match }) {
  const { user, signInWithGoogle } = useUser();
  const [links, setLinks] = useState<DrinkLink[]>([]);
  const [orders, setOrders] = useState<DrinkOrder[]>([]);
  const [myPick, setMyPick] = useState<Pick | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [orderDrafts, setOrderDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  const isDraw = match.home_score === match.away_score;
  const loserTeamId = isDraw
    ? null
    : match.home_score < match.away_score
      ? match.home_team_id
      : match.away_team_id;
  const loserTeam =
    loserTeamId === match.home_team_id ? match.home_team : match.away_team;
  const iLost = Boolean(user && myPick && loserTeamId && myPick.team_id === loserTeamId);

  const apply = useCallback((d: DrinkData) => {
    setLinks(d.links);
    setOrders(d.orders);
    setMyPick(d.myPick);
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchDrinkData(match.id, userId).then(apply);
    const channel = supabaseBrowser()
      .channel(`drinks-${match.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drink_links", filter: `match_id=eq.${match.id}` },
        () => fetchDrinkData(match.id, userId).then(apply)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drink_orders" },
        () => fetchDrinkData(match.id, userId).then(apply)
      )
      .subscribe();
    return () => {
      supabaseBrowser().removeChannel(channel);
    };
  }, [match.id, userId, apply]);

  async function submitLink(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !url.trim() || busy) return;
    setBusy(true);
    await supabaseBrowser().from("drink_links").insert({
      match_id: match.id,
      user_id: user.id,
      url: url.trim(),
      note: note.trim() || null,
    });
    setUrl("");
    setNote("");
    setBusy(false);
  }

  async function submitOrder(linkId: number) {
    const item = orderDrafts[linkId]?.trim();
    if (!item || busy) return;
    if (!user) {
      signInWithGoogle();
      return;
    }
    setBusy(true);
    await supabaseBrowser().from("drink_orders").insert({
      link_id: linkId,
      user_id: user.id,
      item,
    });
    setOrderDrafts((d) => ({ ...d, [linkId]: "" }));
    setBusy(false);
  }

  const finished = match.status === "finished";

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-lg font-extrabold">🧋 Góc đền nước</h3>
        {links.length > 0 && (
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-bold text-muted2">
            {links.length} link
          </span>
        )}
      </div>

      {/* Lời dẫn theo ngữ cảnh trận đấu */}
      {finished && !isDraw ? (
        <p className="mb-4 text-sm text-muted2">
          Đội thua: {loserTeam?.flag} <b>{loserTeam?.name}</b> — khao nước là
          chuyện hiển nhiên 😎. Nhưng ai cũng có thể góp link quán nhé!
        </p>
      ) : finished && isDraw ? (
        <p className="mb-4 text-sm text-muted2">
          Trận hòa nên không ai bị bắt — nhưng khát thì cứ góp link, cả nhóm
          uống chung 🥤
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted2">
          Góp sẵn link quán nước cho cả nhóm — ai thua kèo sẽ &quot;tự giác&quot; 😏
        </p>
      )}

      {/* Nhắc nhẹ người đã lỡ pick đội thua */}
      {iLost && (
        <div className="mb-3 rounded-2xl border border-hot/30 bg-hot/5 p-3 text-sm">
          Bạn đã pick {loserTeam?.flag} <b>{loserTeam?.name}</b> — chịu khó khao
          nước nha 🫡
        </div>
      )}

      {/* Form nhập link — MỌI NGƯỜI đăng nhập đều gắn được */}
      {user ? (
        <form onSubmit={submitLink} className="mb-5 space-y-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            required
            placeholder="Dán link quán (GrabFood, ShopeeFood, Highlands...)"
            className="w-full rounded-xl border border-hairline bg-soft px-4 py-2.5 text-sm outline-none placeholder:text-muted3 focus:border-neon/50"
          />
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú (vd: chỉ chọn món < 40k 🥲)"
              className="flex-1 rounded-xl border border-hairline bg-soft px-4 py-2.5 text-sm outline-none placeholder:text-muted3 focus:border-neon/50"
            />
            <button
              type="submit"
              disabled={busy || !url.trim()}
              className="shrink-0 rounded-xl bg-gradient-to-r from-hot to-gold px-5 py-2.5 text-sm font-bold text-pitch transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Đang lưu..." : "Gắn link 🧋"}
            </button>
          </div>
          <p className="text-xs text-muted3">
            Lưu xong là mọi người thấy ngay và vào đặt nước được 👇
          </p>
        </form>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="mb-5 w-full rounded-xl border border-hairline bg-soft py-2.5 text-sm font-bold text-accent transition hover:border-accent/40"
        >
          Đăng nhập Google để gắn link nước 🧋
        </button>
      )}

      {/* Danh sách link nước + đặt món */}
      {links.length === 0 ? (
        <p className="text-sm text-muted3">
          Chưa có link nào — bạn gắn link đầu tiên đi, cả nhóm chờ đặt nước 👀
        </p>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence>
            {links.map((link) => {
              const linkOrders = orders.filter((o) => o.link_id === link.id);
              return (
                <motion.li
                  key={link.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-hairline bg-soft p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg">
                      {link.profiles?.avatar ?? "🙂"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <b>{link.profiles?.username ?? "Ẩn danh"}</b>{" "}
                        <span className="text-muted2">khao nước 🫶</span>
                      </p>
                      {link.note && (
                        <p className="truncate text-xs text-muted2">{link.note}</p>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-gradient-to-r from-neon to-ice px-4 py-1.5 text-xs font-bold text-pitch transition hover:opacity-90"
                    >
                      Mở menu →
                    </a>
                  </div>

                  {linkOrders.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
                      {linkOrders.map((o) => (
                        <li key={o.id} className="flex items-center gap-2 text-sm">
                          <span>{o.profiles?.avatar ?? "🙂"}</span>
                          <b className="shrink-0">{o.profiles?.username ?? "Ẩn danh"}:</b>
                          <span className="truncate text-muted">{o.item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex gap-2">
                    <input
                      value={orderDrafts[link.id] ?? ""}
                      onChange={(e) =>
                        setOrderDrafts((d) => ({ ...d, [link.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && submitOrder(link.id)}
                      placeholder="Bạn uống gì? (vd: Trà sữa 100% đường 😋)"
                      className="flex-1 rounded-xl border border-hairline bg-soft px-3 py-2 text-sm outline-none placeholder:text-muted3 focus:border-neon/50"
                    />
                    <button
                      onClick={() => submitOrder(link.id)}
                      disabled={busy}
                      className="rounded-xl border border-neon/40 px-4 py-2 text-sm font-bold text-accent transition hover:bg-neon/10 disabled:opacity-50"
                    >
                      Đặt 🛒
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
