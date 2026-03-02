/**
 * 長崎空港 高さ制限計算ロジック
 * データソース: 長崎空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/nagasaki-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  mp as ngsMp,
  NAGASAKI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NAGASAKI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as NAGASAKI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as NAGASAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as NAGASAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_N as NAGASAKI_HEIGHT_N,
  HEIGHT_OF_LANDING_AREA_S as NAGASAKI_HEIGHT_S,
  landingKiE,
  landingKiN,
  landingKiS,
} from "../data/nagasaki";
import type { Coord } from "../data/nagasaki";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennibHei,
  chkInclusion,
  isPointInPolygon,
} from "./shared";

/** 長崎: 円錐表面の高さ計算 */
function mathEnsuiNagasaki(kyori: number): number {
  return NAGASAKI_REF_HEIGHT + (kyori - NAGASAKI_HORIZ_RADIUS) * (1 / 50) + NAGASAKI_HORIZ_HEIGHT;
}

/** 長崎: 水平表面ゾーン（半径4000m以内） */
function calcNagasakiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = NAGASAKI_REF_HEIGHT + NAGASAKI_HORIZ_HEIGHT;

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(m.cd21, m.cd22, m.cd23) || chk(m.cd22, m.cd23, m.cd24)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(m.cd7, m.cd8, m.cd22) || chk(m.cd7, m.cd22, m.cd21)) {
    height.push({
      val: mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(m.cd22, m.cd18, m.cd24) || chk(m.cd18, m.cd24, m.cd20)) {
    height.push({
      val: mathTennia(g, m.cd25, m.cd26, NAGASAKI_HEIGHT_N, NAGASAKI_HEIGHT_S, latLng, NAGASAKI_LENGTH, NAGASAKI_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd14, m.cd18, m.cd22)) {
    const hm0 = mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N);
    height.push({
      val: mathTennibHei(g, m.cd25, m.cd11, m.cd22, m.cd14, latLng, hm0, m.cd21, m.cd22),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd20, m.cd24, m.cd16)) {
    const hm0 = mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S);
    height.push({
      val: mathTennibHei(g, m.cd26, m.cd12, m.cd24, m.cd16, latLng, hm0, m.cd23, m.cd24),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd9, m.cd10, m.cd23) || chk(m.cd10, m.cd23, m.cd24)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(m.cd21, m.cd17, m.cd23) || chk(m.cd17, m.cd23, m.cd19)) {
    height.push({
      val: mathTennia(g, m.cd25, m.cd26, NAGASAKI_HEIGHT_N, NAGASAKI_HEIGHT_S, latLng, NAGASAKI_LENGTH, NAGASAKI_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd13, m.cd17, m.cd21)) {
    const hm0 = mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N);
    height.push({
      val: mathTennibHei(g, m.cd25, m.cd11, m.cd21, m.cd13, latLng, hm0, m.cd21, m.cd22),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd15, m.cd19, m.cd23)) {
    const hm0 = mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S);
    height.push({
      val: mathTennibHei(g, m.cd26, m.cd12, m.cd23, m.cd15, latLng, hm0, m.cd23, m.cd24),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    reStr = "延長進入表面";
  } else if (
    chk(m.cd7, m.cd8, m.cd22) ||
    chk(m.cd7, m.cd22, m.cd21) ||
    chk(m.cd9, m.cd10, m.cd23) ||
    chk(m.cd10, m.cd23, m.cd24)
  ) {
    reStr = "進入表面";
  }
  if (chk(m.cd21, m.cd22, m.cd23) || chk(m.cd22, m.cd23, m.cd24)) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 長崎: 円錐表面ゾーン（landingKiE ポリゴン内、4000m超〜16500m） */
function calcNagasakiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const height: HeightEntry[] = [];
  const hEnsui = mathEnsuiNagasaki(kyori);
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(m.cd7, m.cd8, m.cd22) || chk(m.cd7, m.cd22, m.cd21)) {
    height.push({
      val: mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N),
      str: "進入表面",
    });
  }
  if (chk(m.cd9, m.cd10, m.cd23) || chk(m.cd10, m.cd23, m.cd24)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S),
      str: "進入表面",
    });
  }
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    reStr = "延長進入表面";
  } else if (
    chk(m.cd7, m.cd8, m.cd22) ||
    chk(m.cd7, m.cd22, m.cd21) ||
    chk(m.cd9, m.cd10, m.cd23) ||
    chk(m.cd10, m.cd23, m.cd24)
  ) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 長崎: 外側水平表面ゾーン（16500m超〜24000m） */
function calcNagasakiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const height: HeightEntry[] = [{ val: NAGASAKI_OUTER_HEIGHT, str: "外側水平表面" }];

  const inSouth = isPointInPolygon(g, lat, lng, landingKiS);
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (inSouth) {
    const sinS1 = chk(m.cd9, m.cd10, m.cd3);
    const sinS2 = chk(m.cd10, m.cd3, m.cd4);
    if (sinS1 || sinS2) {
      height.push({
        val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S),
        str: "延長進入表面",
      });
    }
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inSouth && (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4))) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 長崎空港の高さ制限を計算する
 */
export function calculateNagasakiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NAGASAKI_REFERENCE_POINT.lat, NAGASAKI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= NAGASAKI_HORIZ_RADIUS) {
      result = calcNagasakiHorizontalSurface(g, point);
    } else if (distance <= NAGASAKI_CONICAL_RADIUS) {
      if (isPointInPolygon(g, lat, lng, landingKiE)) {
        result = calcNagasakiConicalSurface(g, point, distance);
      } else {
        result = { surfaceType: "conical", heightM: mathEnsuiNagasaki(distance) };
      }
    } else if (distance <= NAGASAKI_OUTER_RADIUS) {
      if (isPointInPolygon(g, lat, lng, landingKiN) || isPointInPolygon(g, lat, lng, landingKiS)) {
        result = calcNagasakiOuterHorizontalSurface(g, point, lat, lng);
      } else {
        result = { surfaceType: "outer_horizontal", heightM: NAGASAKI_OUTER_HEIGHT };
      }
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "nagasaki",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
