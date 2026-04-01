// src/pages/HubPage/parts/ProjectSelectDropdown.tsx
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

const CATALOG = String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(
  /\/+$/,
  ""
);
const LIST_URL = CATALOG ? `${CATALOG}/projects.json` : "";

type ProjectRow = {
  uuid: string;
  projectId: string;
  projectName: string;
};

function inferYearFromId(pid: string) {
  const m = (pid || "").match(/^(\d{2})/);
  return m ? String(2000 + Number(m[1])) : "";
}

function rowLabel(r: ProjectRow) {
  return `${r.projectId.slice(0, 6)}-${r.projectName}`;
}

export function ProjectSelectDropdown({
  edit,
  disabled,
  className,
}: {
  edit: boolean;
  disabled?: boolean;
  /** ラッパー用（例: w-full） */
  className?: string;
}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(!!LIST_URL);
  const [fetchError, setFetchError] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!LIST_URL) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(LIST_URL, { cache: "no-cache" });
        if (!res.ok) throw new Error(String(res.status));
        const json: ProjectRow[] = await res.json();
        if (!Array.isArray(json)) throw new Error("not array");
        json.sort((a, b) =>
          (b.projectId || "").localeCompare(a.projectId || "")
        );
        if (!cancelled) {
          setRows(json);
          setFetchError(false);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setFetchError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listReady = !loading && !fetchError && rows.length > 0;

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const maxH = 256;
    const below = window.innerHeight - r.bottom - gap - 8;
    setMenuStyle({
      position: "fixed",
      left: r.left,
      top: r.bottom + gap,
      width: r.width,
      maxHeight: Math.min(maxH, Math.max(120, below)),
      zIndex: 10000,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || !listReady) {
      setMenuStyle(null);
      return;
    }
    updateMenuPosition();
  }, [open, listReady, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      // スクロールバー（特にトラック部分）操作時は target 判定に乗らないことがある。
      // メニュー矩形内のポインタ操作は「内側クリック」とみなして閉じない。
      if (menuRef.current && e.clientX >= 0 && e.clientY >= 0) {
        const r = menuRef.current.getBoundingClientRect();
        const inMenuRect =
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom;
        if (inMenuRect) return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateMenuPosition();
      });
    };
    window.addEventListener("scroll", onScroll, true);
    const onResize = () => updateMenuPosition();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafId != null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateMenuPosition]);

  if (!LIST_URL) return null;

  const currentUuid = routeId ?? "";
  const triggerDisabled = disabled || !listReady;

  const goTo = (uuid: string, projectId: string) => {
    if (!uuid || uuid === currentUuid) return;
    if (edit) {
      const ok = window.confirm(
        "編集中の内容は保存されていない可能性があります。別の案件に切り替えますか？"
      );
      if (!ok) return;
    }
    const qp = new URLSearchParams({ source: "s3" });
    const year = inferYearFromId(projectId);
    if (year) qp.set("year", year);
    const s = qp.toString();
    const to =
      currentUuid.length > 0 ? `../${uuid}?${s}` : `${uuid}?${s}`;
    navigate(to, { relative: "path" });
    setOpen(false);
  };

  const triggerClass = clsx(
    "inline-flex items-center justify-between gap-1 min-w-0 w-full h-8 md:h-9 rounded-md border border-slate-700 bg-[#211C1C]",
    "text-slate-200 text-[11px] md:text-xs px-2.5",
    "focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/70",
    "shadow-inner",
    triggerDisabled
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer hover:bg-[#2a2424]"
  );

  const statusHint = loading
    ? "読込中"
    : fetchError
      ? "一覧を取得できません"
      : rows.length === 0
        ? "案件がありません"
        : undefined;

  const menuList =
    open && listReady && menuStyle ? (
      <ul
        ref={menuRef}
        style={menuStyle}
        className={clsx(
          "overflow-y-auto overscroll-contain rounded-md border border-slate-700 bg-[#211C1C] py-1 shadow-lg"
        )}
        onWheel={(e) => {
          // 背景側へのスクロール連鎖を抑止
          e.stopPropagation();
        }}
        role="listbox"
        aria-label="案件一覧"
      >
        {currentUuid && !rows.some((r) => r.uuid === currentUuid) ? (
          <li
            role="presentation"
            className="px-2.5 py-1.5 text-[10px] text-slate-500 border-b border-slate-700/80"
          >
            現在の案件（一覧に未登録）
          </li>
        ) : null}
        {rows.map((r) => {
          const isCurrent = r.uuid === currentUuid;
          return (
            <li key={r.uuid} role="option" aria-selected={isCurrent}>
              <button
                type="button"
                disabled={isCurrent}
                className={clsx(
                  "w-full text-left px-2.5 py-2 text-[11px] md:text-xs",
                  isCurrent
                    ? "text-slate-500 cursor-default bg-[#2a2424]"
                    : "text-slate-200 hover:bg-[#2a2424] focus:bg-[#2a2424] focus:outline-none"
                )}
                onClick={() => goTo(r.uuid, r.projectId)}
              >
                {rowLabel(r)}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div className={clsx("min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-label="案件を選択して切り替え"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={triggerDisabled}
        title={statusHint}
        onClick={() => {
          if (triggerDisabled) return;
          setOpen((o) => !o);
        }}
      >
        <span className="truncate">案件選択</span>
        <ChevronDown
          className={clsx(
            "size-3.5 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {menuList ? createPortal(menuList, document.body) : null}
    </div>
  );
}
