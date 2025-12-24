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

export function OFFButton({
  onClick,
  className = "",
  title = "OFF",
  height = 32,
  isMobile = false,
}: Props) {
  const h = typeof height === "number" ? `${height}px` : height;

  const iconSrcMobile = `${import.meta.env.BASE_URL}0002_icon_edit_off_sp.png`;
  const iconSrc = `${import.meta.env.BASE_URL}0002_icon_edit_off_pc.png`;
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
        height: h,
        width: "auto",
        padding: 0,
        background: "transparent",
        border: "none",
        lineHeight: 0,
      }}
    >
      <img
        src={isMobile ? iconSrcMobile : iconSrc}
        alt="OFF"
        draggable={false}
        style={{
          height: "100%",
          width: "auto",
          objectFit: "contain",
          pointerEvents: "none",
          display: "block",
        }}
      />
    </button>
  );
}
