// src/pages/parts/geometryColors.ts
import type { Geometry } from "@/features/types";

export type AreaColorKey = "takeoffArea" | "flightArea" | "safetyArea" | "audienceArea";

/** 各エリアのデフォルト色 */
export const DEFAULT_GEOMETRY_COLORS: Record<AreaColorKey, string> = {
  takeoffArea: "#ed1b24",
  flightArea: "#00c853",
  safetyArea: "#ff9800",
  audienceArea: "#1e88e5",
};

/** 各エリアのデフォルト塗りつぶし透明度（0〜1） */
export const DEFAULT_GEOMETRY_FILL_OPACITY: Record<AreaColorKey, number> = {
  takeoffArea: 0.4,
  flightArea: 0.4,
  safetyArea: 0.4,
  audienceArea: 0.12,
};

/** ジオメトリから指定エリアの色を取得（未指定時はデフォルト） */
export function getAreaColor(geom: Geometry | null | undefined, key: AreaColorKey): string {
  if (!geom) return DEFAULT_GEOMETRY_COLORS[key];
  const area = geom[key];
  if (!area || typeof area !== "object") return DEFAULT_GEOMETRY_COLORS[key];
  const c = (area as { color?: string }).color;
  return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c) ? c : DEFAULT_GEOMETRY_COLORS[key];
}

/** ジオメトリから指定エリアの塗りつぶし透明度を取得（未指定時はデフォルト） */
export function getAreaFillOpacity(geom: Geometry | null | undefined, key: AreaColorKey): number {
  if (!geom) return DEFAULT_GEOMETRY_FILL_OPACITY[key];
  const area = geom[key];
  if (!area || typeof area !== "object") return DEFAULT_GEOMETRY_FILL_OPACITY[key];
  const o = (area as { fillOpacity?: number }).fillOpacity;
  return typeof o === "number" && o >= 0 && o <= 1 ? o : DEFAULT_GEOMETRY_FILL_OPACITY[key];
}
