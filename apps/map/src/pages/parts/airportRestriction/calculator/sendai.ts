/**
 * 仙台空港 高さ制限計算ロジック
 * データソース: 仙台空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/sendai-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  runwayA as sA,
  runwayB as sB,
  SENDAI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as SENDAI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as SENDAI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as SENDAI_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as SENDAI_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as SENDAI_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as SENDAI_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as SENDAI_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as SENDAI_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as SENDAI_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as SENDAI_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as SENDAI_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as SENDAI_PITCH_B,
} from "../data/sendai";
import type { Coord } from "../data/sendai";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

/** 仙台: ポリゴン内に点が含まれるか */
function isSendaiPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(g, lat, lng, path.map((c) => ({ lat: c.lat, lng: c.lng })));
}

/** 仙台: 水平表面ゾーン（半径4000m以内） */
function calcSendaiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = SENDAI_REF_HEIGHT + SENDAI_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([sA.cd07, sA.cd09, sA.cd14, sA.cd12])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sA.cd06, sA.cd07, sA.cd12, sA.cd11]) || inPoly([sA.cd09, sA.cd10, sA.cd15, sA.cd14])) {
    height.push({
      val: mathTennia(g, sA.cd08, sA.cd13, SENDAI_HEIGHT_A_1, SENDAI_HEIGHT_A_2, latLng, SENDAI_LENGTH_A, SENDAI_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd04, sA.cd07, sA.cd06])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd08, sA.cd02, sA.cd07, sA.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd05, sA.cd10, sA.cd09])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd08, sA.cd02, sA.cd09, sA.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd11, sA.cd12, sA.cd16])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd13, sA.cd19, sA.cd12, sA.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd14, sA.cd15, sA.cd17])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd13, sA.cd19, sA.cd14, sA.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([sB.cd07, sB.cd09, sB.cd14, sB.cd12])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([sB.cd06, sB.cd07, sB.cd12, sB.cd11]) || inPoly([sB.cd09, sB.cd10, sB.cd15, sB.cd14])) {
    height.push({
      val: mathTennia(g, sB.cd08, sB.cd13, SENDAI_HEIGHT_B_1, SENDAI_HEIGHT_B_2, latLng, SENDAI_LENGTH_B, SENDAI_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd04, sB.cd07, sB.cd06])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd08, sB.cd02, sB.cd07, sB.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd05, sB.cd10, sB.cd09])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd08, sB.cd02, sB.cd09, sB.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd11, sB.cd12, sB.cd16])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd13, sB.cd19, sB.cd12, sB.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd14, sB.cd15, sB.cd17])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd13, sB.cd19, sB.cd14, sB.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    reStr = "延長進入表面";
  } else if (
    inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09]) || inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18]) ||
    inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09]) || inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])
  ) {
    reStr = "進入表面";
  }
  if (inPoly([sA.cd07, sA.cd09, sA.cd14, sA.cd12]) || inPoly([sB.cd07, sB.cd09, sB.cd14, sB.cd12])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 仙台: 円錐表面ゾーン（4000m超〜16500m） */
function calcSendaiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    SENDAI_REF_HEIGHT + SENDAI_HORIZ_HEIGHT + (distance - SENDAI_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);

  if (inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A), str: "進入表面" });
  }
  if (inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A), str: "進入表面" });
  }
  if (inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B), str: "進入表面" });
  }
  if (inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "進入表面" });
  }
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    reStr = "延長進入表面";
  } else if (
    inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09]) || inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18]) ||
    inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09]) || inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])
  ) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 仙台: 外側水平表面ゾーン（16500m超〜24000m） */
function calcSendaiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = SENDAI_REF_HEIGHT + SENDAI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);

  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 仙台空港の高さ制限を計算する
 */
export function calculateSendaiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(SENDAI_REFERENCE_POINT.lat, SENDAI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= SENDAI_HORIZ_RADIUS) {
      result = calcSendaiHorizontalSurface(g, point, lat, lng);
    } else if (distance <= SENDAI_CONICAL_RADIUS) {
      result = calcSendaiConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= SENDAI_OUTER_RADIUS) {
      result = calcSendaiOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "sendai",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
