/**
 * 宮崎空港 高さ制限計算ロジック
 * データソース: 宮崎空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/miyazaki-airport/
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面（南東のみ）あり。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePoints as mzM,
  MIYAZAKI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MIYAZAKI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as MIYAZAKI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MIYAZAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as MIYAZAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MIYAZAKI_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MIYAZAKI_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as MIYAZAKI_PITCH,
} from "../data/miyazaki";
import type { Coord } from "../data/miyazaki";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

function isMiyazakiPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 宮崎: 水平表面ゾーン（半径3500m以内） */
function calcMiyazakiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);

  if (inPoly([mzM.cd12, mzM.cd14, mzM.cd20, mzM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([mzM.cd11, mzM.cd12, mzM.cd18, mzM.cd17])) {
    height.push({
      val: mathTennia(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd14, mzM.cd15, mzM.cd21, mzM.cd20])) {
    height.push({
      val: mathTennia(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd07, mzM.cd12, mzM.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd13, mzM.cd12, mzM.cd12, mzM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd08, mzM.cd15, mzM.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd13, mzM.cd14, mzM.cd14, mzM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd17, mzM.cd18, mzM.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd19, mzM.cd18, mzM.cd18, mzM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd20, mzM.cd21, mzM.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd19, mzM.cd20, mzM.cd20, mzM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14]) || inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([mzM.cd12, mzM.cd14, mzM.cd20, mzM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 宮崎: 円錐表面ゾーン（3500m超〜16500m） */
function calcMiyazakiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT + (distance - MIYAZAKI_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);

  if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14]) || inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 宮崎: 外側水平表面ゾーン（16500m超〜24000m） */
function calcMiyazakiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = MIYAZAKI_REF_HEIGHT + MIYAZAKI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);

  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 宮崎空港の高さ制限を計算する
 */
export function calculateMiyazakiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(MIYAZAKI_REFERENCE_POINT.lat, MIYAZAKI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= MIYAZAKI_HORIZ_RADIUS) {
      result = calcMiyazakiHorizontalSurface(g, point, lat, lng);
    } else if (distance <= MIYAZAKI_CONICAL_RADIUS) {
      result = calcMiyazakiConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= MIYAZAKI_OUTER_RADIUS) {
      result = calcMiyazakiOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "miyazaki",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
