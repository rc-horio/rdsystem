// src/components/atoms/buttons/ONButton.tsx
import clsx from "clsx";

type Props = {
  onClick: () => void;
  className?: string;
  title?: string;
  /** ボタンの高さ（px or CSS長さ）。例: 32, "40px", "2.5rem" */
  height?: number | string;
  /** 互換用: モバイルアイコン切替だけに使用（高さは height を使う） */
  isMobile?: boolean;
};

export function ONButton({
  onClick,
  className = "",
  title = "ON",
  height = 32,
  isMobile = false,
}: Props) {
  const h = typeof height === "number" ? `${height}px` : height;

  const iconSrcMobile = `${import.meta.env.BASE_URL}icon_ON_mobile.png`;
  const iconSrc = `${import.meta.env.BASE_URL}_0002_icon_ON.png`;
  return (
    <button
      onClick={onClick}
      type="button"
      title={title}
      className={clsx(
        "inline-flex items-center justify-center select-none cursor-pointer",
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
      <img
        src={isMobile ? iconSrcMobile : iconSrc}
        alt="ON"
        draggable={false}
        style={{
          height: "100%", // 親ボタンの高さにフィット
          width: "auto", // 比率維持
          objectFit: "contain",
          pointerEvents: "none",
          display: "block",
        }}
      />
    </button>
  );
}
