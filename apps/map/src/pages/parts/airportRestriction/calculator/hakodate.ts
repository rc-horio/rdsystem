/**
 * 函館空港 高さ制限計算ロジック
 * データソース: 函館空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/hakodate-airport/
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面あり。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  surfacePoints as hM,
  HAKODATE_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as HAKODATE_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as HAKODATE_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as HAKODATE_LENGTH,
  WIDTH_OF_LANDING_AREA as HAKODATE_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as HAKODATE_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as HAKODATE_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as HAKODATE_PITCH,
} from "../data/hakodate";
import type { Coord } from "../data/hakodate";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

function isHakodatePointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 函館: 水平表面ゾーン（半径4000m以内） */
function calcHakodateHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);

  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([hM.cd11, hM.cd12, hM.cd18, hM.cd17])) {
    height.push({
      val: mathTennia(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd14, hM.cd15, hM.cd21, hM.cd20])) {
    height.push({
      val: mathTennia(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd07, hM.cd12, hM.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd13, hM.cd12, hM.cd12, hM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd08, hM.cd15, hM.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd13, hM.cd14, hM.cd14, hM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd17, hM.cd18, hM.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd19, hM.cd18, hM.cd18, hM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd20, hM.cd21, hM.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd19, hM.cd20, hM.cd20, hM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14]) || inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 函館: 円錐表面ゾーン（4000m超〜16500m） */
function calcHakodateConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT + (distance - HAKODATE_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);

  if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14]) || inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 函館: 外側水平表面ゾーン（16500m超〜24000m） */
function calcHakodateOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = HAKODATE_REF_HEIGHT + HAKODATE_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);

  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 函館空港の高さ制限を計算する
 */
export function calculateHakodateRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(HAKODATE_REFERENCE_POINT.lat, HAKODATE_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= HAKODATE_HORIZ_RADIUS) {
      result = calcHakodateHorizontalSurface(g, point, lat, lng);
    } else if (distance <= HAKODATE_CONICAL_RADIUS) {
      result = calcHakodateConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= HAKODATE_OUTER_RADIUS) {
      result = calcHakodateOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "hakodate",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
