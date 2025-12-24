// src/components/atoms/buttons/HiddenIconButton.tsx
import clsx from "clsx";

type Props = {
  onClick: () => void;
  className?: string;
  title?: string;
  /** ボタンの高さ（px or CSS長さ）。例: 32, "40px", "2.5rem" */
  height?: number | string;
};

export function HiddenIconButton({
  onClick,
  className = "",
  title = "閉じる",
  height = 32,
}: Props) {
  const h = typeof height === "number" ? `${height}px` : height;

  const iconSrc = `${import.meta.env.BASE_URL}0006_icon_hidden.png`;

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
        height: h,
        width: "auto",
      }}
    >
      <img
        src={iconSrc}
        alt={title}
        draggable={false}
        style={{
          height: "100%",
          width: "auto",
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
