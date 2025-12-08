import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, Eye, EyeOff } from "lucide-react";

/*
  モバイル用フルスクリーンレイヤー（横向きでも“同じ操作感”）
  - 100dvh + フレックスレイアウトでヘッダ高さに依存しない → 向き切替時も安定
  - 背景スクロールをロック
  - セーフエリア（notch）を env() で吸収（縦横どちらでもOK）
  - 既存の表示/非表示トグルやESCクローズは維持
*/

export type FullscreenLayerProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  module1Title?: string;
  module2Title?: string;
  module1Enabled?: boolean;
  module2Enabled?: boolean;
  onToggleModule1?: () => void;
  onToggleModule2?: () => void;
};

function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lock]);
}

export function FullscreenLayer({
  open,
  onClose,
  children,
  module1Title,
  module2Title,
  module1Enabled = true,
  module2Enabled = true,
  onToggleModule1,
  onToggleModule2,
}: FullscreenLayerProps) {
  const mountRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Portal 用のマウント先
  if (typeof window !== "undefined" && !mountRef.current) {
    const el = document.getElementById("fullscreen-root");
    mountRef.current = el || document.body;
  }

  // 背景スクロールをロック
  useLockBodyScroll(open);

  // オープン時にスクロールを初期化
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      scrollRef.current.scrollLeft = 0;
    }
  }, [open]);

  // ESC で閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-1000 bg-black/70 backdrop-blur-sm"
      style={{ height: "100dvh" }}
      // 背景タップで閉じたい場合は onClick={onClose} を付ける
    >
      {/* クリックバブル抑止 */}
      <div
        className="relative mx-auto my-0 h-full w-full bg-slate-900 text-slate-50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダ：縦横どちらでもセーフエリアにフィット */}
        <div
          className="shrink-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-slate-900/90 backdrop-blur supports-backdrop-filter:bg-slate-900/60"
          style={{
            paddingTop: "max(env(safe-area-inset-top), 8px)",
            paddingBottom: "8px",
            paddingLeft: "max(env(safe-area-inset-left), 12px)",
            paddingRight: "max(env(safe-area-inset-right), 12px)",
          }}
        >
          <div className="flex items-center gap-2 px-3">
            <Maximize2 className="w-4 h-4" aria-hidden />
            <span className="text-sm">フルスクリーン表示</span>
          </div>
          <div className="flex items-center gap-3 px-3">
            {onToggleModule1 && (
              <button
                type="button"
                onClick={onToggleModule1}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-xs"
                aria-pressed={module1Enabled}
                aria-label="モジュール1の表示切替"
              >
                {module1Enabled ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span>{module1Title ?? "モジュール1"}</span>
              </button>
            )}
            {onToggleModule2 && (
              <button
                type="button"
                onClick={onToggleModule2}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-xs"
                aria-pressed={module2Enabled}
                aria-label="モジュール2の表示切替"
              >
                {module2Enabled ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span>{module2Title ?? "モジュール2"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-xs"
              aria-label="閉じる"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              閉じる
            </button>
          </div>
        </div>

        {/* スクロール領域：flex-1でヘッダ高に依存せず、縦横で自動フィット */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto overscroll-contain"
          style={{
            paddingLeft: "max(env(safe-area-inset-left), 12px)",
            paddingRight: "max(env(safe-area-inset-right), 12px)",
            paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
            touchAction: "pan-x pan-y", // 縦横スクロールを許可
          }}
        >
          <div className="p-3">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, mountRef.current!);
}

export default FullscreenLayer;
