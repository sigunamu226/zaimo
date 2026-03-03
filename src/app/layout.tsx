import "./globals.css";
import { HeroUIProvider } from "@heroui/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zaimo",
  description: "在庫管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          コンテンツへスキップ
        </a>
        <div className="relative min-h-screen bg-black overflow-hidden text-white">
          {/* グラデーション背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#140024] via-[#240b36] to-[#000000] opacity-70 z-0" />

          {/* 放射状のライト風オーバーレイ */}
          <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(circle,_rgba(137,74,255,0.3)_0%,_transparent_60%)] blur-3xl z-0" />

          {/* 曲線っぽい円弧 or 半円オーバーレイ（SVGやImage） */}
          <div className="absolute right-[-10%] top-[-10%] w-[300px] h-[300px] bg-gradient-to-tr from-indigo-800 to-purple-600 opacity-30 rounded-full z-0" />
          <HeroUIProvider>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </HeroUIProvider>
        </div>
      </body>
    </html>
  );
}
