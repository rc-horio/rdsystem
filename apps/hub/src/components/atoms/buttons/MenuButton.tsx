import clsx from "clsx";

/* =========================
   メニューボタン
   ========================= */
export function MenuButton({
  onClick,
  className = "",
  title = "メニュー",
}: {
  onClick: () => void;
  className?: string;
  title?: string;
}) {

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}_0003_icon_menu.png`;

  return (
    <button
      onClick={onClick}
      className={clsx("p-0 inline-flex items-center", className)}
      title={title}
      style={{ marginLeft: "4px" }}
    >
      <img
        src={iconSrc}
        alt="メニュー"
        className="w-5 h-5"
        draggable={false}
      />
    </button>
  );
}
