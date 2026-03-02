/**
 * 成田空港 高さ制限計算ロジック
 * データソース: 成田空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/narita-airport/Temporary/index.html
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePointsA as nA,
  surfacePointsC as nC,
  NARITA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NARITA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NARITA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NARITA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as NARITA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A,
  WIDTH_OF_LANDING_AREA_A,
  HEIGHT_OF_LANDING_AREA_A_1,
  HEIGHT_OF_LANDING_AREA_A_2,
  LENGTH_OF_LANDING_AREA_C,
  WIDTH_OF_LANDING_AREA_C,
  HEIGHT_OF_LANDING_AREA_C_1,
  HEIGHT_OF_LANDING_AREA_C_2,
} from "../data/narita";
import type { Coord } from "../data/narita";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

/** 成田: ポリゴン内に点が含まれるか */
function isNaritaPointInPolygon(
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

/** 成田: 水平表面ゾーン（半径4000m以内） */
function calcNaritaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const inPoly = (path: Coord[]) => isNaritaPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([nA.cd12, nA.cd14, nA.cd20, nA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd02, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd30, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nA.cd11, nA.cd12, nA.cd18, nA.cd17])) {
    height.push({
      val: mathTennia(g, nA.cd13, nA.cd19, HEIGHT_OF_LANDING_AREA_A_1, HEIGHT_OF_LANDING_AREA_A_2, latLng, LENGTH_OF_LANDING_AREA_A, WIDTH_OF_LANDING_AREA_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd14, nA.cd15, nA.cd21, nA.cd20])) {
    height.push({
      val: mathTennia(g, nA.cd13, nA.cd19, HEIGHT_OF_LANDING_AREA_A_1, HEIGHT_OF_LANDING_AREA_A_2, latLng, LENGTH_OF_LANDING_AREA_A, WIDTH_OF_LANDING_AREA_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd07, nA.cd12, nA.cd11])) {
    const hm0 = mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1);
    height.push({ val: mathTennib(g, nA.cd13, nA.cd12, nA.cd12, nA.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd08, nA.cd15, nA.cd14])) {
    const hm0 = mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1);
    height.push({ val: mathTennib(g, nA.cd13, nA.cd14, nA.cd14, nA.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd17, nA.cd18, nA.cd24])) {
    const hm0 = mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2);
    height.push({ val: mathTennib(g, nA.cd19, nA.cd18, nA.cd18, nA.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd20, nA.cd21, nA.cd25])) {
    const hm0 = mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2);
    height.push({ val: mathTennib(g, nA.cd19, nA.cd20, nA.cd20, nA.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // C滑走路
  if (inPoly([nC.cd12, nC.cd14, nC.cd20, nC.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd02, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd30, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nC.cd11, nC.cd12, nC.cd18, nC.cd17])) {
    height.push({
      val: mathTennia(g, nC.cd13, nC.cd19, HEIGHT_OF_LANDING_AREA_C_1, HEIGHT_OF_LANDING_AREA_C_2, latLng, LENGTH_OF_LANDING_AREA_C, WIDTH_OF_LANDING_AREA_C),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd14, nC.cd15, nC.cd21, nC.cd20])) {
    height.push({
      val: mathTennia(g, nC.cd13, nC.cd19, HEIGHT_OF_LANDING_AREA_C_1, HEIGHT_OF_LANDING_AREA_C_2, latLng, LENGTH_OF_LANDING_AREA_C, WIDTH_OF_LANDING_AREA_C),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd07, nC.cd12, nC.cd11])) {
    const hm0 = mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1);
    height.push({ val: mathTennib(g, nC.cd13, nC.cd12, nC.cd12, nC.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd08, nC.cd15, nC.cd14])) {
    const hm0 = mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1);
    height.push({ val: mathTennib(g, nC.cd13, nC.cd14, nC.cd14, nC.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd17, nC.cd18, nC.cd24])) {
    const hm0 = mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2);
    height.push({ val: mathTennib(g, nC.cd19, nC.cd18, nC.cd18, nC.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd20, nC.cd21, nC.cd25])) {
    const hm0 = mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2);
    height.push({ val: mathTennib(g, nC.cd19, nC.cd20, nC.cd20, nC.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: NARITA_REF_HEIGHT + NARITA_HORIZ_HEIGHT, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01]) || inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29]) ||
      inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01]) || inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14]) || inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26]) ||
      inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14]) || inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([nA.cd12, nA.cd14, nA.cd20, nA.cd18]) || inPoly([nC.cd12, nC.cd14, nC.cd20, nC.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 成田: 円錐表面ゾーン（4000m超〜16500m、切欠きなし） */
function calcNaritaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = NARITA_REF_HEIGHT + NARITA_HORIZ_HEIGHT + (distance - NARITA_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isNaritaPointInPolygon(g, lat, lng, path);

  // A滑走路（円錐ゾーンに進入/延長進入が突き出す場合）
  if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "進入表面" });
  }
  if (inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "進入表面" });
  }
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd02, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "延長進入表面" });
  }
  if (inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd30, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "延長進入表面" });
  }

  // C滑走路
  if (inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "進入表面" });
  }
  if (inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "進入表面" });
  }
  if (inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd02, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "延長進入表面" });
  }
  if (inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd30, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01]) || inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29]) ||
      inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01]) || inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14]) || inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26]) ||
      inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14]) || inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 成田: 外側水平表面ゾーン（16500m超〜24000m） */
function calcNaritaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = NARITA_REF_HEIGHT + NARITA_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isNaritaPointInPolygon(g, lat, lng, path);

  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd02, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "延長進入表面" });
  }
  if (inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd30, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "延長進入表面" });
  }
  if (inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd02, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "延長進入表面" });
  }
  if (inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd30, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01]) || inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29]) ||
      inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01]) || inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 成田空港の高さ制限を計算する
 * @param lat 緯度
 * @param lng 経度
 * @param gmaps google.maps（geometry ライブラリ必須）
 * @returns 制限結果。制限表面外の場合は items が空
 */
export function calculateNaritaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NARITA_REFERENCE_POINT.lat, NARITA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= NARITA_HORIZ_RADIUS) {
      result = calcNaritaHorizontalSurface(g, point, lat, lng);
    } else if (distance <= NARITA_CONICAL_RADIUS) {
      result = calcNaritaConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= NARITA_OUTER_RADIUS) {
      result = calcNaritaOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "narita",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
