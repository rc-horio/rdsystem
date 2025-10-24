import { Link } from "react-router-dom"; // ★追加
import clsx from "clsx";

type Props = {
  to?: string;
  onClick?: () => void;
  /** 明示的に上書きしたい時だけ使う。未指定なら共通アイコンを使う */
  src?: string;
  size?: number; // px
  className?: string;
  label?: string;
};

export function LogoButton({
  to,
  onClick,
  src, // ← デフォルトは中で計算
  size = 28,
  className,
  label = "メニューへ",
}: Props) {
  // 共通アイコン（static/apple-touch-icon.png）を /hub/ /map/ に合わせて解決
  const imgSrc = src ?? `${import.meta.env.BASE_URL}apple-touch-icon.png`;
  const common = {
    className: clsx(
      "inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-red-600/70 active:scale-95 transition",
      className
    ),
    "aria-label": label,
    style: { width: size, height: size },
  } as const;

  const img = (
    <img
      src={imgSrc}
      alt={label}
      style={{ width: size, height: size }}
      className="rounded"
      draggable={false}
    />
  );

  if (onClick) {
    return (
      <button {...common} onClick={onClick} type="button">
        {img}
      </button>
    );
  }

  return (
    <Link to={to ?? "/select"} {...common}>
      {img}
    </Link>
  );
}
