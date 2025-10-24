// src/components/atoms/buttons/AddItemButton.tsx
import clsx from "clsx";

type Props = {
  onClick: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  /** ボタンの高さ（px or CSS長さ）。例: 32, "40px", "2.5rem" */
  height?: number | string;
};

export function AddItemButton({
  onClick,
  className = "",
  title = "項目追加",
  disabled = false,
  height = 32,
}: Props) {
  const h = typeof height === "number" ? `${height}px` : height;

  const iconSrc = `${import.meta.env.BASE_URL}_0007_icon_plus.png`;
  
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center select-none",
        disabled ? "opacity-50 cursor-default" : "cursor-pointer",
        className
      )}
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
