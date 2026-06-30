import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  TEAMS,
  NAME_TO_CODE,
  groupLetter,
  roundToStage,
  parseKickoff,
  prettyPlaceholder,
  matchExtId,
} from "@/lib/wc-data";
import type { GoalEvent, MatchStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const WC_URL =
  "https://raw.githubusercontent.com/upbound-web/worldcup-live.json/master/2026/worldcup.json";

type ApiMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  score?: { ft: number[]; ht: number[] };
  goals1?: GoalEvent[];
  goals2?: GoalEvent[];
  group?: string;
  ground: string;
  num?: number;
};

type MatchRow = {
  ext_id: string;
  stage: ReturnType<typeof roundToStage>;
  group_name: string | null;
  round_slot: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  kickoff_at: string;
  venue: string | null;
  status: MatchStatus;
  minute: number | null;
  home_score: number;
  away_score: number;
  home_goals: GoalEvent[] | null;
  away_goals: GoalEvent[] | null;
};

// Throttle nhẹ trong cùng một instance để nhiều client poll không gọi GitHub liên tục
let lastSyncAt = 0;

async function sync() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Service role key là JWT dài (~200+ ký tự). Giá trị quá ngắn = placeholder.
  if (!url || !key || key.length < 40) {
    return {
      skipped:
        "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY hợp lệ (lấy service_role key thật ở Supabase → Project Settings → API).",
    };
  }

  const now = Date.now();
  if (now - lastSyncAt < 60_000) {
    return { throttled: true, nextInMs: 60_000 - (now - lastSyncAt) };
  }
  lastSyncAt = now;

  const res = await fetch(WC_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Tải worldcup.json lỗi: ${res.status}`);
  const data = (await res.json()) as { matches?: ApiMatch[] };
  const apiMatches = data.matches ?? [];

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Đội tuyển (idempotent)
  await admin.from("teams").upsert(
    TEAMS.map((t) => ({ id: t.code, name: t.name, flag: t.flag, group_name: t.group })),
    { onConflict: "id" }
  );

  // 2) Trận đấu
  const mapped = apiMatches
    .map((m) => {
      const kickoff = parseKickoff(m.date, m.time);
      if (!kickoff) return null;
      const stage = roundToStage(m.round);
      const code1 = NAME_TO_CODE[m.team1];
      const code2 = NAME_TO_CODE[m.team2];
      const ft = m.score?.ft;
      const ko = Date.parse(kickoff);

      let status: MatchStatus = "scheduled";
      let minute: number | null = null;
      let home_score = 0;
      let away_score = 0;
      if (ft && ft.length === 2) {
        status = "finished";
        home_score = ft[0];
        away_score = ft[1];
      } else if (now >= ko) {
        // Đã qua giờ bóng lăn nhưng nguồn chưa có tỉ số cuối (vd: đá hiệp phụ/luân
        // lưu, hoặc nguồn cập nhật chậm) — vẫn giữ "live" để ESPN tiếp tục cập nhật
        // tỉ số, tránh rơi về lại "scheduled" và làm mất tỉ số đang có.
        status = "live";
        minute = Math.min(120, Math.max(1, Math.floor((now - ko) / 60_000)));
      }

      const row: MatchRow & { _ko: number } = {
        ext_id: matchExtId(m.round, m.team1, m.team2),
        stage,
        group_name: groupLetter(m.group),
        round_slot: null,
        home_team_id: code1 ?? null,
        away_team_id: code2 ?? null,
        home_placeholder: code1 ? null : prettyPlaceholder(m.team1),
        away_placeholder: code2 ? null : prettyPlaceholder(m.team2),
        kickoff_at: kickoff,
        venue: m.ground ?? null,
        status,
        minute,
        home_score,
        away_score,
        home_goals: m.goals1 ?? null,
        away_goals: m.goals2 ?? null,
        _ko: ko,
      };
      return row;
    })
    .filter((r): r is MatchRow & { _ko: number } => r !== null);

  // round_slot: theo thứ tự thời gian trong mỗi vòng knockout (fallback)
  const byStage = new Map<string, { ext: string; ko: number }[]>();
  for (const r of mapped) {
    const arr = byStage.get(r.stage) ?? [];
    arr.push({ ext: r.ext_id, ko: r._ko });
    byStage.set(r.stage, arr);
  }
  const slotByExt = new Map<string, number | null>();
  for (const [stage, arr] of byStage) {
    arr.sort((a, b) => a.ko - b.ko);
    arr.forEach((x, i) => slotByExt.set(x.ext, stage === "group" ? null : i + 1));
  }

  // Đọc round_slot đã được set thủ công cho các trận knockout
  // để sync không ghi đè vị trí bracket đã tuỳ chỉnh.
  const { data: pinnedSlots } = await admin
    .from("matches")
    .select("ext_id, round_slot")
    .not("ext_id", "is", null)
    .not("round_slot", "is", null)
    .in("stage", ["r32", "r16", "qf", "sf", "third", "final"]);
  const pinnedByExt = new Map<string, number>(
    (pinnedSlots ?? []).map((r) => [r.ext_id as string, r.round_slot as number])
  );

  const rows: MatchRow[] = mapped.map(({ _ko, ...rest }) => {
    void _ko;
    const slot = pinnedByExt.get(rest.ext_id) ?? slotByExt.get(rest.ext_id) ?? null;
    return { ...rest, round_slot: slot };
  });

  const { error } = await admin.from("matches").upsert(rows, { onConflict: "ext_id" });
  if (error) throw new Error(error.message);

  return {
    ok: true,
    teams: TEAMS.length,
    matches: rows.length,
    live: rows.filter((r) => r.status === "live").length,
    finished: rows.filter((r) => r.status === "finished").length,
  };
}

export async function POST() {
  try {
    return NextResponse.json(await sync());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sync failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
