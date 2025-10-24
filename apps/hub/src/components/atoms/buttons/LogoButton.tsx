// apps/hub/src/components/atoms/buttons/LogoButton.tsx
import { Link } from "react-router-dom";
import clsx from "clsx";

type Props = {
  to?: string;
  onClick?: () => void;
  src?: string;
  size?: number;
  className?: string;
  label?: string;
};

// 末尾/先頭スラを吸収して結合
const join = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

export function LogoButton({
  onClick,
  to,
  src,
  className,
  size = 28,
  label = "メニューへ",
}: Props) {
  const imgSrc = src ?? `${import.meta.env.BASE_URL}apple-touch-icon.png`;

  // デフォルトは Auth アプリの /auth/select へ
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

  // 同一アプリ内 → Link / 他アプリや絶対URL（/auth/select 等）→ a
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
