import clsx from "clsx";

/* =========================
   枠線: 赤 / 背景: #000A1B / 文字: 白
   ========================= */
export function ButtonRed({
  children,
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        "rounded-md border border-red-600 bg-[#000A1B] px-6 py-2 text-sm font-semibold text-white",
        "hover:bg-red-900/20 active:scale-95 transition",
        disabled ? "opacity-50 cursor-default" : "cursor-pointer", // ← 共通ルール
        className
      )}
    >
      {children}
    </button>
  );
}
