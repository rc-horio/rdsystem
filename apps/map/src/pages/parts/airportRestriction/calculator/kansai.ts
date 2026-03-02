/**
 * 関西国際空港 高さ制限計算ロジック
 * データソース: 関西国際空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/kix/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePointsA as kA,
  surfacePointsB as kB,
  KANSAI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as KANSAI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as KANSAI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as KANSAI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as KANSAI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as KANSAI_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as KANSAI_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as KANSAI_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as KANSAI_HEIGHT_A_2,
  LENGTH_OF_LANDING_AREA_B as KANSAI_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as KANSAI_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as KANSAI_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as KANSAI_HEIGHT_B_2,
} from "../data/kansai";
import type { Coord } from "../data/kansai";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

/** 関西: ポリゴン内に点が含まれるか */
function isKansaiPointInPolygon(
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

/** 関西: 水平表面ゾーン（半径4000m以内） */
function calcKansaiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const inPoly = (path: Coord[]) => isKansaiPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([kA.cd12, kA.cd14, kA.cd20, kA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd02, latLng, KANSAI_HEIGHT_A_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd30, latLng, KANSAI_HEIGHT_A_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kA.cd11, kA.cd12, kA.cd18, kA.cd17])) {
    height.push({
      val: mathTennia(g, kA.cd13, kA.cd19, KANSAI_HEIGHT_A_1, KANSAI_HEIGHT_A_2, latLng, KANSAI_LENGTH_A, KANSAI_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd14, kA.cd15, kA.cd21, kA.cd20])) {
    height.push({
      val: mathTennia(g, kA.cd13, kA.cd19, KANSAI_HEIGHT_A_1, KANSAI_HEIGHT_A_2, latLng, KANSAI_LENGTH_A, KANSAI_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd07, kA.cd12, kA.cd11])) {
    const hm0 = mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1);
    height.push({ val: mathTennib(g, kA.cd13, kA.cd12, kA.cd12, kA.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd08, kA.cd15, kA.cd14])) {
    const hm0 = mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1);
    height.push({ val: mathTennib(g, kA.cd13, kA.cd14, kA.cd14, kA.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd17, kA.cd18, kA.cd24])) {
    const hm0 = mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2);
    height.push({ val: mathTennib(g, kA.cd19, kA.cd18, kA.cd18, kA.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd20, kA.cd21, kA.cd25])) {
    const hm0 = mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2);
    height.push({ val: mathTennib(g, kA.cd19, kA.cd20, kA.cd20, kA.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([kB.cd12, kB.cd14, kB.cd20, kB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd02, latLng, KANSAI_HEIGHT_B_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd30, latLng, KANSAI_HEIGHT_B_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kB.cd11, kB.cd12, kB.cd18, kB.cd17])) {
    height.push({
      val: mathTennia(g, kB.cd13, kB.cd19, KANSAI_HEIGHT_B_1, KANSAI_HEIGHT_B_2, latLng, KANSAI_LENGTH_B, KANSAI_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd14, kB.cd15, kB.cd21, kB.cd20])) {
    height.push({
      val: mathTennia(g, kB.cd13, kB.cd19, KANSAI_HEIGHT_B_1, KANSAI_HEIGHT_B_2, latLng, KANSAI_LENGTH_B, KANSAI_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd07, kB.cd12, kB.cd11])) {
    const hm0 = mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1);
    height.push({ val: mathTennib(g, kB.cd13, kB.cd12, kB.cd12, kB.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd08, kB.cd15, kB.cd14])) {
    const hm0 = mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1);
    height.push({ val: mathTennib(g, kB.cd13, kB.cd14, kB.cd14, kB.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd17, kB.cd18, kB.cd24])) {
    const hm0 = mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2);
    height.push({ val: mathTennib(g, kB.cd19, kB.cd18, kB.cd18, kB.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd20, kB.cd21, kB.cd25])) {
    const hm0 = mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2);
    height.push({ val: mathTennib(g, kB.cd19, kB.cd20, kB.cd20, kB.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: KANSAI_REF_HEIGHT + KANSAI_HORIZ_HEIGHT, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01]) || inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29]) ||
      inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01]) || inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14]) || inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26]) ||
      inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14]) || inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([kA.cd12, kA.cd14, kA.cd20, kA.cd18]) || inPoly([kB.cd12, kB.cd14, kB.cd20, kB.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 関西: 円錐表面ゾーン（4000m超〜16500m） */
function calcKansaiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = KANSAI_REF_HEIGHT + KANSAI_HORIZ_HEIGHT + (distance - KANSAI_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isKansaiPointInPolygon(g, lat, lng, path);

  if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1), str: "進入表面" });
  }
  if (inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2), str: "進入表面" });
  }
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd02, latLng, KANSAI_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd30, latLng, KANSAI_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1), str: "進入表面" });
  }
  if (inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2), str: "進入表面" });
  }
  if (inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd02, latLng, KANSAI_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd30, latLng, KANSAI_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01]) || inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29]) ||
      inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01]) || inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14]) || inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26]) ||
      inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14]) || inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 関西: 外側水平表面ゾーン（16500m超〜24000m） */
function calcKansaiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = KANSAI_REF_HEIGHT + KANSAI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isKansaiPointInPolygon(g, lat, lng, path);

  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd02, latLng, KANSAI_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd30, latLng, KANSAI_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd02, latLng, KANSAI_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd30, latLng, KANSAI_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01]) || inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29]) ||
      inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01]) || inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 関西国際空港の高さ制限を計算する
 */
export function calculateKansaiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(KANSAI_REFERENCE_POINT.lat, KANSAI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= KANSAI_HORIZ_RADIUS) {
      result = calcKansaiHorizontalSurface(g, point, lat, lng);
    } else if (distance <= KANSAI_CONICAL_RADIUS) {
      result = calcKansaiConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= KANSAI_OUTER_RADIUS) {
      result = calcKansaiOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "kansai",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
