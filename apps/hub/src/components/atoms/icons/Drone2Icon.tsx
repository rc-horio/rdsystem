// src/components/atoms/icons/Drone2Icon.tsx
import clsx from "clsx";

/* =========================
   ドローン2アイコン
   ========================= */
export function Drone2Icon({
  className = "",
  alt = "ドローン2",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}_0001_icon_drone2.png`;
  
  return (
    <img
      src={iconSrc}
      alt={alt}
      className={clsx("w-6 h-6", className)}
      draggable={false}
      {...props}
    />
  );
}
