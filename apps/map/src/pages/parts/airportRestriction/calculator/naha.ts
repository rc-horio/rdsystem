/**
 * 那覇空港 高さ制限計算ロジック
 * データソース: 那覇空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/naha-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePointsA as nAha,
  surfacePointsB as nBha,
  NAHA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NAHA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as NAHA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as NAHA_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as NAHA_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as NAHA_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as NAHA_HEIGHT_A_2,
  LENGTH_OF_LANDING_AREA_B as NAHA_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as NAHA_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as NAHA_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as NAHA_HEIGHT_B_2,
} from "../data/naha";
import type { Coord } from "../data/naha";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

/** 那覇: ポリゴン内判定 */
function isNahaPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(
    g,
    lat,
    lng,
    path.map((c) => ({ lat: c.lat, lng: c.lng }))
  );
}

/** 那覇: 水平表面ゾーン（半径4000m以内） */
function calcNahaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([nAha.cd12, nAha.cd14, nAha.cd20, nAha.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd02, latLng, NAHA_HEIGHT_A_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd30, latLng, NAHA_HEIGHT_A_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nAha.cd11, nAha.cd12, nAha.cd18, nAha.cd17])) {
    height.push({
      val: mathTennia(g, nAha.cd13, nAha.cd19, NAHA_HEIGHT_A_1, NAHA_HEIGHT_A_2, latLng, NAHA_LENGTH_A, NAHA_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd14, nAha.cd15, nAha.cd21, nAha.cd20])) {
    height.push({
      val: mathTennia(g, nAha.cd13, nAha.cd19, NAHA_HEIGHT_A_1, NAHA_HEIGHT_A_2, latLng, NAHA_LENGTH_A, NAHA_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd07, nAha.cd12, nAha.cd11])) {
    const hm0 = mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1);
    height.push({ val: mathTennib(g, nAha.cd13, nAha.cd12, nAha.cd12, nAha.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd08, nAha.cd15, nAha.cd14])) {
    const hm0 = mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1);
    height.push({ val: mathTennib(g, nAha.cd13, nAha.cd14, nAha.cd14, nAha.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd17, nAha.cd18, nAha.cd24])) {
    const hm0 = mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2);
    height.push({ val: mathTennib(g, nAha.cd19, nAha.cd18, nAha.cd18, nAha.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd20, nAha.cd21, nAha.cd25])) {
    const hm0 = mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2);
    height.push({ val: mathTennib(g, nAha.cd19, nAha.cd20, nAha.cd20, nAha.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([nBha.cd12, nBha.cd14, nBha.cd20, nBha.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd02, latLng, NAHA_HEIGHT_B_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd30, latLng, NAHA_HEIGHT_B_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nBha.cd11, nBha.cd12, nBha.cd18, nBha.cd17])) {
    height.push({
      val: mathTennia(g, nBha.cd13, nBha.cd19, NAHA_HEIGHT_B_1, NAHA_HEIGHT_B_2, latLng, NAHA_LENGTH_B, NAHA_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd14, nBha.cd15, nBha.cd21, nBha.cd20])) {
    height.push({
      val: mathTennia(g, nBha.cd13, nBha.cd19, NAHA_HEIGHT_B_1, NAHA_HEIGHT_B_2, latLng, NAHA_LENGTH_B, NAHA_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd07, nBha.cd12, nBha.cd11])) {
    const hm0 = mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1);
    height.push({ val: mathTennib(g, nBha.cd13, nBha.cd12, nBha.cd12, nBha.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd08, nBha.cd15, nBha.cd14])) {
    const hm0 = mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1);
    height.push({ val: mathTennib(g, nBha.cd13, nBha.cd14, nBha.cd14, nBha.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd17, nBha.cd18, nBha.cd24])) {
    const hm0 = mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2);
    height.push({ val: mathTennib(g, nBha.cd19, nBha.cd18, nBha.cd18, nBha.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd20, nBha.cd21, nBha.cd25])) {
    const hm0 = mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2);
    height.push({ val: mathTennib(g, nBha.cd19, nBha.cd20, nBha.cd20, nBha.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: NAHA_REF_HEIGHT + NAHA_HORIZ_HEIGHT, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) || inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
      inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) || inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14]) || inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26]) ||
      inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14]) || inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([nAha.cd12, nAha.cd14, nAha.cd20, nAha.cd18]) || inPoly([nBha.cd12, nBha.cd14, nBha.cd20, nBha.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 那覇: 円錐表面ゾーン（4000m超〜16500m） */
function calcNahaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = NAHA_REF_HEIGHT + NAHA_HORIZ_HEIGHT + (distance - NAHA_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);

  if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1), str: "進入表面" });
  }
  if (inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2), str: "進入表面" });
  }
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd02, latLng, NAHA_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd30, latLng, NAHA_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1), str: "進入表面" });
  }
  if (inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2), str: "進入表面" });
  }
  if (inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd02, latLng, NAHA_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd30, latLng, NAHA_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) || inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
      inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) || inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14]) || inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26]) ||
      inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14]) || inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 那覇: 外側水平表面ゾーン（16500m超〜24000m） */
function calcNahaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = NAHA_REF_HEIGHT + NAHA_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);

  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd02, latLng, NAHA_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd30, latLng, NAHA_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd02, latLng, NAHA_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd30, latLng, NAHA_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) || inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
      inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) || inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 那覇空港の高さ制限を計算する
 */
export function calculateNahaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NAHA_REFERENCE_POINT.lat, NAHA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= NAHA_HORIZ_RADIUS) {
      result = calcNahaHorizontalSurface(g, point, lat, lng);
    } else if (distance <= NAHA_CONICAL_RADIUS) {
      result = calcNahaConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= NAHA_OUTER_RADIUS) {
      result = calcNahaOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "naha",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
