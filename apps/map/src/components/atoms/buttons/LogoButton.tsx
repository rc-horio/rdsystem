// src/components/atoms/buttons/LogoButton.tsx
import { Link } from "react-router-dom";
import clsx from "clsx";

type Props = {
  onClick?: () => void;
  to?: string;
  href?: string;
  src?: string;
  /** 画像の高さ（px or CSS長さ）。例: 20, 28, "32px", "2rem" */
  height?: number | string;
  className?: string;
  title?: string;
};

export function LogoButton({
  onClick,
  to,
  href,
  src = `${import.meta.env.BASE_URL}apple-touch-icon.png`,
  height = 28,
  className = "",
  title = "メニューへ",
}: Props) {
  const h = typeof height === "number" ? `${height}px` : height;

  const outerClass = clsx(
    // 外側は高さを持たない。行高さなどの影響を排除
    "inline-flex items-center justify-center p-0 bg-transparent border-0 cursor-pointer select-none leading-none",
    className
  );

  // 画像に高さを直指定（width は比率で自動）
  const img = (
    <img
      src={src}
      alt={title}
      draggable={false}
      style={{
        height: h,
        width: "auto",
        objectFit: "contain",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        className={outerClass}
        // 外側は高さ未指定（= 中の画像サイズに従う）
        style={{}}
      >
        {img}
      </button>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        title={title}
        aria-label={title}
        className={outerClass}
        style={{}}
      >
        {img}
      </a>
    );
  }

  return (
    <Link
      to={to ?? "/select"}
      title={title}
      aria-label={title}
      className={outerClass}
      style={{}}
    >
      {img}
    </Link>
  );
}
