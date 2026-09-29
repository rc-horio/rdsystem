import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import type { Coord } from "../data/fukuoka";
import {
  mpA as fA,
  mpB as fB,
  FUKUOKA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as FUKUOKA_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as FUKUOKA_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_N as FUKUOKA_HEIGHT_A_N,
  HEIGHT_OF_LANDING_AREA_A_S as FUKUOKA_HEIGHT_A_S,
  LENGTH_OF_LANDING_AREA_B as FUKUOKA_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as FUKUOKA_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_N as FUKUOKA_HEIGHT_B_N,
  HEIGHT_OF_LANDING_AREA_B_S as FUKUOKA_HEIGHT_B_S,
  landingKiE,
  landingKiN,
  landingKiS,
} from "../data/fukuoka";
import {
  STR_TO_SURFACE,
  chkInclusion,
  isPointInPolygon,
  mathSinnyu,
  mathTennibHei,
} from "./shared";
import type { HeightEntry } from "./shared";

/** 進入表面の高さ計算（math_sinnyu40）勾配1/40 */
function mathSinnyu40(
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

/** 福岡公式 math_ensui = 9.1 + (kyori - 4000) * (1/50) + 45 */
function mathEnsuiFukuoka(kyori: number): number {
  return 9.1 + (kyori - 4000) * (1 / 50) + 45;
}

/** 福岡公式 math_tennia。底辺に abs を付ける。 */
function mathTenniaFukuoka(
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
  const d1 = g.geometry!.spherical.computeHeading(npLatlng, spLatlng);
  let d2 = g.geometry!.spherical.computeHeading(npLatlng, cp);
  if (d2 < 0) d2 += 180;
  const kakudo = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(npLatlng, cp);
  const teihen = Math.abs(shahen * Math.cos((kakudo * Math.PI) / 180));
  const takasa = shahen * Math.sin((kakudo * Math.PI) / 180);
  const hm = nh + ((sh - nh) * teihen) / ta;
  const dm = takasa - hb / 2;
  return hm + dm * (1 / 7);
}

/**
 * 福岡公式 disp_value。A は高さ最小、B（新滑走路）は配列先頭。
 * 既存が水平/円錐かつ新規が進入なら進入を出す。それ以外は低い方。
 */
function mergeFukuokaAB(a: HeightEntry | null, b: HeightEntry | null): HeightEntry | null {
  if (!b) return a;
  if (!a) return b;
  if ((a.str === "水平表面" || a.str === "円錐表面") && b.str === "進入表面") {
    return b;
  }
  return a.val <= b.val ? a : b;
}

function fukuokaEntryToResult(
  d: HeightEntry | null
): { surfaceType: SurfaceType; heightM: number } | null {
  if (!d) return null;
  const st = STR_TO_SURFACE[d.str];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 福岡: 水平表面（公式 s_surface_event。円 zIndex 104） */
function calcFukuokaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);
  let height: HeightEntry[] = [{ val: FUKUOKA_HORIZ_HEIGHT, str: "水平表面" }];

  if (chk(fA.cd21, fA.cd22, fA.cd23) || chk(fA.cd22, fA.cd23, fA.cd24)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(fA.cd7, fA.cd8, fA.cd22) || chk(fA.cd7, fA.cd22, fA.cd21)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N), str: "進入表面" });
  }
  if (chk(fA.cd22, fA.cd18, fA.cd24) || chk(fA.cd18, fA.cd24, fA.cd20)) {
    height.push({
      val: mathTenniaFukuoka(
        g,
        fA.cd25,
        fA.cd26,
        FUKUOKA_HEIGHT_A_N,
        FUKUOKA_HEIGHT_A_S,
        latLng,
        FUKUOKA_LENGTH_A,
        FUKUOKA_WIDTH_A
      ),
      str: "転移表面",
    });
  }
  if (chk(fA.cd14, fA.cd18, fA.cd22)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({
      val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd22, fA.cd14, latLng, hm0, fA.cd21, fA.cd22),
      str: "転移表面",
    });
  }
  if (chk(fA.cd20, fA.cd24, fA.cd16)) {
    const hm0 = mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S);
    height.push({
      val: mathTennibHei(g, fA.cd26, fA.cd12, fA.cd24, fA.cd16, latLng, hm0, fA.cd23, fA.cd24),
      str: "転移表面",
    });
  }
  if (chk(fA.cd9, fA.cd10, fA.cd23) || chk(fA.cd10, fA.cd23, fA.cd24)) {
    height = [{ val: mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S), str: "進入表面" }];
  }
  if (chk(fA.cd21, fA.cd17, fA.cd23) || chk(fA.cd17, fA.cd23, fA.cd19)) {
    height.push({
      val: mathTenniaFukuoka(
        g,
        fA.cd25,
        fA.cd26,
        FUKUOKA_HEIGHT_A_N,
        FUKUOKA_HEIGHT_A_S,
        latLng,
        FUKUOKA_LENGTH_A,
        FUKUOKA_WIDTH_A
      ),
      str: "転移表面",
    });
  }
  if (chk(fA.cd13, fA.cd21, fA.cd17)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({
      val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd21, fA.cd13, latLng, hm0, fA.cd21, fA.cd22),
      str: "転移表面",
    });
  }
  if (chk(fA.cd15, fA.cd19, fA.cd23)) {
    const hm0 = mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S);
    height.push({
      val: mathTennibHei(g, fA.cd26, fA.cd12, fA.cd23, fA.cd15, latLng, hm0, fA.cd23, fA.cd24),
      str: "転移表面",
    });
  }
  height.sort((a, b) => a.val - b.val);
  const aResult = height[0] ?? null;

  let heightSin: HeightEntry[] = [];
  if (chk(fB.cd5, fB.cd6, fB.cd9) || chk(fB.cd5, fB.cd9, fB.cd8)) {
    heightSin.push({ val: 0, str: "着陸帯" });
  }
  if (chk(fB.cd1, fB.cd2, fB.cd6) || chk(fB.cd1, fB.cd6, fB.cd5)) {
    heightSin.push({
      val: mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N),
      str: "進入表面",
    });
  }
  if (chk(fB.cd8, fB.cd9, fB.cd14) || chk(fB.cd8, fB.cd14, fB.cd13)) {
    heightSin = [{ val: mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S), str: "進入表面" }];
  }
  if (chk(fB.cd5, fB.cd15, fB.cd8) || chk(fB.cd15, fB.cd8, fB.cd16)) {
    heightSin.push({
      val: mathTenniaFukuoka(
        g,
        fB.cd18,
        fB.cd19,
        FUKUOKA_HEIGHT_B_N,
        FUKUOKA_HEIGHT_B_S,
        latLng,
        FUKUOKA_LENGTH_B,
        FUKUOKA_WIDTH_B
      ),
      str: "転移表面",
    });
  }
  if (chk(fB.cd3, fB.cd5, fB.cd15)) {
    const hm0 = mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N);
    heightSin.push({
      val: mathTennibHei(g, fB.cd18, fB.cd17, fB.cd5, fB.cd3, latLng, hm0, fB.cd6, fB.cd5),
      str: "転移表面",
    });
  }
  if (chk(fB.cd16, fB.cd8, fB.cd11)) {
    const hm0 = mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S);
    heightSin.push({
      val: mathTennibHei(g, fB.cd19, fB.cd20, fB.cd8, fB.cd11, latLng, hm0, fB.cd9, fB.cd8),
      str: "転移表面",
    });
  }
  if (chk(fB.cd6, fB.cd7, fB.cd10) || chk(fB.cd6, fB.cd10, fB.cd9)) {
    heightSin.push({
      val: mathTenniaFukuoka(
        g,
        fB.cd18,
        fB.cd19,
        FUKUOKA_HEIGHT_B_N,
        FUKUOKA_HEIGHT_B_S,
        latLng,
        FUKUOKA_LENGTH_B,
        FUKUOKA_WIDTH_B
      ),
      str: "転移表面",
    });
  }
  if (chk(fB.cd4, fB.cd7, fB.cd6)) {
    const hm0 = mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N);
    heightSin.push({
      val: mathTennibHei(g, fB.cd18, fB.cd17, fB.cd6, fB.cd4, latLng, hm0, fB.cd6, fB.cd5),
      str: "転移表面",
    });
  }
  if (chk(fB.cd10, fB.cd12, fB.cd9)) {
    const hm0 = mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S);
    heightSin.push({
      val: mathTennibHei(g, fB.cd19, fB.cd20, fB.cd9, fB.cd14, latLng, hm0, fB.cd9, fB.cd8),
      str: "転移表面",
    });
  }
  const bResult = heightSin[0] ?? null;

  return fukuokaEntryToResult(mergeFukuokaAB(aResult, bResult));
}

/** 福岡: 円錐表面（公式 Kikkake_e_event。切り欠き landingKi_e） */
function calcFukuokaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);
  let height: HeightEntry[] = [{ val: mathEnsuiFukuoka(kyori), str: "円錐表面" }];

  if (chk(fA.cd7, fA.cd8, fA.cd22) || chk(fA.cd7, fA.cd22, fA.cd21)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N), str: "進入表面" });
  }
  if (chk(fA.cd1, fA.cd2, fA.cd8) || chk(fA.cd1, fA.cd8, fA.cd7)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd5, latLng, FUKUOKA_HEIGHT_A_N), str: "延長進入表面" });
  }
  if (chk(fA.cd14, fA.cd18, fA.cd22)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({
      val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd22, fA.cd14, latLng, hm0, fA.cd21, fA.cd22),
      str: "転移表面",
    });
  }
  if (chk(fA.cd9, fA.cd10, fA.cd23) || chk(fA.cd10, fA.cd23, fA.cd24)) {
    height = [{ val: mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S), str: "進入表面" }];
  }
  if (chk(fA.cd3, fA.cd4, fA.cd9) || chk(fA.cd4, fA.cd9, fA.cd10)) {
    height = [{ val: mathSinnyu(g, fA.cd26, fA.cd6, latLng, FUKUOKA_HEIGHT_A_S), str: "延長進入表面" }];
  }
  if (chk(fA.cd13, fA.cd21, fA.cd17)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({
      val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd21, fA.cd13, latLng, hm0, fA.cd21, fA.cd22),
      str: "転移表面",
    });
  }
  height.sort((a, b) => a.val - b.val);
  const aResult = height[0] ?? null;

  let heightSin: HeightEntry[] = [];
  if (chk(fB.cd1, fB.cd2, fB.cd6) || chk(fB.cd1, fB.cd6, fB.cd5)) {
    heightSin = [{ val: mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N), str: "進入表面" }];
  }
  if (chk(fB.cd8, fB.cd9, fB.cd14) || chk(fB.cd8, fB.cd14, fB.cd13)) {
    heightSin = [{ val: mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S), str: "進入表面" }];
  }
  const bResult = heightSin[0] ?? null;

  return fukuokaEntryToResult(mergeFukuokaAB(aResult, bResult));
}

/** 福岡: 外側水平表面・北（公式 Kikkake_n_event） */
function calcFukuokaOuterNorth(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [{ val: FUKUOKA_OUTER_HEIGHT, str: "外側水平表面" }];
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);
  if (chk(fA.cd1, fA.cd2, fA.cd8) || chk(fA.cd1, fA.cd7, fA.cd8)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd5, latLng, FUKUOKA_HEIGHT_A_N), str: "延長進入表面" });
  }
  height.sort((a, b) => a.val - b.val);
  return fukuokaEntryToResult(height[0] ?? null);
}

/**
 * 福岡空港の高さ制限を計算する。
 * 公式は水平円・円錐切欠き・外側北/南のポリゴンクリックのみ応答する。
 * zIndex: 水平104 → 外側南103 → 円錐102 → 外側北101。
 */
export function calculateFukuokaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(FUKUOKA_REFERENCE_POINT.lat, FUKUOKA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= FUKUOKA_HORIZ_RADIUS) {
      result = calcFukuokaHorizontalSurface(g, point);
    } else if (isPointInPolygon(g, lat, lng, landingKiS)) {
      result = { surfaceType: "outer_horizontal", heightM: FUKUOKA_OUTER_HEIGHT };
    } else if (isPointInPolygon(g, lat, lng, landingKiE)) {
      result = calcFukuokaConicalSurface(g, point, distance);
    } else if (isPointInPolygon(g, lat, lng, landingKiN)) {
      result = calcFukuokaOuterNorth(g, point);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "fukuoka",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
