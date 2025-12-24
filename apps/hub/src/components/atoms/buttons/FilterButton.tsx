import clsx from "clsx";

/* =========================
   フィルターボタン
   ========================= */
export function FilterButton({
  onClick,
  className = "",
  title = "フィルター",
}: {
  onClick: () => void;
  className?: string;
  title?: string;
}) {

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}0005_icon_filter.png`;
  
  return (
    <button
      onClick={onClick}
      className={clsx("p-0 inline-flex items-center", className)}
      title={title}
      style={{ marginLeft: "4px" }}
    >
      <img
        src={iconSrc}
        alt="フィルター"
        className="w-3 h-3"
        draggable={false}
      />
    </button>
  );
}
