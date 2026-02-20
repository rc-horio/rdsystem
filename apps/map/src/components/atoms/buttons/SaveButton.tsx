// src/components/atoms/buttons/SaveButton.tsx
import clsx from "clsx";

type SaveButtonProps = {
  onClick?: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  /** ボタンの高さ（px or CSS長さ）。例: 32, "40px", "2.5rem" */
  height?: number | string;
  /** 互換用: モバイルアイコン切替だけに使用（高さは height を使う） */
  isMobile?: boolean;
};

export function SaveButton({
  onClick,
  className = "",
  title = "保存",
  disabled = false,
  loading = false,
  type = "button",
  height = 32,
  isMobile = false,
}: SaveButtonProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  const isInactive = disabled || loading;

  const iconSrc = isInactive
    ? isMobile
      ? `${import.meta.env.BASE_URL}0001_icon_save_off_sp.png`
      : `${import.meta.env.BASE_URL}0001_icon_save_off_pc.png`
    : isMobile
    ? `${import.meta.env.BASE_URL}0001_icon_save_on_sp.png`
    : `${import.meta.env.BASE_URL}0001_icon_save_on_pc.png`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isInactive}
      aria-disabled={isInactive}
      aria-busy={loading}
      aria-label={title}
      title={title}
      className={clsx(
        "inline-flex items-center justify-center select-none focus:outline-none focus:ring-2 focus:ring-red-500",
        isInactive ? "cursor-default opacity-50" : "cursor-pointer",
        className
      )}
      style={{
        height: h, // 高さだけ固定
        width: "auto", // 横は自動
        padding: 0,
        background: "transparent",
        border: "none",
        lineHeight: 0,
      }}
    >
      {loading ? (
        <span
          role="img"
          aria-label="保存中"
          className="inline-flex items-center justify-center animate-pulse text-current"
          style={{ height: "100%", fontSize: "1.2em", lineHeight: 1 }}
        >
          …
        </span>
      ) : (
        <img
          src={iconSrc}
          alt=""
          draggable={false}
          style={{
            height: "100%", // 親ボタンの高さにフィット
            width: "auto", // 比率維持
            objectFit: "contain",
            pointerEvents: "none",
            display: "block",
          }}
        />
      )}
    </button>
  );
}
