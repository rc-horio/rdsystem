// src/pages/layout/MobileLayout.tsx
import { type PropsWithChildren } from "react";

export default function MobileLayout({ children }: PropsWithChildren) {
  // 1行レイアウト・ヘッダー無し
  return (
    <div className="grid grid-rows-[1fr] h-[100dvh]">
      <main className="relative">{children}</main>
    </div>
  );
}
