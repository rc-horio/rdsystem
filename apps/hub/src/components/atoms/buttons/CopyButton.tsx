import clsx from "clsx";

/* =========================
   コピーボタン
   ========================= */
export function CopyButton({
  onClick,
  className = "",
  title = "コピー",
}: {
  onClick: () => void;
  className?: string;
  title?: string;
}) {
  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}_0001_icon_copy.png`;

  return (
    <button
      onClick={onClick}
      className={clsx("p-0 inline-flex items-center", className)}
      title={title}
      style={{ marginLeft: "4px" }} // 左側の入力欄と近づける
    >
      <img
        src={iconSrc}
        alt="コピー"
        className="w-5 h-5" // 小さめのサイズに変更
        draggable={false}
      />
    </button>
  );
}
