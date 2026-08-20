// src/components/atoms/icons/Drone2Icon.tsx
import clsx from "clsx";
import { Drone1Icon } from "./Drone1Icon";

export const DRONE_SPACING_ICON_PX = 40;
export const DRONE_SPACING_GAP_PX = 48;
const LINE_END_GAP_PX = 6;

type Drone2IconProps = {
  className?: string;
  /** 各機体アイコンの向き。左の単機アイコンと揃える */
  rotationDeg?: number;
  cols?: number;
  rows?: number;
  /** 1機の表示サイズ。未指定なら DRONE_SPACING_ICON_PX */
  iconPx?: number;
  /** 機間ギャップ。未指定なら DRONE_SPACING_GAP_PX */
  gapPx?: number;
};

/* =========================
   ドローン間隔アイコン（単機アイコン＋白線）
   ========================= */
export function Drone2Icon({
  className = "",
  rotationDeg = 180,
  cols = 2,
  rows = 2,
  iconPx = DRONE_SPACING_ICON_PX,
  gapPx = DRONE_SPACING_GAP_PX,
}: Drone2IconProps) {
  const colCount = Math.max(2, cols);
  const rowCount = Math.max(2, rows);
  const width = colCount * iconPx + (colCount - 1) * gapPx;
  const height = rowCount * iconPx + (rowCount - 1) * gapPx;
  const inset = iconPx / 2 + LINE_END_GAP_PX;
  const centerAt = (i: number) => i * (iconPx + gapPx) + iconPx / 2;

  const hLines: { x1: number; x2: number; y: number }[] = [];
  const vLines: { y1: number; y2: number; x: number }[] = [];
  for (let r = 0; r < rowCount; r++) {
    const y = centerAt(r);
    for (let c = 0; c < colCount - 1; c++) {
      hLines.push({ x1: centerAt(c) + inset, x2: centerAt(c + 1) - inset, y });
    }
  }
  for (let c = 0; c < colCount; c++) {
    const x = centerAt(c);
    for (let r = 0; r < rowCount - 1; r++) {
      vLines.push({ y1: centerAt(r) + inset, y2: centerAt(r + 1) - inset, x });
    }
  }

  return (
    <div
      className={clsx("relative shrink-0", className)}
      style={{ width, height }}
      aria-label="機体間隔"
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
        aria-hidden
      >
        {hLines.map((ln, i) => (
          <line
            key={`h-${i}`}
            x1={ln.x1}
            y1={ln.y}
            x2={ln.x2}
            y2={ln.y}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
        {vLines.map((ln, i) => (
          <line
            key={`v-${i}`}
            x1={ln.x}
            y1={ln.y1}
            x2={ln.x}
            y2={ln.y2}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${colCount}, ${iconPx}px)`,
          gap: gapPx,
        }}
      >
        {Array.from({ length: colCount * rowCount }).map((_, i) => (
          <Drone1Icon
            key={i}
            className="block"
            style={{ width: iconPx, height: iconPx }}
            rotationDeg={rotationDeg}
            alt=""
          />
        ))}
      </div>
    </div>
  );
}
