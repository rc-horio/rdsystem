import clsx from "clsx";

export function ONButton({
  onClick,
  className = "",
  title = "ON",
  isMobile = false,
}: {
  onClick: () => void;
  className?: string;
  title?: string;
  isMobile?: boolean;
}) {
  const BTN_CLASS = isMobile ? "h-12 w-12 rounded-lg" : "h-8 w-12 rounded";
  const ICON_CLASS = "h-full w-auto object-contain pointer-events-none";
  
  // 共閉staticの画像を /hub/ /map/ に合わせて解決
  const iconSrcMobile = `${import.meta.env.BASE_URL}icon_ON_mobile.png`;
  const iconSrc = `${import.meta.env.BASE_URL}_0002_icon_ON.png`;
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center shrink-0 cursor-pointer",
        BTN_CLASS,
        className
      )}
      title={title}
      type="button"
    >
      <img
        src={isMobile ? iconSrcMobile : iconSrc}
        alt="ON"
        className={clsx("object-contain pointer-events-none", ICON_CLASS)}
        draggable={false}
      />
    </button>
  );
}
