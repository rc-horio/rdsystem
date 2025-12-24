// src/components/atoms/icons/Drone1Icon.tsx
import clsx from "clsx";

type Drone1IconProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** 0 / 90 / 180 / 270 のいずれかを想定（他の数値でもOK） */
  rotationDeg?: number;
};

/* =========================
   ドローン1アイコン
   ========================= */
export function Drone1Icon({
  className = "",
  alt = "ドローン1",
  rotationDeg = 0,
  style,
  ...props
}: Drone1IconProps) {

  // 共通staticの画像を /hub/ /map/ に合わせて解決
  const iconSrc = `${import.meta.env.BASE_URL}0010_icon_drone1.png`;
  
  return (
    <img
      src={iconSrc}
      alt={alt}
      className={clsx(
        "w-6 h-6 select-none pointer-events-none transition-transform duration-200",
        className
      )}
      draggable={false}
      style={{
        transform: `rotate(${rotationDeg}deg)`,
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    />
  );
}
