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

export async function fetchTopScorers() {
  const matches = await fetchMatches();
  const map = new Map<string, { name: string; team_name: string; team_flag: string; goals: number }>();

  for (const match of matches) {
    if (match.status !== "finished") continue;

    const aggregate = (
      goals: typeof match.home_goals,
      team: typeof match.home_team
    ) => {
      if (!goals || !team) return;
      for (const g of goals) {
        if (g.owngoal) continue;
        const key = `${g.name}|${team.id}`;
        const entry = map.get(key);
        if (entry) entry.goals++;
        else map.set(key, { name: g.name, team_name: team.name, team_flag: team.flag, goals: 1 });
      }
    };

    aggregate(match.home_goals, match.home_team);
    aggregate(match.away_goals, match.away_team);
  }

  return [...map.values()].sort((a, b) => b.goals - a.goals);
}
