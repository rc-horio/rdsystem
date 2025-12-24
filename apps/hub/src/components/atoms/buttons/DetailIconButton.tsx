// src/components/atoms/buttons/DetailIconButton.tsx
import clsx from "clsx";

/* =========================
   詳細モーダルを開くボタン
   ========================= */
export function DetailIconButton({
  onClick,
  className = "",
  title = "スケジュール詳細",
  tabIndex,
}: {
  onClick: () => void;
  className?: string;
  title?: string;
  tabIndex?: number;
}) {
  const BTN_CLASS = clsx(
    "inline-flex items-center justify-center",
    // ★ボタンサイズ変更
    "h-9 w-9 md:h-8 md:w-8",
    "cursor-pointer",
    className
  );
  const ICON_CLASS = "h-[70%] w-auto object-contain pointer-events-none";

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}0003_icon_detail.png`;

  return (
    <button
      onClick={onClick}
      className={BTN_CLASS}
      title={title}
      aria-label={title}
      type="button"
      tabIndex={tabIndex}
    >
      <img
        src={iconSrc}
        alt=""
        className={ICON_CLASS}
        draggable={false}
      />
    </button>
  );
}
