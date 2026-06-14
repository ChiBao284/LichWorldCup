import type { Metadata } from "next";
import {
  Anton,
  Archivo,
  Oswald,
  Space_Mono,
  Be_Vietnam_Pro,
} from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// Display: Anton (Latin) + Oswald (fallback tiếng Việt — Anton thiếu glyph VN)
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});
// Body
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
});
// Caption / nhãn kỹ thuật
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});
// Fallback tiếng Việt cho display & mono
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontVars = [
  anton.variable,
  oswald.variable,
  archivo.variable,
  spaceMono.variable,
  beVietnam.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Lịch World Cup 2026 ⚽ Live Score & Pick Đội",
  description:
    "Lịch thi đấu World Cup 2026, tỉ số trực tiếp, nhánh đấu knockout, pick đội yêu thích cùng đồng nghiệp và bảng xếp hạng thánh dự đoán.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans pitch-bg">
        <Navbar />
        <main className="flex-1">{children}</main>

        {/* Footer CTA editorial — nền mực đen, chữ khổng lồ, accent đỏ */}
        <footer className="mt-24 bg-[#16140F] text-[#FBFAF7]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <p className="eyebrow mb-5 text-[11px] text-[#E8351F]">
              World Cup 2026 · USA · Canada · Mexico
            </p>
            <h2 className="font-display text-5xl uppercase leading-[0.86] tracking-tight sm:text-7xl lg:text-8xl">
              Đoán đi. Cổ vũ đi.{" "}
              <span className="text-[#E8351F]">Thắng.</span>
            </h2>
            {/* Miễn trừ trách nhiệm */}
            <div className="mt-10 space-y-2 border-t border-white/10 pt-8 text-sm leading-relaxed text-white/55">
              <p>
                ⚠️ Đây là <b className="text-white/80">dự án phi lợi nhuận</b> được
                tạo ra nhằm mục đích học hỏi &amp; tìm hiểu AI.
              </p>
              <p>
                Đây chỉ là <b className="text-white/80">mini game vui</b> giữa bạn
                bè/đồng nghiệp —{" "}
                <b className="text-white/80">
                  KHÔNG cá cược dưới bất kỳ hình thức nào
                </b>
                . Mọi lượt &quot;pick đội&quot; hay &quot;link nước&quot; chỉ mang
                tính giải trí.
              </p>
              <p>
                Dữ liệu đội bóng, lịch thi đấu &amp; tỉ số là mô phỏng/demo, không
                phải nguồn chính thức của FIFA.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-white/45 sm:flex-row sm:items-center sm:justify-between">
              <span>⚽ Lịch World Cup 2026 — thua thì đi mua nước 🧋</span>
              <span>11 Jun – 19 Jul 2026</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
