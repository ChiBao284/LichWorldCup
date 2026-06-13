import { notFound } from "next/navigation";
import { fetchMatch } from "@/lib/supabase/server";
import MatchDetailClient from "@/components/MatchDetailClient";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await fetchMatch(Number(id));
  if (!match) notFound();

  return <MatchDetailClient match={match} />;
}
