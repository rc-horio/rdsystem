/**
 * 中部国際空港（セントレア） 高さ制限計算ロジック
 * データソース: 中部国際空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/centrair/Temporary/index.html
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面（北西・南東の2方向）あり。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePoints as cM,
  CENTRAIR_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as CENTRAIR_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as CENTRAIR_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as CENTRAIR_LENGTH,
  WIDTH_OF_LANDING_AREA as CENTRAIR_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as CENTRAIR_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as CENTRAIR_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as CENTRAIR_PITCH,
} from "../data/centrair";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

function isCentrairPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 中部国際: 水平表面ゾーン（半径4000m以内） */
function calcCentrairHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = CENTRAIR_REF_HEIGHT + CENTRAIR_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);

  if (inPoly([cM.cd12, cM.cd14, cM.cd20, cM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([cM.cd11, cM.cd12, cM.cd18, cM.cd17])) {
    height.push({
      val: mathTennia(
        g,
        cM.cd13,
        cM.cd19,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_HEIGHT_2,
        latLng,
        CENTRAIR_LENGTH,
        CENTRAIR_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd14, cM.cd15, cM.cd21, cM.cd20])) {
    height.push({
      val: mathTennia(
        g,
        cM.cd13,
        cM.cd19,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_HEIGHT_2,
        latLng,
        CENTRAIR_LENGTH,
        CENTRAIR_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd07, cM.cd12, cM.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd13, cM.cd12, cM.cd12, cM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd08, cM.cd15, cM.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd13, cM.cd14, cM.cd14, cM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd17, cM.cd18, cM.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd19, cM.cd18, cM.cd18, cM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd20, cM.cd21, cM.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd19, cM.cd20, cM.cd20, cM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]) || inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14]) || inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([cM.cd12, cM.cd14, cM.cd20, cM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 中部国際: 円錐表面ゾーン（4000m超〜16500m） */
function calcCentrairConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    CENTRAIR_REF_HEIGHT + CENTRAIR_HORIZ_HEIGHT + (distance - CENTRAIR_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);

  if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]) || inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14]) || inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 中部国際: 外側水平表面ゾーン（16500m超〜24000m） */
function calcCentrairOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = CENTRAIR_REF_HEIGHT + CENTRAIR_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);

  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]) || inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 中部国際空港（セントレア）の高さ制限を計算する
 */
export function calculateCentrairRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(CENTRAIR_REFERENCE_POINT.lat, CENTRAIR_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= CENTRAIR_HORIZ_RADIUS) {
      result = calcCentrairHorizontalSurface(g, point, lat, lng);
    } else if (distance <= CENTRAIR_CONICAL_RADIUS) {
      result = calcCentrairConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= CENTRAIR_OUTER_RADIUS) {
      result = calcCentrairOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "centrair",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
