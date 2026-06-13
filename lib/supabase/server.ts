import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client dùng trong Server Components / Route Handlers.
 * Chỉ đọc dữ liệu công khai (teams, matches, picks...) qua anon key.
 */
export function supabaseServer(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

const MATCH_SELECT =
  "*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)";

export async function fetchMatches() {
  try {
    const { data } = await supabaseServer()
      .from("matches")
      .select(MATCH_SELECT)
      .order("kickoff_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchMatch(id: number) {
  try {
    const { data } = await supabaseServer()
      .from("matches")
      .select(MATCH_SELECT)
      .eq("id", id)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchTeams() {
  try {
    const { data } = await supabaseServer()
      .from("teams")
      .select("*")
      .order("group_name")
      .order("fifa_rank");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchTeam(id: string) {
  try {
    const { data } = await supabaseServer()
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchPlayers(teamId: string) {
  try {
    const { data } = await supabaseServer()
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("position")
      .order("shirt_number");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchLeaderboard() {
  try {
    const { data } = await supabaseServer()
      .from("leaderboard")
      .select("*")
      .order("win_rate", { ascending: false })
      .order("correct_picks", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}
