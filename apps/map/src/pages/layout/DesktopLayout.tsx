// DesktopLayout.tsx
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { blurActiveInput } from "@/components/utils/blurActiveInput";

type Props = { sidebar: ReactNode } & PropsWithChildren;

// === constants (no behavior change) ===
const CLS_SIDEBAR_COLLAPSED = "sidebar-collapsed";
const CLS_DETAILBAR_OPEN = "detailbar-open";

const EV_OPEN = "sidebar:open";
const EV_CLOSE = "sidebar:close";
const EV_TOGGLE = "sidebar:toggle";

export default function DesktopLayout({ sidebar, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // Keep body classes in sync with state (unchanged behavior)
  useEffect(() => {
    const { classList } = document.body;
    classList.toggle(CLS_SIDEBAR_COLLAPSED, collapsed);
    if (collapsed) {
      classList.remove(CLS_DETAILBAR_OPEN); // 閉時は詳細バーも隠す（元コード踏襲）
    }
    return () => {
      classList.remove(CLS_SIDEBAR_COLLAPSED);
      classList.remove(CLS_DETAILBAR_OPEN);
    };
  }, [collapsed]);

  // Global events to control sidebar open/close (unchanged behavior)
  useEffect(() => {
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
  }, []);

  const gridCols = useMemo(
    () => (collapsed ? "grid-cols-[0px_1fr]" : "grid-cols-[320px_1fr]"),
    [collapsed]
  );

  return (
    <div className={`relative grid ${gridCols} h-dvh`}>
      <aside
        className="overflow-auto bg-[#111827cc] text-white backdrop-blur p-3"
        aria-hidden={collapsed}
      >
        {!collapsed && sidebar}
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
