import { fetchMatches, fetchTeams, fetchLeaderboard } from "@/lib/supabase/server";
import HomeClient from "@/components/home/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [matches, teams, leaderboard] = await Promise.all([
    fetchMatches(),
    fetchTeams(),
    fetchLeaderboard(),
  ]);

  return <HomeClient matches={matches} teams={teams} leaderboard={leaderboard} />;
}
