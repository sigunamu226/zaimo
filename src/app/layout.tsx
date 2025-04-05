import "./globals.css";
import { HeroUIProvider } from "@heroui/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="relative min-h-screen bg-black overflow-hidden text-white">
          {/* グラデーション背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#140024] via-[#240b36] to-[#000000] opacity-70 z-0" />

          {/* 放射状のライト風オーバーレイ */}
          <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(circle,_rgba(137,74,255,0.3)_0%,_transparent_60%)] blur-3xl z-0" />

          {/* 曲線っぽい円弧 or 半円オーバーレイ（SVGやImage） */}
          <div className="absolute right-[-10%] top-[-10%] w-[300px] h-[300px] bg-gradient-to-tr from-indigo-800 to-purple-600 opacity-30 rounded-full z-0" />
          <HeroUIProvider>{children}</HeroUIProvider>
        </div>
      </body>
    </html>
  );
}
