// apps/hub/src/components/atoms/buttons/LogoButton.tsx
import clsx from "clsx";

type Props = {
  to?: string;
  onClick?: () => void;
  src?: string;
  size?: number;
  className?: string;
  label?: string;
};

// TODO: ローカルサーバー起動用と本番デプロイ用のコードを分ける
/**
 * VITE_DISABLE_AUTH=true のときは Auth を経由しない暫定動作にする
 * - true  : ローカル暫定（Auth/selectへ戻さず、任意のトップへ）
 * - false : 通常（/auth/select）
 */
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";

export function LogoButton({
  onClick,
  to,
  src,
  className,
  size = 28,
  label = "メニューへ",
}: Props) {
  const imgSrc = src ?? `${import.meta.env.BASE_URL}apple-touch-icon.png`;

  const defaultHref = `${window.location.origin}/select`;
  const href = to ?? defaultHref;

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
    <a href={href} {...common}>
      {img}
    </a>
  );
}
