// DesktopLayout.tsx
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { blurActiveInput, detectEmbedMode } from "@/components";

type Props = { sidebar: ReactNode } & PropsWithChildren;

// === constants (no behavior change) ===
const CLS_SIDEBAR_COLLAPSED = "sidebar-collapsed";
const CLS_DETAILBAR_OPEN = "detailbar-open";

const EV_OPEN = "sidebar:open";
const EV_CLOSE = "sidebar:close";
const EV_TOGGLE = "sidebar:toggle";

export default function DesktopLayout({ sidebar, children }: Props) {
  // 一度だけ判定して固定
  const [isEmbed] = useState<boolean>(() => detectEmbedMode());

  // 通常モード用のサイドバー開閉状態（embed のときは実質使われない）
  const [collapsed, setCollapsed] = useState<boolean>(() => false);

  // サイドバー開閉に応じた body クラス付け替え
  useEffect(() => {
    if (isEmbed) return; // embed では body クラスをいじらない

    const { classList } = document.body;

    // サイドバー開閉クラス
    classList.toggle(CLS_SIDEBAR_COLLAPSED, collapsed);

    if (collapsed) {
      // サイドバーを閉じるときは詳細バーも隠す
      classList.remove(CLS_DETAILBAR_OPEN);
    }
    return () => {
      classList.remove(CLS_SIDEBAR_COLLAPSED);
      classList.remove(CLS_DETAILBAR_OPEN);
    };
  }, [collapsed, isEmbed]);

  // Global events to control sidebar open/close
  useEffect(() => {
    if (isEmbed) return; // embed ではグローバルイベントも無効

    const open = () => setCollapsed(false);
    const close = () => setCollapsed(true);
    const toggle = () => setCollapsed((v) => !v);

    window.addEventListener(EV_OPEN, open);
    window.addEventListener(EV_CLOSE, close);
    window.addEventListener(EV_TOGGLE, toggle);

    return () => {
      window.removeEventListener(EV_OPEN, open);
      window.removeEventListener(EV_CLOSE, close);
      window.removeEventListener(EV_TOGGLE, toggle);
    };
  }, [isEmbed]);

  const gridCols = useMemo(
    () => (collapsed ? "grid-cols-[0px_1fr]" : "grid-cols-[320px_1fr]"),
    [collapsed]
  );

  // embed モードはマップ単体表示（サイドバー・トグルとも非表示）
  if (isEmbed) {
    return <main className="relative h-dvh">{children}</main>;
  }

  // 通常モードのレイアウト
  return (
    <div className={`relative grid ${gridCols} h-dvh`}>
      <aside
        className="overflow-auto bg-[#111827cc] text-white backdrop-blur p-3"
        aria-hidden={collapsed}
      >
        {sidebar}
      </aside>

      <main className="relative">{children}</main>

      <button
        id="sidebarToggle"
        className="no-caret"
        onMouseDown={blurActiveInput}
        type="button"
        aria-label={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? "›" : "‹"}
      </button>
    </div>
  );
}
