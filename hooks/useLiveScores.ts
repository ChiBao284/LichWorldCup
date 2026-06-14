"use client";

import { useEffect, useRef, useState } from "react";
import type { Match } from "@/lib/types";

/**
 * Nguồn tỉ số trực tiếp: ESPN scoreboard (giống file index.html).
 * Chỉ dùng để CẬP NHẬT TỈ SỐ cho các trận đang "live" — mọi thông tin
 * khác (tên đội, cờ, sân, kèo) vẫn giữ nguyên từ Supabase.
 */
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719";
const REFRESH_MS = 30_000;

/** Một sự kiện trong trận (bàn thắng / thẻ) lấy từ ESPN. */
export type MatchEvent = {
  side: "home" | "away";
  /** Phút xảy ra, vd "23'", "45'+5'". */
  minute: string;
  /** Tên cầu thủ liên quan (rút gọn). */
  player: string;
  kind: "goal" | "yellow" | "red";
  /** Phút từ ESPN (giây) để sắp xếp. */
  order: number;
  penalty: boolean;
  ownGoal: boolean;
};

export type LiveScore = {
  home: number;
  away: number;
  /** Đồng hồ trận đấu từ ESPN, vd "67'", "HT", "FT". */
  detail: string;
  state: "pre" | "in" | "post";
  /** Diễn biến: bàn thắng, thẻ vàng, thẻ đỏ (đã sắp xếp theo thời gian). */
  events: MatchEvent[];
};

/* ---------- Khớp đội ESPN ↔ đội trong app ---------- */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z]/g, "");
}

function appTeamIds(code: string | null, name: string | null | undefined): Set<string> {
  const s = new Set<string>();
  if (code) s.add(code.toLowerCase());
  if (name) s.add(norm(name));
  return s;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function espnTeamIds(competitor: any): Set<string> {
  const s = new Set<string>();
  const t = competitor?.team ?? {};
  if (t.abbreviation) s.add(String(t.abbreviation).toLowerCase());
  if (t.displayName) s.add(norm(t.displayName));
  if (t.shortDisplayName) s.add(norm(t.shortDisplayName));
  if (t.name) s.add(norm(t.name));
  return s;
}

function overlaps(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

/** Tìm event ESPN khớp 2 đội của trận (không quan tâm thứ tự home/away). */
function findEvent(events: any[], match: Match) {
  const homeIds = appTeamIds(match.home_team_id, match.home_team?.name);
  const awayIds = appTeamIds(match.away_team_id, match.away_team?.name);
  if (homeIds.size === 0 || awayIds.size === 0) return null;

  for (const ev of events) {
    const comp = ev?.competitions?.[0];
    const cs = comp?.competitors;
    if (!cs || cs.length < 2) continue;
    const a = espnTeamIds(cs[0]);
    const b = espnTeamIds(cs[1]);

    let homeComp: any = null;
    let awayComp: any = null;
    if (overlaps(homeIds, a) && overlaps(awayIds, b)) {
      homeComp = cs[0];
      awayComp = cs[1];
    } else if (overlaps(homeIds, b) && overlaps(awayIds, a)) {
      homeComp = cs[1];
      awayComp = cs[0];
    } else {
      continue;
    }

    const home = Number(homeComp.score);
    const away = Number(awayComp.score);
    if (Number.isNaN(home) || Number.isNaN(away)) return null;

    const status = comp.status ?? {};
    const detail = String(
      status.type?.shortDetail ?? status.displayClock ?? ""
    ).trim();
    const state = (status.type?.state ?? "in") as LiveScore["state"];

    // Diễn biến: chỉ lấy bàn thắng + thẻ vàng/đỏ
    const sideByTeamId: Record<string, "home" | "away"> = {};
    if (homeComp.team?.id) sideByTeamId[String(homeComp.team.id)] = "home";
    if (awayComp.team?.id) sideByTeamId[String(awayComp.team.id)] = "away";

    const events: MatchEvent[] = [];
    for (const det of comp.details ?? []) {
      const side = sideByTeamId[String(det?.team?.id)];
      if (!side) continue;
      let kind: MatchEvent["kind"];
      if (det.redCard) kind = "red";
      else if (det.yellowCard) kind = "yellow";
      else if (det.scoringPlay) kind = "goal";
      else continue; // bỏ qua thay người, phạt góc...
      const athlete = det.athletesInvolved?.[0] ?? {};
      events.push({
        side,
        minute: String(det.clock?.displayValue ?? "").trim(),
        player: String(athlete.shortName ?? athlete.displayName ?? "").trim(),
        kind,
        order: Number(det.clock?.value ?? 0),
        penalty: !!det.penaltyKick,
        ownGoal: !!det.ownGoal,
      });
    }
    events.sort((x, y) => x.order - y.order);

    return { home, away, detail, state, events } satisfies LiveScore;
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Trả về map { matchId → LiveScore } cho các trận đang live.
 * Tự poll ESPN mỗi 30s; chỉ chạy khi có trận live, và chỉ re-tạo timer
 * khi tập trận live thay đổi (dùng ref để đọc match mới nhất).
 */
export function useLiveScores(matches: Match[]): Record<number, LiveScore> {
  const [scores, setScores] = useState<Record<number, LiveScore>>({});

  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  // Chữ ký các trận live — đổi thì mới khởi động lại vòng poll.
  const liveKey = matches
    .filter((m) => m.status === "live")
    .map((m) => m.id)
    .join(",");

  useEffect(() => {
    if (!liveKey) {
      setScores({});
      return;
    }
    let cancelled = false;

    const run = async () => {
      try {
        const r = await fetch(ESPN_URL, { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        const events: unknown[] = data?.events ?? [];

        const next: Record<number, LiveScore> = {};
        for (const m of matchesRef.current) {
          if (m.status !== "live") continue;
          const ls = findEvent(events as never[], m);
          if (ls) next[m.id] = ls;
        }
        if (!cancelled) setScores(next);
      } catch {
        /* offline / lỗi mạng — giữ tỉ số cũ, lần sau thử lại */
      }
    };

    run();
    const timer = setInterval(run, REFRESH_MS);
    const onFocus = () => run();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [liveKey]);

  return scores;
}
