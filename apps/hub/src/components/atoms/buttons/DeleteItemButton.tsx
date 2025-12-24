import clsx from "clsx";

type DeleteItemButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  title?: string;
  tabIndex?: number;
};
export function DeleteItemButton({
  onClick,
  disabled = false,
  className = "",
  title = "項目削除",
  tabIndex,
}: DeleteItemButtonProps) {
  const BTN_CLASS = clsx(
    "inline-flex items-center justify-center",
    // ★ボタンサイズ変更
    "h-9 w-9 md:h-8 md:w-8",
    disabled ? "opacity-50 cursor-default" : "cursor-pointer",
    className
  );
  const ICON_CLASS = "h-[70%] w-auto object-contain pointer-events-none";

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}0014_icon_delete.png`;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={BTN_CLASS}
      title={title}
      aria-label={title}
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
