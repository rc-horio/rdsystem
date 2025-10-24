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
      ? `${import.meta.env.BASE_URL}icon_SAVE_OFF_mobile.png`
      : `${import.meta.env.BASE_URL}icon_SAVE_OFF.png`
    : isMobile
    ? `${import.meta.env.BASE_URL}icon_SAVE_ON_mobile.png`
    : `${import.meta.env.BASE_URL}_0001_icon_SAVE.png`;

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
        <svg
          viewBox="0 0 24 24"
          role="img"
          aria-label="保存中"
          style={{ height: "100%", width: "auto", display: "block" }}
          className="animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            fill="currentColor"
            className="opacity-75"
          />
        </svg>
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
