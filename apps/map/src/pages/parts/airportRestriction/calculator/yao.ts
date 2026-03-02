/**
 * 八尾空港 高さ制限計算ロジック
 * データソース: 八尾空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/yao-airport/
 *
 * 八尾空港は水平表面のみ（半径2000m）。円錐表面・外側水平表面はなし。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  runwayA as yA,
  runwayB as yB,
  YAO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as YAO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as YAO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as YAO_HORIZ_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as YAO_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as YAO_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as YAO_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as YAO_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as YAO_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as YAO_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as YAO_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as YAO_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as YAO_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as YAO_PITCH_B,
} from "../data/yao";
import type { Coord } from "../data/yao";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

/** 八尾: ポリゴン内に点が含まれるか */
function isYaoPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 八尾: 水平表面ゾーン（半径2000m以内）※八尾は水平表面のみ */
function calcYaoHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = YAO_REF_HEIGHT + YAO_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) =>
    isYaoPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([yA.cd12, yA.cd14, yA.cd20, yA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([yA.cd12, yA.cd04, yA.cd06, yA.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, yA.cd13, yA.cd05, latLng, YAO_HEIGHT_A_1, YAO_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yA.cd18, yA.cd20, yA.cd28, yA.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, yA.cd19, yA.cd27, latLng, YAO_HEIGHT_A_2, YAO_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yA.cd11, yA.cd12, yA.cd18, yA.cd17])) {
    height.push({
      val: mathTennia(
        g,
        yA.cd13,
        yA.cd19,
        YAO_HEIGHT_A_1,
        YAO_HEIGHT_A_2,
        latLng,
        YAO_LENGTH_A,
        YAO_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd14, yA.cd15, yA.cd21, yA.cd20])) {
    height.push({
      val: mathTennia(
        g,
        yA.cd13,
        yA.cd19,
        YAO_HEIGHT_A_1,
        YAO_HEIGHT_A_2,
        latLng,
        YAO_LENGTH_A,
        YAO_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd07, yA.cd12, yA.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd13, yA.cd05, latLng, YAO_HEIGHT_A_1, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd13, yA.cd05, yA.cd12, yA.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd08, yA.cd15, yA.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd13, yA.cd05, latLng, YAO_HEIGHT_A_1, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd13, yA.cd05, yA.cd14, yA.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd17, yA.cd18, yA.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd19, yA.cd27, latLng, YAO_HEIGHT_A_2, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd19, yA.cd27, yA.cd18, yA.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd20, yA.cd21, yA.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd19, yA.cd27, latLng, YAO_HEIGHT_A_2, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd19, yA.cd27, yA.cd20, yA.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([yB.cd12, yB.cd14, yB.cd20, yB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([yB.cd12, yB.cd04, yB.cd06, yB.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, yB.cd13, yB.cd05, latLng, YAO_HEIGHT_B_1, YAO_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yB.cd18, yB.cd20, yB.cd28, yB.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, yB.cd19, yB.cd27, latLng, YAO_HEIGHT_B_2, YAO_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yB.cd11, yB.cd12, yB.cd18, yB.cd17])) {
    height.push({
      val: mathTennia(
        g,
        yB.cd13,
        yB.cd19,
        YAO_HEIGHT_B_1,
        YAO_HEIGHT_B_2,
        latLng,
        YAO_LENGTH_B,
        YAO_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd14, yB.cd15, yB.cd21, yB.cd20])) {
    height.push({
      val: mathTennia(
        g,
        yB.cd13,
        yB.cd19,
        YAO_HEIGHT_B_1,
        YAO_HEIGHT_B_2,
        latLng,
        YAO_LENGTH_B,
        YAO_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd07, yB.cd12, yB.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd13, yB.cd05, latLng, YAO_HEIGHT_B_1, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd13, yB.cd05, yB.cd12, yB.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd08, yB.cd15, yB.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd13, yB.cd05, latLng, YAO_HEIGHT_B_1, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd13, yB.cd05, yB.cd14, yB.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd17, yB.cd18, yB.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd19, yB.cd27, latLng, YAO_HEIGHT_B_2, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd19, yB.cd27, yB.cd18, yB.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd20, yB.cd21, yB.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd19, yB.cd27, latLng, YAO_HEIGHT_B_2, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd19, yB.cd27, yB.cd20, yB.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    inPoly([yA.cd12, yA.cd04, yA.cd06, yA.cd14]) ||
    inPoly([yA.cd18, yA.cd20, yA.cd28, yA.cd26]) ||
    inPoly([yB.cd12, yB.cd04, yB.cd06, yB.cd14]) ||
    inPoly([yB.cd18, yB.cd20, yB.cd28, yB.cd26])
  ) {
    reStr = "進入表面";
  }
  if (
    inPoly([yA.cd12, yA.cd14, yA.cd20, yA.cd18]) ||
    inPoly([yB.cd12, yB.cd14, yB.cd20, yB.cd18])
  ) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 八尾空港の高さ制限を計算する
 * 八尾は水平表面のみ（半径2000m）。円錐・外側水平表面なし。
 */
export function calculateYaoRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(YAO_REFERENCE_POINT.lat, YAO_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    if (distance > YAO_HORIZ_RADIUS) {
      return { items: [] };
    }

    const result = calcYaoHorizontalSurface(g, point, lat, lng);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "yao",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
