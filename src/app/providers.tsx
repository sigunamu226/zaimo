"use client";

import { HeroUIProvider } from "@heroui/react";

// @heroui/react のバレル (dist/index.mjs) は `export *` のみで "use client" を持たないため、
// Server Component から直接 import すると Turbopack では client 境界が確立されず
// `React.createContext is not a function` で落ちる。
// 境界をこのファイルで明示する。
export function Providers({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
