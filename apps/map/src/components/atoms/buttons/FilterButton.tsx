// src/components/atoms/buttons/FilterButton.tsx
import clsx from "clsx";

type Props = {
  onClick: () => void;
  className?: string;
  title?: string;
  /** ボタンの高さ（px or CSS長さ）。例: 32, "40px", "2.5rem" */
  height?: number | string;
};

export function FilterButton({
  onClick,
  className = "",
  title = "フィルター",
  height = 32, // ← デフォルトの高さ
}: Props) {
  const h = typeof height === "number" ? `${height}px` : height;

  const iconSrc = `${import.meta.env.BASE_URL}_0004_icon_filter.png`;
  
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex items-center justify-center p-0 bg-transparent border-0 select-none",
        className
      )}
      style={{
        height: h, // 高さだけ固定
        width: "auto", // 横幅はオート
      }}
    >
      <img
        src={iconSrc}
        alt={title}
        draggable={false}
        style={{
          height: "100%", // 画像はボタン高さにフィット
          width: "auto", // 横は比率で自動
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
