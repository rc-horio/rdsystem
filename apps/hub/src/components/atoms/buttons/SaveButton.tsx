import clsx from "clsx";

type SaveButtonProps = {
  onClick?: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  isMobile?: boolean;
};

export function SaveButton({
  onClick,
  className = "",
  title = "保存",
  disabled = false,
  loading = false,
  type = "button",
  isMobile = false,
}: SaveButtonProps) {
  const isInactive = disabled || loading;
  const BTN_CLASS = isMobile ? "h-12 w-8 rounded-lg" : "h-8 w-12 rounded";
  const ICON_CLASS = "h-full w-auto object-contain pointer-events-none";

  const base = import.meta.env.BASE_URL;
  const iconSrc = isInactive
    ? isMobile
      ? `${base}0001_icon_save_off_sp.png`
      : `${base}0001_icon_save_off_pc.png`
    : isMobile
    ? `${base}0001_icon_save_on_sp.png`
    : `${base}0001_icon_save_on_pc.png`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isInactive}
      aria-disabled={isInactive}
      aria-busy={loading}
      aria-label={title}
      className={clsx(
        "inline-flex items-center justify-center shrink-0",
        "focus:outline-none focus:ring-2 focus:ring-red-500",
        BTN_CLASS,
        !isInactive ? "cursor-pointer" : "cursor-default opacity-50",
        className
      )}
      title={title}
    >
      {loading ? (
        <svg
          className={clsx(ICON_CLASS, "animate-spin")}
          viewBox="0 0 24 24"
          role="img"
          aria-label="保存中"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            fill="currentColor"
            className="opacity-75"
          />
        </svg>
      ) : (
        <img src={iconSrc} alt="" className={ICON_CLASS} draggable={false} />
      )}
    </button>
  );
}
