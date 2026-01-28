// apps/map/src/components/atoms/buttons/LogoButton.tsx
import clsx from "clsx";

type Props = {
  to?: string;
  onClick?: () => void;
  src?: string;
  size?: number | string;
  className?: string;
  label?: string;
};

export function LogoButton({
  onClick,
  to,
  src,
  className = "",
  size = 28,
  label = "メニューへ",
}: Props) {
  const h = typeof size === "number" ? `${size}px` : size;
  const imgSrc = src ?? `${import.meta.env.BASE_URL}apple-touch-icon.png`;

  // 既定は ルート直下の /select（CloudFront Function が auth/index.html を返す）
  const defaultHref = `${window.location.origin}/select`;
  const href = to ?? defaultHref;

  const common = {
    className: clsx(
      "inline-flex items-center justify-center p-0 bg-transparent border-0 cursor-pointer select-none leading-none",
      className
    ),
    "aria-label": label,
    style: { width: size, height: size },
  } as const;

  const img = (
    <img
      src={imgSrc}
      alt={label}
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
      <button {...common} onClick={onClick} type="button">
        {img}
      </button>
    );
  }

  // 別アプリ扱いなので常にフルページ遷移
  return (
    <a href={href} {...common}>
      {img}
    </a>
  );
}
