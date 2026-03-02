/**
 * 松山空港 高さ制限計算ロジック
 * データソース: 松山空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/matsuyama-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePoints as mM,
  MATSUYAMA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MATSUYAMA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as MATSUYAMA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MATSUYAMA_LENGTH,
  WIDTH_OF_LANDING_AREA as MATSUYAMA_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MATSUYAMA_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MATSUYAMA_HEIGHT_2,
} from "../data/matsuyama";
import type { Coord } from "../data/matsuyama";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

/** 松山: ポリゴン内に点が含まれるか */
function isMatsuyamaPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(g, lat, lng, path.map((c) => ({ lat: c.lat, lng: c.lng })));
}

/** 松山: 水平表面ゾーン（半径3500m以内） */
function calcMatsuyamaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = MATSUYAMA_REF_HEIGHT + MATSUYAMA_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) => isMatsuyamaPointInPolygon(g, lat, lng, path);

  if (inPoly([mM.cd12, mM.cd14, mM.cd20, mM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    height.push({ val: mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([mM.cd11, mM.cd12, mM.cd18, mM.cd17])) {
    height.push({
      val: mathTennia(g, mM.cd13, mM.cd19, MATSUYAMA_HEIGHT_1, MATSUYAMA_HEIGHT_2, latLng, MATSUYAMA_LENGTH, MATSUYAMA_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd14, mM.cd15, mM.cd21, mM.cd20])) {
    height.push({
      val: mathTennia(g, mM.cd13, mM.cd19, MATSUYAMA_HEIGHT_1, MATSUYAMA_HEIGHT_2, latLng, MATSUYAMA_LENGTH, MATSUYAMA_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd07, mM.cd12, mM.cd11])) {
    const hm0 = mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1);
    height.push({ val: mathTennib(g, mM.cd13, mM.cd12, mM.cd12, mM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd08, mM.cd15, mM.cd14])) {
    const hm0 = mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1);
    height.push({ val: mathTennib(g, mM.cd13, mM.cd14, mM.cd14, mM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd17, mM.cd18, mM.cd24])) {
    const hm0 = mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2);
    height.push({ val: mathTennib(g, mM.cd19, mM.cd18, mM.cd18, mM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd20, mM.cd21, mM.cd25])) {
    const hm0 = mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2);
    height.push({ val: mathTennib(g, mM.cd19, mM.cd20, mM.cd20, mM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14]) || inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([mM.cd12, mM.cd14, mM.cd20, mM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 松山: 円錐表面ゾーン（3500m超〜16500m） */
function calcMatsuyamaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    MATSUYAMA_REF_HEIGHT + MATSUYAMA_HORIZ_HEIGHT + (distance - MATSUYAMA_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isMatsuyamaPointInPolygon(g, lat, lng, path);

  if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1), str: "進入表面" });
  }
  if (inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    height.push({ val: mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2), str: "進入表面" });
  }
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14]) || inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 松山: 外側水平表面ゾーン（16500m超〜24000m） */
function calcMatsuyamaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = MATSUYAMA_REF_HEIGHT + MATSUYAMA_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isMatsuyamaPointInPolygon(g, lat, lng, path);

  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 松山空港の高さ制限を計算する
 */
export function calculateMatsuyamaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(MATSUYAMA_REFERENCE_POINT.lat, MATSUYAMA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= MATSUYAMA_HORIZ_RADIUS) {
      result = calcMatsuyamaHorizontalSurface(g, point, lat, lng);
    } else if (distance <= MATSUYAMA_CONICAL_RADIUS) {
      result = calcMatsuyamaConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= MATSUYAMA_OUTER_RADIUS) {
      result = calcMatsuyamaOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "matsuyama",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
