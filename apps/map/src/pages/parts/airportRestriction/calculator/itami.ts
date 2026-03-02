/**
 * 伊丹空港 高さ制限計算ロジック
 * データソース: 伊丹空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/itm/
 *
 * A滑走路・B滑走路の2本。水平表面・円錐表面・外側水平表面に切欠きあり。
 * B滑走路のみ延長進入表面（南側）あり。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  mp as itMp,
  exmp as itExmp,
  ITAMI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as ITAMI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as ITAMI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as ITAMI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as ITAMI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as ITAMI_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as ITAMI_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_N as ITAMI_HEIGHT_A_N,
  HEIGHT_OF_LANDING_AREA_A_S as ITAMI_HEIGHT_A_S,
  LENGTH_OF_LANDING_AREA_B as ITAMI_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as ITAMI_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_N as ITAMI_HEIGHT_B_N,
  HEIGHT_OF_LANDING_AREA_B_S as ITAMI_HEIGHT_B_S,
  landingKi,
  landingKi_s,
  s_surface_s,
} from "../data/itami";
import type { Coord } from "../data/itami";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  chkInclusion,
  isPointInPolygon,
} from "./shared";

/** 伊丹: 円錐表面の高さ計算 math_ensui */
function mathEnsuiItami(kyori: number): number {
  return ITAMI_REF_HEIGHT + (kyori - ITAMI_HORIZ_RADIUS) * (1 / 50) + ITAMI_HORIZ_HEIGHT;
}

/** 伊丹: 水平表面ゾーン（半径4000m以内） */
function calcItamiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = ITAMI_REF_HEIGHT + ITAMI_HORIZ_HEIGHT;

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  // A滑走路
  if (chk(itMp.cd3, itMp.cd4, itMp.cd5) || chk(itMp.cd4, itMp.cd5, itMp.cd6)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(itMp.cd1, itMp.cd2, itMp.cd3) || chk(itMp.cd2, itMp.cd3, itMp.cd4)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd5, itMp.cd6, itMp.cd7) || chk(itMp.cd6, itMp.cd7, itMp.cd8)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd4, itMp.cd22, itMp.cd6) || chk(itMp.cd22, itMp.cd6, itMp.cd24)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.ac_n,
        itExmp.ac_s,
        ITAMI_HEIGHT_A_N,
        ITAMI_HEIGHT_A_S,
        latLng,
        ITAMI_LENGTH_A,
        ITAMI_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd4, itMp.cd22, itMp.cd20)) {
    const hm0 = mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N);
    height.push({
      val: mathTennib(g, itExmp.ac_n, itExmp.as_n, itMp.cd4, itMp.cd20, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd3, itMp.cd19, itMp.cd21)) {
    const hm0 = mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N);
    height.push({
      val: mathTennib(g, itExmp.ac_n, itExmp.as_n, itMp.cd3, itMp.cd19, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd21, itMp.cd3, itMp.cd23) || chk(itMp.cd3, itMp.cd23, itMp.cd5)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.ac_n,
        itExmp.ac_s,
        ITAMI_HEIGHT_A_N,
        ITAMI_HEIGHT_A_S,
        latLng,
        ITAMI_LENGTH_A,
        ITAMI_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd6, itMp.cd24, itMp.cd26)) {
    const hm0 = mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S);
    height.push({
      val: mathTennib(g, itExmp.ac_s, itExmp.as_s, itMp.cd6, itMp.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd5, itMp.cd23, itMp.cd25)) {
    const hm0 = mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S);
    height.push({
      val: mathTennib(g, itExmp.ac_s, itExmp.as_s, itMp.cd5, itMp.cd25, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (chk(itMp.cd11, itMp.cd12, itMp.cd13) || chk(itMp.cd12, itMp.cd13, itMp.cd14)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(itMp.cd9, itMp.cd10, itMp.cd11) || chk(itMp.cd10, itMp.cd11, itMp.cd12)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd13, itMp.cd14, itMp.cd15) || chk(itMp.cd14, itMp.cd15, itMp.cd16)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd12, itMp.cd30, itMp.cd14) || chk(itMp.cd30, itMp.cd14, itMp.cd32)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.bc_n,
        itExmp.bc_s,
        ITAMI_HEIGHT_B_N,
        ITAMI_HEIGHT_B_S,
        latLng,
        ITAMI_LENGTH_B,
        ITAMI_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd28, itMp.cd12, itMp.cd30)) {
    const hm0 = mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N);
    height.push({
      val: mathTennib(g, itExmp.bc_n, itExmp.bs_n, itMp.cd12, itMp.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd27, itMp.cd11, itMp.cd29)) {
    const hm0 = mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N);
    height.push({
      val: mathTennib(g, itExmp.bc_n, itExmp.bs_n, itMp.cd11, itMp.cd27, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd29, itMp.cd11, itMp.cd31) || chk(itMp.cd11, itMp.cd31, itMp.cd13)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.bc_n,
        itExmp.bc_s,
        ITAMI_HEIGHT_B_N,
        ITAMI_HEIGHT_B_S,
        latLng,
        ITAMI_LENGTH_B,
        ITAMI_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd14, itMp.cd32, itMp.cd34)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd14, itMp.cd34, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd13, itMp.cd31, itMp.cd33)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd13, itMp.cd33, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const reStr = d.str;
  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 伊丹: 円錐表面ゾーン（4000m超〜16500m） */
function calcItamiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = mathEnsuiItami(distance);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(itMp.cd1, itMp.cd2, itMp.cd3) || chk(itMp.cd2, itMp.cd3, itMp.cd4)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd5, itMp.cd6, itMp.cd7) || chk(itMp.cd6, itMp.cd7, itMp.cd8)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd9, itMp.cd10, itMp.cd11) || chk(itMp.cd10, itMp.cd11, itMp.cd12)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd13, itMp.cd14, itMp.cd15) || chk(itMp.cd14, itMp.cd15, itMp.cd16)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd15, itMp.cd16, itMp.cd17) || chk(itMp.cd16, itMp.cd17, itMp.cd18)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.be_s, latLng, ITAMI_HEIGHT_B_S),
      str: "延長進入表面",
    });
  }
  if (chk(itMp.cd14, itMp.cd32, itMp.cd34)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd14, itMp.cd34, latLng, hm0),
      str: "転移表面",
    });
  }
  if (chk(itMp.cd13, itMp.cd31, itMp.cd33)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd13, itMp.cd33, latLng, hm0),
      str: "転移表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const reStr = d.str;
  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 伊丹: 外側水平表面ゾーン（16500m超〜24000m） */
function calcItamiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = ITAMI_REF_HEIGHT + ITAMI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(itMp.cd15, itMp.cd16, itMp.cd17) || chk(itMp.cd16, itMp.cd17, itMp.cd18)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.be_s, latLng, ITAMI_HEIGHT_B_S),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const reStr = d.str;
  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 伊丹空港の高さ制限を計算する
 */
export function calculateItamiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(ITAMI_REFERENCE_POINT.lat, ITAMI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (
      distance <= ITAMI_HORIZ_RADIUS &&
      isPointInPolygon(g, lat, lng, s_surface_s)
    ) {
      result = calcItamiHorizontalSurface(g, point);
    } else if (
      distance > ITAMI_HORIZ_RADIUS &&
      distance <= ITAMI_CONICAL_RADIUS &&
      isPointInPolygon(g, lat, lng, landingKi)
    ) {
      result = calcItamiConicalSurface(g, point, distance);
    } else if (
      distance > ITAMI_CONICAL_RADIUS &&
      distance <= ITAMI_OUTER_RADIUS &&
      isPointInPolygon(g, lat, lng, landingKi_s)
    ) {
      result = calcItamiOuterHorizontalSurface(g, point);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "itami",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
