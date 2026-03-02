/**
 * 空港高さ制限計算 - 共通ユーティリティ
 * Phase 1 で calculator.ts から抽出
 */

import type { SurfaceType } from "../types";
import type { Coord } from "../data/haneda";

/** 表面タイプ文字列から SurfaceType へのマッピング */
export const STR_TO_SURFACE: Record<string, SurfaceType> = {
  着陸帯: "landing_strip",
  進入表面: "approach",
  延長進入表面: "extended_approach",
  転移表面: "transition",
  水平表面: "horizontal",
  円錐表面: "conical",
  外側水平表面: "outer_horizontal",
};

/** 高さと表面タイプ文字列のペア */
export interface HeightEntry {
  val: number;
  str: string;
}

/** 進入表面の高さ計算（math_sinnyu）勾配1/50 */
export function mathSinnyu(
  g: typeof google.maps,
  chakP: Coord,
  sinnP: Coord,
  clickP: google.maps.LatLng,
  he: number
): number {
  const chakLatlng = new g.LatLng(chakP.lat, chakP.lng);
  const sinnLatlng = new g.LatLng(sinnP.lat, sinnP.lng);
  const d1 = g.geometry!.spherical.computeHeading(chakLatlng, sinnLatlng);
  const d2 = g.geometry!.spherical.computeHeading(chakLatlng, clickP);
  const d = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(chakLatlng, clickP);
  const teihen = shahen * Math.cos((d * Math.PI) / 180);
  return he + teihen * (1 / 50);
}

/** 進入表面の高さ計算（math_sinnyu40）勾配1/40 */
export function mathSinnyu40(
  g: typeof google.maps,
  chakP: Coord,
  sinnP: Coord,
  clickP: google.maps.LatLng,
  he: number
): number {
  const chakLatlng = new g.LatLng(chakP.lat, chakP.lng);
  const sinnLatlng = new g.LatLng(sinnP.lat, sinnP.lng);
  const d1 = g.geometry!.spherical.computeHeading(chakLatlng, sinnLatlng);
  const d2 = g.geometry!.spherical.computeHeading(chakLatlng, clickP);
  const d = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(chakLatlng, clickP);
  const teihen = shahen * Math.cos((d * Math.PI) / 180);
  return he + teihen * (1 / 40);
}

/** 進入表面の高さ計算（勾配指定） */
export function mathSinnyuWithPitch(
  g: typeof google.maps,
  chakP: Coord,
  sinnP: Coord,
  clickP: google.maps.LatLng,
  he: number,
  pitch: number
): number {
  const chakLatlng = new g.LatLng(chakP.lat, chakP.lng);
  const sinnLatlng = new g.LatLng(sinnP.lat, sinnP.lng);
  const d1 = g.geometry!.spherical.computeHeading(chakLatlng, sinnLatlng);
  const d2 = g.geometry!.spherical.computeHeading(chakLatlng, clickP);
  const d = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(chakLatlng, clickP);
  const teihen = shahen * Math.cos((d * Math.PI) / 180);
  return he + teihen * pitch;
}

/** 転移表面の計算(a)（math_tennia）
 * 公式: edgeHeight は滑走路中心線に沿った距離（底辺）で算出。斜辺ではない。
 */
export function mathTennia(
  g: typeof google.maps,
  np: Coord,
  sp: Coord,
  nh: number,
  sh: number,
  cp: google.maps.LatLng,
  ta: number,
  hb: number
): number {
  const npLatlng = new g.LatLng(np.lat, np.lng);
  const spLatlng = new g.LatLng(sp.lat, sp.lng);
  let d1 = g.geometry!.spherical.computeHeading(npLatlng, spLatlng);
  let d2 = g.geometry!.spherical.computeHeading(npLatlng, cp);
  if (d2 < 0) d2 += 180;
  const kakudo = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(npLatlng, cp);
  const takasa = shahen * Math.sin((kakudo * Math.PI) / 180);
  const teihen = shahen * Math.cos((kakudo * Math.PI) / 180);
  const hm = nh + ((sh - nh) * teihen) / ta;
  const dm = takasa - hb / 2;
  return hm + dm * (1 / 7);
}

/** 転移表面の計算(b)（math_tennib）
 * 公式: クリック点を通る、着陸帯短辺と平行な直線と、進入表面辺の交点までの距離を使用。
 * p1=landing_area_center, p2=landing_area_vertex, p3=landing_area_vertex, p4=approach_surface_vertex
 */
export function mathTennib(
  g: typeof google.maps,
  p1: Coord,
  p2: Coord,
  p3: Coord,
  p4: Coord,
  cp: google.maps.LatLng,
  hm: number
): number {
  const p1y = p1.lat;
  const p1x = p1.lng;
  const p2y = p2.lat;
  const p2x = p2.lng;
  const p3y = p3.lat;
  const p3x = p3.lng;
  const p4y = p4.lat;
  const p4x = p4.lng;
  const p5y = Number(cp.lat().toFixed(8));
  const p5x = Number(cp.lng().toFixed(8));

  const parallelSlope = (p2y - p1y) / (p2x - p1x);
  const parallelIntercept = -(parallelSlope * p5x) + p5y;
  const approachSlope = (p4y - p3y) / (p4x - p3x);
  const approachIntercept = -(approachSlope * p3x) + p3y;
  const xc = (approachIntercept - parallelIntercept) / (parallelSlope - approachSlope);
  const yc = parallelSlope * xc + parallelIntercept;
  const dmP = new g.LatLng(yc, xc);
  const dm = g.geometry!.spherical.computeDistanceBetween(cp, dmP);
  return hm + dm * (1 / 7);
}

/** 転移表面の計算(b)（math_tennib_hei）着陸帯端 pA,pB を考慮 */
export function mathTennibHei(
  g: typeof google.maps,
  _p1: Coord,
  _p2: Coord,
  p3: Coord,
  p4: Coord,
  cp: google.maps.LatLng,
  hm: number,
  pA: Coord,
  pB: Coord
): number {
  const p3y = p3.lat;
  const p3x = p3.lng;
  const p4y = p4.lat;
  const p4x = p4.lng;
  const p5y = Number(cp.lat().toFixed(8));
  const p5x = Number(cp.lng().toFixed(8));
  const pAy = pA.lat;
  const pAx = pA.lng;
  const pBy = pB.lat;
  const pBx = pB.lng;

  const pABAngle = (pBy - pAy) / (pBx - pAx);
  const p5ABAngle = pABAngle;
  const p5ABBase = -(p5ABAngle * p5x) + p5y;
  const p34Angle = (p4y - p3y) / (p4x - p3x);
  const p34Base = -(p34Angle * p3x) + p3y;
  const xc = (p34Base - p5ABBase) / (p5ABAngle - p34Angle);
  const yc = p5ABAngle * xc + p5ABBase;
  const dmP = new g.LatLng(yc, xc);
  const dm = g.geometry!.spherical.computeDistanceBetween(cp, dmP);
  return hm + dm * (1 / 7);
}

/** 円錐表面の高さ計算（math_ensui） */
export function mathEnsui(kyori: number): number {
  return 6.4 + ((kyori - 4000) * 1) / 50 + 45;
}

/** 直線の交差判定（intersectM） */
function intersectM(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): number {
  return (
    (p1.x - p2.x) * (p3.y - p1.y) +
    (p1.y - p2.y) * (p1.x - p3.x)
  ) * (
    (p1.x - p2.x) * (p4.y - p1.y) +
    (p1.y - p2.y) * (p1.x - p4.x)
  );
}

/** 三角形の包含判定（PosIncludeTri） */
function posIncludeTri(
  tp1: { x: number; y: number },
  tp2: { x: number; y: number },
  tp3: { x: number; y: number },
  xp: { x: number; y: number }
): boolean {
  const c = {
    x: (tp1.x + tp2.x + tp3.x) / 3,
    y: (tp1.y + tp2.y + tp3.y) / 3,
  };
  const chk1 = intersectM(tp1, tp2, xp, c);
  if (chk1 < 0) return false;
  const chk2 = intersectM(tp1, tp3, xp, c);
  if (chk2 < 0) return false;
  const chk3 = intersectM(tp2, tp3, xp, c);
  if (chk3 < 0) return false;
  return true;
}

/** 包含判定（chk_Inclusion） */
export function chkInclusion(
  point1: Coord,
  point2: Coord,
  point3: Coord,
  clickPoint: google.maps.LatLng
): boolean {
  const p1 = { x: point1.lat, y: point1.lng };
  const p2 = { x: point2.lat, y: point2.lng };
  const p3 = { x: point3.lat, y: point3.lng };
  const cp = {
    x: Number(clickPoint.lat().toFixed(8)),
    y: Number(clickPoint.lng().toFixed(8)),
  };
  return posIncludeTri(p1, p2, p3, cp);
}

/** ポリゴン内に点が含まれるか */
export function isPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  polygonCoords: readonly { lat: number; lng: number }[]
): boolean {
  const point = new g.LatLng(lat, lng);
  const path = polygonCoords.map((c) => new g.LatLng(c.lat, c.lng));
  return g.geometry!.poly.containsLocation(point, new g.Polygon({ paths: path }));
}
