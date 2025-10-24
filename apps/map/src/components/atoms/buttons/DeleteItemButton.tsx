// src/components/atoms/buttons/DeleteItemButton.tsx
import clsx from "clsx";
import type React from "react";

type DeleteItemButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  title?: string;
  tabIndex?: number;
  /** ボタンの高さ（px or CSS長さ）。例: 32, "40px", "2.5rem" */
  height?: number | string;
};

export function DeleteItemButton({
  onClick,
  disabled = false,
  className = "",
  title = "項目削除",
  tabIndex,
  height = 32,
}: DeleteItemButtonProps) {
  const h = typeof height === "number" ? `${height}px` : height;

  const iconSrc = `${import.meta.env.BASE_URL}icon_trash.png`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center select-none",
        disabled ? "opacity-50 cursor-default" : "cursor-pointer",
        className
      )}
      title={title}
      aria-label={title}
      tabIndex={tabIndex}
      style={{
        height: h, // 高さのみ固定
        width: "auto", // 横は自動
        padding: 0,
        background: "transparent",
        border: "none",
        lineHeight: 0,
      }}
    >
      <img
        src={iconSrc}
        alt=""
        draggable={false}
        style={{
          height: "100%", // ボタンの高さにフィット
          width: "auto", // 比率維持で自動
          objectFit: "contain",
          pointerEvents: "none",
          display: "block",
        }}
      />
    </button>
  );
}
