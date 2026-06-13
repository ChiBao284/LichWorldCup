import type { Metadata } from "next";
import { fetchMatches } from "@/lib/supabase/server";
import ScheduleClient from "@/components/ScheduleClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lịch thi đấu — World Cup 2026",
};

export default async function SchedulePage() {
  const matches = await fetchMatches();
  return <ScheduleClient matches={matches} />;
}
