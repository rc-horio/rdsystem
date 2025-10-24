// src/components/atoms/buttons/AddItemButton.tsx
import clsx from "clsx";

/* =========================
   項目追加ボタン
   ========================= */
export function AddItemButton({
  onClick,
  className = "",
  title = "項目追加",
  disabled = false,
}: {
  onClick: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
  const BTN_CLASS = clsx(
    "inline-flex items-center justify-center",
    // ★ボタンサイズ変更
    "h-9 w-9 md:h-8 md:w-8",
    disabled ? "opacity-50 cursor-default" : "cursor-pointer",
    className
  );

  const ICON_CLASS = "h-[70%] w-auto object-contain pointer-events-none";

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}_0007_icon_plus.png`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={BTN_CLASS}
    >
      <img src={iconSrc} alt="" className={ICON_CLASS} draggable={false} />
    </button>
  );
}
