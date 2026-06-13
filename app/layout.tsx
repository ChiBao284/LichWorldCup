import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

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
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans pitch-bg">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
          <p>
            ⚽ Lịch World Cup 2026 — làm cho vui, thua thì{" "}
            <span className="text-gradient-hot font-semibold">đi mua nước</span>{" "}
            nhé 🧋
          </p>
        </footer>
      </body>
    </html>
  );
}
