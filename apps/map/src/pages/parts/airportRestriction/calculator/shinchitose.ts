/**
 * 新千歳空港 高さ制限計算ロジック
 * データソース: 新千歳空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/shinchitose-airport/
 *
 * 新千歳空港は水平表面のみ（半径4000m）。円錐表面・外側水平表面はなし。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  runwayA as scA,
  runwayB as scB,
  SHINCHITOSE_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as SHINCHITOSE_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as SHINCHITOSE_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as SHINCHITOSE_HORIZ_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as SHINCHITOSE_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as SHINCHITOSE_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as SHINCHITOSE_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as SHINCHITOSE_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as SHINCHITOSE_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as SHINCHITOSE_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as SHINCHITOSE_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as SHINCHITOSE_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as SHINCHITOSE_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as SHINCHITOSE_PITCH_B,
} from "../data/shinchitose";
import type { Coord } from "../data/shinchitose";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

function isShinchitosePointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 新千歳: 水平表面ゾーン（半径4000m以内）※新千歳は水平表面のみ */
function calcShinchitoseHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = SHINCHITOSE_REF_HEIGHT + SHINCHITOSE_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) =>
    isShinchitosePointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([scA.cd12, scA.cd14, scA.cd20, scA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([scA.cd12, scA.cd04, scA.cd06, scA.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scA.cd18, scA.cd20, scA.cd28, scA.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scA.cd11, scA.cd12, scA.cd18, scA.cd17])) {
    height.push({
      val: mathTennia(
        g,
        scA.cd13,
        scA.cd19,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_HEIGHT_A_2,
        latLng,
        SHINCHITOSE_LENGTH_A,
        SHINCHITOSE_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd14, scA.cd15, scA.cd21, scA.cd20])) {
    height.push({
      val: mathTennia(
        g,
        scA.cd13,
        scA.cd19,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_HEIGHT_A_2,
        latLng,
        SHINCHITOSE_LENGTH_A,
        SHINCHITOSE_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd07, scA.cd12, scA.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd13, scA.cd05, scA.cd12, scA.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd08, scA.cd15, scA.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd13, scA.cd05, scA.cd14, scA.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd17, scA.cd18, scA.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd19, scA.cd27, scA.cd18, scA.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd20, scA.cd21, scA.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd19, scA.cd27, scA.cd20, scA.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([scB.cd12, scB.cd14, scB.cd20, scB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([scB.cd12, scB.cd04, scB.cd06, scB.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scB.cd18, scB.cd20, scB.cd28, scB.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scB.cd11, scB.cd12, scB.cd18, scB.cd17])) {
    height.push({
      val: mathTennia(
        g,
        scB.cd13,
        scB.cd19,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_HEIGHT_B_2,
        latLng,
        SHINCHITOSE_LENGTH_B,
        SHINCHITOSE_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd14, scB.cd15, scB.cd21, scB.cd20])) {
    height.push({
      val: mathTennia(
        g,
        scB.cd13,
        scB.cd19,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_HEIGHT_B_2,
        latLng,
        SHINCHITOSE_LENGTH_B,
        SHINCHITOSE_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd07, scB.cd12, scB.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd13, scB.cd05, scB.cd12, scB.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd08, scB.cd15, scB.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd13, scB.cd05, scB.cd14, scB.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd17, scB.cd18, scB.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd19, scB.cd27, scB.cd18, scB.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd20, scB.cd21, scB.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd19, scB.cd27, scB.cd20, scB.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    inPoly([scA.cd12, scA.cd04, scA.cd06, scA.cd14]) ||
    inPoly([scA.cd18, scA.cd20, scA.cd28, scA.cd26]) ||
    inPoly([scB.cd12, scB.cd04, scB.cd06, scB.cd14]) ||
    inPoly([scB.cd18, scB.cd20, scB.cd28, scB.cd26])
  ) {
    reStr = "進入表面";
  }
  if (
    inPoly([scA.cd12, scA.cd14, scA.cd20, scA.cd18]) ||
    inPoly([scB.cd12, scB.cd14, scB.cd20, scB.cd18])
  ) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 新千歳空港の高さ制限を計算する
 * 新千歳は水平表面のみ（半径4000m）。円錐・外側水平表面なし。
 */
export function calculateShinchitoseRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(SHINCHITOSE_REFERENCE_POINT.lat, SHINCHITOSE_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    if (distance > SHINCHITOSE_HORIZ_RADIUS) {
      return { items: [] };
    }

    const result = calcShinchitoseHorizontalSurface(g, point, lat, lng);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "shinchitose",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
