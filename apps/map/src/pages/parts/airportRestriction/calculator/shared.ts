import type { SurfaceType } from "../types";

type Coord = { lat: number; lng: number };

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

/**
 * 公式高さ回答システム util.js の小数演算。
 * 進入・転移の制限高を公式 map.bundle.js と同じ式で出すために使う。
 */
function kixDecimalsScale(a: number, b: number): number {
  const d1 = (a.toString().split(".")[1] ?? "").length;
  const d2 = (b.toString().split(".")[1] ?? "").length;
  return Math.max(d1, d2);
}

export function decimalsAddition(a: number, b: number): number {
  const n = kixDecimalsScale(a, b);
  const p = Math.pow(10, n);
  return (a * p + b * p) / p;
}

export function decimalsSubstract(a: number, b: number): number {
  const n = kixDecimalsScale(a, b);
  const p = Math.pow(10, n);
  return (a * p - b * p) / p;
}

export function decimalsMultiplication(a: number, b: number): number {
  const d1 = (a.toString().split(".")[1] ?? "").length;
  const d2 = (b.toString().split(".")[1] ?? "").length;
  const divisor = Math.pow(10, d1 + d2);
  return ((a * Math.pow(10, d1)) * (b * Math.pow(10, d2))) / divisor;
}

export function decimalsDivision(a: number, b: number): number {
  const n = kixDecimalsScale(a, b);
  const p = Math.pow(10, n);
  return (a * p) / (b * p);
}

/**
 * 函館公式 ApproachSurface.getLimitHeightOfApproachSurface。
 * cos に abs を付けない（函館 map.bundle.js どおり）。
 */
export function hakodateApproachHeight(
  g: typeof google.maps,
  landingCenter: Coord,
  approachCenter: Coord,
  clickP: google.maps.LatLng,
  runwayHeight: number,
  pitch: number
): number {
  const landing = new g.LatLng(landingCenter.lat, landingCenter.lng);
  const approach = new g.LatLng(approachCenter.lat, approachCenter.lng);
  const heading1 = g.geometry!.spherical.computeHeading(landing, approach);
  const heading2 = g.geometry!.spherical.computeHeading(landing, clickP);
  const degree = Math.abs(decimalsSubstract(heading1, heading2));
  const radian = decimalsMultiplication(degree, decimalsDivision(Math.PI, 180));
  const hypotenuse = g.geometry!.spherical.computeDistanceBetween(landing, clickP);
  const adjacent = decimalsMultiplication(hypotenuse, Math.cos(radian));
  const addHeight = decimalsMultiplication(adjacent, pitch);
  return decimalsAddition(runwayHeight, addHeight);
}

/**
 * 函館公式 TransitionalSurface.getLimitHeightOfQuadrangleArea。
 * 原点は landing_area_center1。heading1 は正規化しない。
 */
export function hakodateTransQuadHeight(
  g: typeof google.maps,
  center1: Coord,
  center2: Coord,
  height1: number,
  height2: number,
  clickP: google.maps.LatLng,
  landingLength: number,
  landingWidth: number,
  pitch: number
): number {
  const c1 = new g.LatLng(center1.lat, center1.lng);
  const c2 = new g.LatLng(center2.lat, center2.lng);
  const heading1 = g.geometry!.spherical.computeHeading(c1, c2);
  let heading2 = g.geometry!.spherical.computeHeading(c1, clickP);
  if (heading2 < 0) heading2 += 180;
  const degree = Math.abs(decimalsSubstract(heading1, heading2));
  const radian = decimalsMultiplication(degree, decimalsDivision(Math.PI, 180));
  const hypotenuse = g.geometry!.spherical.computeDistanceBetween(c1, clickP);
  const opposite = decimalsMultiplication(hypotenuse, Math.sin(radian));
  const adjacent = decimalsMultiplication(hypotenuse, Math.cos(radian));
  const lowHeight = height1 < height2 ? height1 : height2;
  const highHeight = height1 < height2 ? height2 : height1;
  const addHeight = decimalsMultiplication(
    highHeight - lowHeight,
    decimalsDivision(adjacent, landingLength)
  );
  const edgeHeight = lowHeight + addHeight;
  const fromEdge = decimalsSubstract(opposite, decimalsDivision(landingWidth, 2));
  const addFromEdge = decimalsMultiplication(fromEdge, pitch);
  return decimalsAddition(edgeHeight, addFromEdge);
}

/** 函館公式 TransitionalSurface.getLimitHeightOfTriangleArea */
export function hakodateTransTriHeight(
  g: typeof google.maps,
  landingCenter: Coord,
  landingVertex: Coord,
  approachCenter: Coord,
  approachVertex: Coord,
  clickP: google.maps.LatLng,
  approachAreaHeight: number,
  pitchApproach: number,
  pitchTransition: number
): number {
  const approachEdgeHeight = hakodateApproachHeight(
    g,
    landingCenter,
    approachCenter,
    clickP,
    approachAreaHeight,
    pitchApproach
  );
  const landingAreaCenter = {
    x: Number(landingCenter.lng.toFixed(8)),
    y: Number(landingCenter.lat.toFixed(8)),
  };
  const landingAreaVertex = {
    x: Number(landingVertex.lng.toFixed(8)),
    y: Number(landingVertex.lat.toFixed(8)),
  };
  const approachSurfaceVertex = {
    x: Number(approachVertex.lng.toFixed(8)),
    y: Number(approachVertex.lat.toFixed(8)),
  };
  const clickPoint = {
    x: Number(clickP.lng().toFixed(8)),
    y: Number(clickP.lat().toFixed(8)),
  };
  const parallelSlope = decimalsDivision(
    decimalsSubstract(landingAreaCenter.y, landingAreaVertex.y),
    decimalsSubstract(landingAreaCenter.x, landingAreaVertex.x)
  );
  const parallelIntercept = decimalsAddition(
    decimalsMultiplication(decimalsMultiplication(parallelSlope, clickPoint.x), -1),
    clickPoint.y
  );
  const approachSlope = decimalsDivision(
    decimalsSubstract(approachSurfaceVertex.y, landingAreaVertex.y),
    decimalsSubstract(approachSurfaceVertex.x, landingAreaVertex.x)
  );
  const approachIntercept = decimalsAddition(
    decimalsMultiplication(decimalsMultiplication(approachSlope, landingAreaVertex.x), -1),
    landingAreaVertex.y
  );
  const crossX = decimalsDivision(
    decimalsSubstract(approachIntercept, parallelIntercept),
    decimalsSubstract(parallelSlope, approachSlope)
  );
  const crossY = decimalsAddition(decimalsMultiplication(parallelSlope, crossX), parallelIntercept);
  const distanceFromApproachEdge = g.geometry!.spherical.computeDistanceBetween(
    clickP,
    new g.LatLng(crossY, crossX)
  );
  const addFromEdge = decimalsMultiplication(distanceFromApproachEdge, pitchTransition);
  return decimalsAddition(approachEdgeHeight, addFromEdge);
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

/** 公式 c(): 名称は display_order 最小。同じ order なら高さ最小側。高さ自体は常に最小。 */
export function pickSendaiSurfaceName(height: HeightEntry[]): { name: string; heightM: number } {
  const order: Record<string, number> = {
    着陸帯: 1,
    進入表面: 2,
    転移表面: 3,
    延長進入表面: 4,
    水平表面: 5,
    円錐表面: 6,
    外側水平表面: 7,
  };
  const byOrder = [...height].sort(
    (a, b) => (order[a.str] ?? 99) - (order[b.str] ?? 99)
  );
  const byHeight = [...height].sort((a, b) => a.val - b.val);
  const lowestOrder = byOrder[0];
  const lowestHeight = byHeight[0];
  const name =
    (order[lowestOrder.str] ?? 99) === (order[lowestHeight.str] ?? 99)
      ? lowestHeight.str
      : lowestOrder.str;
  return { name, heightM: lowestHeight.val };
}
