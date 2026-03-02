/**
 * 熊本空港 高さ制限計算ロジック
 * データソース: 熊本空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/kumamoto-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePoints as kmPoints,
  KUMAMOTO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as KUMAMOTO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as KUMAMOTO_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as KUMAMOTO_LENGTH,
  WIDTH_OF_LANDING_AREA as KUMAMOTO_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as KUMAMOTO_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as KUMAMOTO_HEIGHT_2,
} from "../data/kumamoto";
import type { Coord } from "../data/kumamoto";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  chkInclusion,
} from "./shared";

/** 熊本: 円錐表面の高さ計算 */
function mathEnsuiKumamoto(kyori: number): number {
  return (
    KUMAMOTO_REF_HEIGHT +
    (kyori - KUMAMOTO_HORIZ_RADIUS) * (1 / 50) +
    KUMAMOTO_HORIZ_HEIGHT
  );
}

/** 熊本: 水平表面ゾーン（半径4000m以内） */
function calcKumamotoHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const p = kmPoints;
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = KUMAMOTO_REF_HEIGHT + KUMAMOTO_HORIZ_HEIGHT;

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(p.cd12, p.cd14, p.cd20) || chk(p.cd14, p.cd20, p.cd18)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(p.cd12, p.cd04, p.cd06) || chk(p.cd12, p.cd06, p.cd14)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(p.cd18, p.cd20, p.cd28) || chk(p.cd18, p.cd28, p.cd26)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(p.cd04, p.cd06, p.cd03) || chk(p.cd04, p.cd03, p.cd01)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (chk(p.cd26, p.cd28, p.cd31) || chk(p.cd26, p.cd31, p.cd29)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (chk(p.cd11, p.cd12, p.cd18) || chk(p.cd12, p.cd18, p.cd17)) {
    height.push({
      val: mathTennia(
        g,
        p.cd13,
        p.cd19,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_HEIGHT_2,
        latLng,
        KUMAMOTO_LENGTH,
        KUMAMOTO_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd14, p.cd15, p.cd21) || chk(p.cd15, p.cd21, p.cd20)) {
    height.push({
      val: mathTennia(
        g,
        p.cd13,
        p.cd19,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_HEIGHT_2,
        latLng,
        KUMAMOTO_LENGTH,
        KUMAMOTO_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd07, p.cd12, p.cd11)) {
    const hm0 = mathSinnyu(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1);
    height.push({
      val: mathTennib(g, p.cd13, p.cd05, p.cd12, p.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd08, p.cd15, p.cd14)) {
    const hm0 = mathSinnyu(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1);
    height.push({
      val: mathTennib(g, p.cd13, p.cd05, p.cd14, p.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd17, p.cd18, p.cd24)) {
    const hm0 = mathSinnyu(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2);
    height.push({
      val: mathTennib(g, p.cd19, p.cd27, p.cd18, p.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd20, p.cd21, p.cd25)) {
    const hm0 = mathSinnyu(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2);
    height.push({
      val: mathTennib(g, p.cd19, p.cd27, p.cd20, p.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    chk(p.cd04, p.cd06, p.cd03) ||
    chk(p.cd04, p.cd03, p.cd01) ||
    chk(p.cd26, p.cd28, p.cd31) ||
    chk(p.cd26, p.cd31, p.cd29)
  ) {
    reStr = "延長進入表面";
  } else if (
    chk(p.cd12, p.cd04, p.cd06) ||
    chk(p.cd12, p.cd06, p.cd14) ||
    chk(p.cd18, p.cd20, p.cd28) ||
    chk(p.cd18, p.cd28, p.cd26)
  ) {
    reStr = "進入表面";
  }
  if (chk(p.cd12, p.cd14, p.cd20) || chk(p.cd14, p.cd20, p.cd18)) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 熊本: 円錐表面ゾーン（4000m超〜16500m） */
function calcKumamotoConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const p = kmPoints;
  const height: HeightEntry[] = [];
  const hEnsui = mathEnsuiKumamoto(kyori);
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(p.cd04, p.cd06, p.cd03) || chk(p.cd04, p.cd03, p.cd01)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1),
      str: "延長進入表面",
    });
  }
  if (chk(p.cd26, p.cd28, p.cd31) || chk(p.cd26, p.cd31, p.cd29)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    chk(p.cd04, p.cd06, p.cd03) ||
    chk(p.cd04, p.cd03, p.cd01) ||
    chk(p.cd26, p.cd28, p.cd31) ||
    chk(p.cd26, p.cd31, p.cd29)
  ) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 熊本: 外側水平表面ゾーン（16500m超〜24000m） */
function calcKumamotoOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const p = kmPoints;
  const height: HeightEntry[] = [
    {
      val: KUMAMOTO_REF_HEIGHT + KUMAMOTO_OUTER_HEIGHT,
      str: "外側水平表面",
    },
  ];

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(p.cd04, p.cd06, p.cd03) || chk(p.cd04, p.cd03, p.cd01)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1),
      str: "延長進入表面",
    });
  }
  if (chk(p.cd26, p.cd28, p.cd31) || chk(p.cd26, p.cd31, p.cd29)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    chk(p.cd04, p.cd06, p.cd03) ||
    chk(p.cd04, p.cd03, p.cd01) ||
    chk(p.cd26, p.cd28, p.cd31) ||
    chk(p.cd26, p.cd31, p.cd29)
  ) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 熊本空港の高さ制限を計算する
 */
export function calculateKumamotoRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(
      KUMAMOTO_REFERENCE_POINT.lat,
      KUMAMOTO_REFERENCE_POINT.lng
    );
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= KUMAMOTO_HORIZ_RADIUS) {
      result = calcKumamotoHorizontalSurface(g, point);
    } else if (distance <= KUMAMOTO_CONICAL_RADIUS) {
      result = calcKumamotoConicalSurface(g, point, distance);
    } else if (distance <= KUMAMOTO_OUTER_RADIUS) {
      result = calcKumamotoOuterHorizontalSurface(g, point);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "kumamoto",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
