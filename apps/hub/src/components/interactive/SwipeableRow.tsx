import { useRef, useState, useEffect } from "react";
import clsx from "clsx";

/* =========================
   スワイプ可能な行
   ========================= */
type SwipeableRowProps = {
  children: React.ReactNode;
  disabled?: boolean;
  revealWidth?: number;
  thresholdPct?: number;
  className?: string;

  // 右側アクション
  onRightAction?: () => void; // ← optionalに
  rightActionLabel?: string;
  rightAction?: React.ReactNode;
};

/* =========================
   スワイプ可能な行
   ========================= */
export function SwipeableRow({
  children,
  disabled = false,
  revealWidth = 72,
  thresholdPct = 40,
  className = "",
  onRightAction = () => {},
  rightActionLabel = "削除",
  rightAction,
}: SwipeableRowProps) {
  const startX = useRef(0),
    startY = useRef(0),
    startT = useRef(0);
  const [offset, setOffset] = useState(0);
  const [opened, setOpened] = useState(false);
  const dragging = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const open = () => {
    setOpened(true);
    setOffset(-revealWidth);
  };
  const close = () => {
    setOpened(false);
    setOffset(0);
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (disabled) return;
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    startT.current = performance.now();
    dragging.current = true;
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (disabled || !dragging.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (Math.abs(dy) > Math.abs(dx)) return; // 縦意図を優先
    // e.preventDefault(); // 横スワイプ中はスクロール抑制
    const base = opened ? -revealWidth : 0;
    const next = Math.min(0, Math.max(-revealWidth, base + dx));
    scheduleSetOffset(next);

    setOffset(next);
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (disabled || !dragging.current) return;
    dragging.current = false;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dt = Math.max(1, performance.now() - startT.current);
    const vx = dx / dt;
    const threshold = revealWidth * (thresholdPct / 100);
    if (opened) {
      dx > threshold || vx > 0.5 ? close() : open();
      return;
    }
    -dx > threshold || vx < -0.5 ? open() : close();
  };
  const rafId = useRef<number | null>(null);

  const scheduleSetOffset = (next: number) => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setOffset(next);
      rafId.current = null;
    });
  };

  useEffect(
    () => () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    },
    []
  );

  return (
    <div
      ref={ref}
      className={clsx(
        "relative w-full overflow-hidden select-none touch-pan-y",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 背面アクション */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 flex items-center justify-end"
        style={{ width: revealWidth }}
        {...(!opened ? { inert: true } : {})}
      >
        {rightAction ?? (
          <button
            type="button"
            aria-label={rightActionLabel}
            className="h-full px-3 text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-white/60"
            onClick={() => !disabled && onRightAction?.()}
            // 開いていない時は Tab 停止（保険）
            tabIndex={opened ? 0 : -1}
          >
            {rightActionLabel}
          </button>
        )}
      </div>{" "}
      {/* 前面コンテンツ（背景はカード色に合わせて） */}
      <div
        className={clsx(
          "relative z-10 w-full min-w-0 bg-black", // BlackCard なら黒に固定。必要なら bg-neutral-900 等へ。
          "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => opened && close()}
      >
        {children}
      </div>
    </div>
  );
}
