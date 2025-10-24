// apps/map/src/components/atoms/buttons/LogoButton.tsx
import { Link } from "react-router-dom";
import clsx from "clsx";

type Props = {
  to?: string;
  onClick?: () => void;
  src?: string;
  size?: number | string;
  className?: string;
  label?: string;
};

// 末尾/先頭スラッシュを吸収して結合
const join = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

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

  // 既定は Auth アプリの /auth/select に移動
  const authBase =
    import.meta.env.VITE_AUTH_BASE_URL || `${window.location.origin}/auth/`;
  const defaultHref = join(authBase, "select");
  const href = to ?? defaultHref;

  // 同一アプリ（現在の basename 配下）かどうか判定
  const sameApp = (() => {
    const base = import.meta.env.BASE_URL || "/";
    try {
      const u = new URL(href, window.location.origin);
      return u.origin === window.location.origin && u.pathname.startsWith(base);
    } catch {
      // 相対パス指定など
      return (
        href.startsWith(base) || href.startsWith("./") || href.startsWith("../")
      );
    }
  })();

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

  // 別アプリや外部 → a でフルページ遷移（/auth/select など）
  return sameApp ? (
    <Link to={href.replace(window.location.origin, "")} {...common}>
      {img}
    </Link>
  ) : (
    <a href={href} {...common}>
      {img}
    </a>
  );
}
