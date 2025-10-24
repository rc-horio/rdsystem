import clsx from "clsx";

/* =========================
   スケジュールボタン（DeleteItemButton と書き方統一）
   ========================= */
export function ScheduleButton({
  onClick,
  className = "",
  title = "詳細",
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
  const iconSrc = `${import.meta.env.BASE_URL}_0000_icon_schedule.png`;

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
        alt="詳細"
        className={ICON_CLASS}
        draggable={false}
      />
    </button>
  );
}
