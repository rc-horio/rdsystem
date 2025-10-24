import React from "react";

export function HamburgerToggleButton({
  open,
  onToggle,
  labelWhenClosed = "メニューを開く",
  labelWhenOpen = "メニューを閉じる",
  className = "",
  style,
}: {
  open: boolean;
  onToggle: () => void;
  labelWhenClosed?: string;
  labelWhenOpen?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  // 3本線→× へトランジション（transform/opacityのみ = GPUフレンドリー）
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? labelWhenOpen : labelWhenClosed}
      aria-controls="landscape-side-menu"
      className={`touch-manipulation select-none fixed z-[9999] w-12 h-12 rounded-full
                  bg-black/55 hover:bg-black/70 active:bg-black/75
                  flex items-center justify-center ${className}`}
      style={style}
    >
      <span className="relative block w-6 h-6" aria-hidden>
        {/* bar 1 */}
        <span
          className="absolute left-0 right-0 h-[2px] bg-white transition-transform duration-300 will-change-transform"
          style={{
            top: "6px",
            transform: open ? "translateY(6px) rotate(45deg)" : "none",
          }}
        />
        {/* bar 2 */}
        <span
          className="absolute left-0 right-0 h-[2px] bg-white transition-opacity duration-200"
          style={{
            top: "12px",
            opacity: open ? 0 : 1,
          }}
        />
        {/* bar 3 */}
        <span
          className="absolute left-0 right-0 h-[2px] bg-white transition-transform duration-300 will-change-transform"
          style={{
            top: "18px",
            transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
          }}
        />
      </span>
    </button>
  );
}
