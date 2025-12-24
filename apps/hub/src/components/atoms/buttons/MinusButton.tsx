import clsx from "clsx";

/* =========================
   マイナスボタン
   ========================= */
export function MinusButton({
  onClick,
  className = "",
  title = "閉じる",
}: {
  onClick: () => void;
  className?: string;
  title?: string;
}) {

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}0007_icon_minus.png`;
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        "p-0 inline-flex items-center cursor-pointer", // ★ hand cursor
        className
      )}
      title={title}
      style={{ marginLeft: "4px" }}
      type="button"
    >
      <img
        src={iconSrc}
        alt="閉じる"
        className="w-5 h-5 pointer-events-none" // ★ pointer-events-none
        draggable={false}
      />
    </button>
  );
}
