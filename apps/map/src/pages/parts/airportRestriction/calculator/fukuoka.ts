/**
 * 福岡空港 高さ制限計算ロジック
 * データソース: 福岡空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/fukuoka-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  mpA as fA,
  mpB as fB,
  FUKUOKA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as FUKUOKA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER_RADIUS,
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
} from "../data/fukuoka";
import type { Coord } from "../data/fukuoka";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathSinnyu40,
  mathTennia,
  mathTennibHei,
  chkInclusion,
  isPointInPolygon,
} from "./shared";

/** 福岡: 円錐表面の高さ math_ensui = 9.1 + (kyori - 4000) * (1/50) + 45 */
function mathEnsuiFukuoka(kyori: number): number {
  return 9.1 + (kyori - 4000) * (1 / 50) + 45;
}

/** 福岡: 水平表面ゾーン（4000m以内） */
function calcFukuokaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  height.push({ val: FUKUOKA_HORIZ_HEIGHT, str: "水平表面" });

  // A滑走路
  if (chk(fA.cd21, fA.cd22, fA.cd23) || chk(fA.cd22, fA.cd23, fA.cd24)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(fA.cd7, fA.cd8, fA.cd22) || chk(fA.cd7, fA.cd22, fA.cd21)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N), str: "進入表面" });
  }
  if (chk(fA.cd22, fA.cd18, fA.cd24) || chk(fA.cd18, fA.cd24, fA.cd20)) {
    height.push({ val: mathTennia(g, fA.cd25, fA.cd26, FUKUOKA_HEIGHT_A_N, FUKUOKA_HEIGHT_A_S, latLng, FUKUOKA_LENGTH_A, FUKUOKA_WIDTH_A), str: "転移表面" });
  }
  if (chk(fA.cd14, fA.cd18, fA.cd22)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd22, fA.cd14, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }
  if (chk(fA.cd20, fA.cd24, fA.cd16)) {
    const hm0 = mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S);
    height.push({ val: mathTennibHei(g, fA.cd26, fA.cd12, fA.cd24, fA.cd16, latLng, hm0, fA.cd23, fA.cd24), str: "転移表面" });
  }
  if (chk(fA.cd9, fA.cd10, fA.cd23) || chk(fA.cd10, fA.cd23, fA.cd24)) {
    height.push({ val: mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S), str: "進入表面" });
  }
  if (chk(fA.cd21, fA.cd17, fA.cd23) || chk(fA.cd17, fA.cd23, fA.cd19)) {
    height.push({ val: mathTennia(g, fA.cd25, fA.cd26, FUKUOKA_HEIGHT_A_N, FUKUOKA_HEIGHT_A_S, latLng, FUKUOKA_LENGTH_A, FUKUOKA_WIDTH_A), str: "転移表面" });
  }
  if (chk(fA.cd13, fA.cd21, fA.cd17)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd21, fA.cd13, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }
  if (chk(fA.cd15, fA.cd19, fA.cd23)) {
    const hm0 = mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S);
    height.push({ val: mathTennibHei(g, fA.cd26, fA.cd12, fA.cd23, fA.cd15, latLng, hm0, fA.cd23, fA.cd24), str: "転移表面" });
  }

  // B滑走路
  if (chk(fB.cd5, fB.cd6, fB.cd9) || chk(fB.cd5, fB.cd9, fB.cd8)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(fB.cd1, fB.cd2, fB.cd6) || chk(fB.cd1, fB.cd6, fB.cd5)) {
    height.push({ val: mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N), str: "進入表面" });
  }
  if (chk(fB.cd8, fB.cd9, fB.cd14) || chk(fB.cd8, fB.cd14, fB.cd13)) {
    height.push({ val: mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S), str: "進入表面" });
  }
  if (chk(fB.cd5, fB.cd15, fB.cd8) || chk(fB.cd15, fB.cd8, fB.cd16)) {
    height.push({ val: mathTennia(g, fB.cd18, fB.cd19, FUKUOKA_HEIGHT_B_N, FUKUOKA_HEIGHT_B_S, latLng, FUKUOKA_LENGTH_B, FUKUOKA_WIDTH_B), str: "転移表面" });
  }
  if (chk(fB.cd3, fB.cd5, fB.cd15)) {
    const hm0 = mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N);
    height.push({ val: mathTennibHei(g, fB.cd18, fB.cd17, fB.cd5, fB.cd3, latLng, hm0, fB.cd6, fB.cd5), str: "転移表面" });
  }
  if (chk(fB.cd16, fB.cd8, fB.cd11)) {
    const hm0 = mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S);
    height.push({ val: mathTennibHei(g, fB.cd19, fB.cd20, fB.cd8, fB.cd11, latLng, hm0, fB.cd9, fB.cd8), str: "転移表面" });
  }
  if (chk(fB.cd6, fB.cd7, fB.cd10) || chk(fB.cd6, fB.cd10, fB.cd9)) {
    height.push({ val: mathTennia(g, fB.cd18, fB.cd19, FUKUOKA_HEIGHT_B_N, FUKUOKA_HEIGHT_B_S, latLng, FUKUOKA_LENGTH_B, FUKUOKA_WIDTH_B), str: "転移表面" });
  }
  if (chk(fB.cd4, fB.cd7, fB.cd6)) {
    const hm0 = mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N);
    height.push({ val: mathTennibHei(g, fB.cd18, fB.cd17, fB.cd6, fB.cd4, latLng, hm0, fB.cd6, fB.cd5), str: "転移表面" });
  }
  if (chk(fB.cd10, fB.cd12, fB.cd9)) {
    const hm0 = mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S);
    height.push({ val: mathTennibHei(g, fB.cd19, fB.cd20, fB.cd9, fB.cd14, latLng, hm0, fB.cd9, fB.cd8), str: "転移表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const st = STR_TO_SURFACE[d.str] ?? "outer_horizontal";
  return { surfaceType: st, heightM: d.val };
}

/** 福岡: 円錐表面ゾーン（landingKiE ポリゴン内、4000m超〜16500m） */
function calcFukuokaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const hEnsui = mathEnsuiFukuoka(kyori);
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  // A滑走路
  if (chk(fA.cd7, fA.cd8, fA.cd22) || chk(fA.cd7, fA.cd22, fA.cd21)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N), str: "進入表面" });
  }
  if (chk(fA.cd1, fA.cd2, fA.cd8) || chk(fA.cd1, fA.cd8, fA.cd7)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd5, latLng, FUKUOKA_HEIGHT_A_N), str: "延長進入表面" });
  }
  if (chk(fA.cd14, fA.cd18, fA.cd22)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd22, fA.cd14, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }
  if (chk(fA.cd9, fA.cd10, fA.cd23) || chk(fA.cd10, fA.cd23, fA.cd24)) {
    height.push({ val: mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S), str: "進入表面" });
  }
  if (chk(fA.cd3, fA.cd4, fA.cd9) || chk(fA.cd4, fA.cd9, fA.cd10)) {
    height.push({ val: mathSinnyu(g, fA.cd26, fA.cd6, latLng, FUKUOKA_HEIGHT_A_S), str: "延長進入表面" });
  }
  if (chk(fA.cd13, fA.cd21, fA.cd17)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd21, fA.cd13, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }

  // B滑走路
  if (chk(fB.cd1, fB.cd2, fB.cd6) || chk(fB.cd1, fB.cd6, fB.cd5)) {
    height.push({ val: mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N), str: "進入表面" });
  }
  if (chk(fB.cd8, fB.cd9, fB.cd14) || chk(fB.cd8, fB.cd14, fB.cd13)) {
    height.push({ val: mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S), str: "進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const st = STR_TO_SURFACE[d.str];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 福岡: 外側水平表面ゾーン（16500m超〜24000m） */
function calcFukuokaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } {
  const height: HeightEntry[] = [{ val: FUKUOKA_OUTER_HEIGHT, str: "外側水平表面" }];

  const inNorth = isPointInPolygon(g, lat, lng, landingKiN);
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (inNorth && (chk(fA.cd1, fA.cd2, fA.cd8) || chk(fA.cd1, fA.cd7, fA.cd8))) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd5, latLng, FUKUOKA_HEIGHT_A_N), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const st = STR_TO_SURFACE[d.str] ?? "outer_horizontal";
  return { surfaceType: st, heightM: d.val };
}

/**
 * 福岡空港の高さ制限を計算する
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
    } else if (distance <= FUKUOKA_CONICAL_RADIUS) {
      if (isPointInPolygon(g, lat, lng, landingKiE)) {
        result = calcFukuokaConicalSurface(g, point, distance);
      } else {
        result = { surfaceType: "conical", heightM: mathEnsuiFukuoka(distance) };
      }
    } else if (distance <= FUKUOKA_OUTER_RADIUS) {
      result = calcFukuokaOuterHorizontalSurface(g, point, lat, lng);
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
