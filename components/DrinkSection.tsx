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

  if (match.status !== "finished") return null;

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

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <h3 className="mb-1 text-lg font-extrabold">🧋 Góc đền nước</h3>

      {isDraw ? (
        <p className="text-sm text-slate-400">
          Trận này hòa — hôm nay không ai phải mua nước, giải tán 😌
        </p>
      ) : (
        <p className="mb-4 text-sm text-slate-400">
          Ai lỡ pick {loserTeam?.flag} {loserTeam?.name} thì gửi link quán nước
          vào đây, anh em order nhẹ tay thôi 😈
        </p>
      )}

      {/* Form nhập link — chỉ hiện cho người pick đội thua */}
      {iLost && (
        <form onSubmit={submitLink} className="mb-5 space-y-2">
          <div className="rounded-2xl border border-hot/30 bg-hot/5 p-3 text-sm">
            Bạn đã pick {loserTeam?.flag} <b>{loserTeam?.name}</b> — chịu khó
            khao nước nha 🫡
          </div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            required
            placeholder="Dán link quán (GrabFood, ShopeeFood...)"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-neon/50"
          />
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú (vd: chỉ được chọn món < 40k 🥲)"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-neon/50"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-gradient-to-r from-hot to-gold px-5 py-2.5 text-sm font-bold text-pitch transition hover:opacity-90 disabled:opacity-50"
            >
              Gửi link 🧋
            </button>
          </div>
        </form>
      )}

      {/* Danh sách link nước + đặt món */}
      {links.length === 0 ? (
        !isDraw && (
          <p className="text-sm text-slate-500">
            Chưa có link nào... mấy bạn thua kèo đang trốn đâu rồi? 👀
          </p>
        )
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
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-lg">
                      {link.profiles?.avatar ?? "🙂"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <b>{link.profiles?.username ?? "Ẩn danh"}</b>{" "}
                        <span className="text-slate-400">khao nước 🫶</span>
                      </p>
                      {link.note && (
                        <p className="truncate text-xs text-slate-400">{link.note}</p>
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
                    <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                      {linkOrders.map((o) => (
                        <li key={o.id} className="flex items-center gap-2 text-sm">
                          <span>{o.profiles?.avatar ?? "🙂"}</span>
                          <b className="shrink-0">{o.profiles?.username ?? "Ẩn danh"}:</b>
                          <span className="truncate text-slate-300">{o.item}</span>
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
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-neon/50"
                    />
                    <button
                      onClick={() => submitOrder(link.id)}
                      disabled={busy}
                      className="rounded-xl border border-neon/40 px-4 py-2 text-sm font-bold text-neon transition hover:bg-neon/10 disabled:opacity-50"
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
