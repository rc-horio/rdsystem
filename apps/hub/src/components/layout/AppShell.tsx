import React from "react";

/**
 * AppShell
 * - 画面全体のセーフエリア余白を確保
 * - 固定ヘッダーはセーフエリア直下に配置
 * - 本文は「ヘッダー高+セーフエリア」分だけ自動で下げる
 */
type Props = {
  /** 固定ヘッダーのノード（TopBarやBrandHeaderなど） */
  header?: React.ReactNode;
  /** ヘッダーの実高さ（ピクセル）。未指定なら --header-h を利用 */
  headerHeight?: number;
  /** スクロール領域にしたいときは true */
  scroll?: boolean;
  children: React.ReactNode;
};

export function AppShell({
  header,
  headerHeight,
  scroll = false,
  children,
}: Props) {
  // ページごとにヘッダー高を変えたい場合に対応
  const styleVars: React.CSSProperties | undefined =
    typeof headerHeight === "number"
      ? { ["--header-h" as any]: `${headerHeight}px` }
      : undefined;

  return (
    <div
      className="min-h-dvh bg-[#000A1B] text-white overflow-x-hidden"
      style={styleVars}
    >
      {/* 固定ヘッダー（セーフエリア直下） */}
      {header ? (
        <div
          className="fixed left-0 right-0 z-50"
          style={{ top: "var(--safe-top)" }}
        >
          {header}
        </div>
      ) : null}

      {/* 本文：セーフエリア+ヘッダー分だけ押し下げ、左右/下も安全領域 */}
      <main
        className={`pt-header-safe px-safe pb-safe ${
          scroll ? "min-h-dvh" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
