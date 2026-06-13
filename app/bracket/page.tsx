import type { Metadata } from "next";
import { fetchMatches } from "@/lib/supabase/server";
import BracketView from "@/components/BracketView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nhánh đấu loại trực tiếp — World Cup 2026",
};

export default async function BracketPage() {
  const matches = await fetchMatches();
  const knockout = matches.filter((m) => m.stage !== "group");

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-10">
      <h1 className="mb-2 text-4xl font-black sm:text-5xl">
        Nhánh đấu <span className="text-gradient">knockout</span> 🏆
      </h1>
      <p className="mb-8 text-muted2">
        32 đội vượt qua vòng bảng — thua là về nước. Kéo ngang để xem toàn bộ nhánh.
      </p>
      <BracketView matches={knockout} />
    </div>
  );
}
