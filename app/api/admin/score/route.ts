import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cập nhật tỉ số / trạng thái trận đấu (live score).
 * Mọi client đang mở web sẽ thấy thay đổi ngay nhờ Supabase Realtime.
 *
 * curl -X POST https://<domain>/api/admin/score \
 *   -H "x-admin-secret: $ADMIN_SECRET" -H "Content-Type: application/json" \
 *   -d '{"match_id":1,"home_score":2,"away_score":1,"status":"live","minute":67}'
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Sai admin secret" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Thiếu SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.match_id) {
    return NextResponse.json({ error: "Thiếu match_id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ["home_score", "away_score", "status", "minute"] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await admin
    .from("matches")
    .update(updates)
    .eq("id", body.match_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, match: data });
}
