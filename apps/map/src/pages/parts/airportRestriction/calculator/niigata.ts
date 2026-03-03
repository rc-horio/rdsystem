/**
 * 新潟空港 高さ制限計算ロジック
 * データソース: 新潟空港高さ制限回答システム
 * https://secure.kix-ap.ne.jp/niigata-airport/
 *
 * 新潟空港は水平表面のみ（半径3500m）。円錐表面・外側水平表面はなし。
 * A/B 2本の滑走路。
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
import {
  runwayA as ngA,
  runwayB as ngB,
  NIIGATA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NIIGATA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as NIIGATA_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as NIIGATA_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as NIIGATA_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as NIIGATA_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as NIIGATA_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as NIIGATA_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as NIIGATA_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as NIIGATA_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as NIIGATA_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as NIIGATA_PITCH_B,
} from "../data/niigata";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  isPointInPolygon,
} from "./shared";

function isNiigataPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 新潟: 水平表面ゾーン（半径3500m以内）※新潟は水平表面のみ */
function calcNiigataHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = NIIGATA_REF_HEIGHT + NIIGATA_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isNiigataPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([ngA.cd12, ngA.cd14, ngA.cd20, ngA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([ngA.cd12, ngA.cd04, ngA.cd06, ngA.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngA.cd13, ngA.cd05, latLng, NIIGATA_HEIGHT_A_1, NIIGATA_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngA.cd18, ngA.cd20, ngA.cd28, ngA.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngA.cd19, ngA.cd27, latLng, NIIGATA_HEIGHT_A_2, NIIGATA_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngA.cd11, ngA.cd12, ngA.cd18, ngA.cd17])) {
    height.push({
      val: mathTennia(
        g,
        ngA.cd13,
        ngA.cd19,
        NIIGATA_HEIGHT_A_1,
        NIIGATA_HEIGHT_A_2,
        latLng,
        NIIGATA_LENGTH_A,
        NIIGATA_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd14, ngA.cd15, ngA.cd21, ngA.cd20])) {
    height.push({
      val: mathTennia(
        g,
        ngA.cd13,
        ngA.cd19,
        NIIGATA_HEIGHT_A_1,
        NIIGATA_HEIGHT_A_2,
        latLng,
        NIIGATA_LENGTH_A,
        NIIGATA_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd07, ngA.cd12, ngA.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd13, ngA.cd05, latLng, NIIGATA_HEIGHT_A_1, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd13, ngA.cd05, ngA.cd12, ngA.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd08, ngA.cd15, ngA.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd13, ngA.cd05, latLng, NIIGATA_HEIGHT_A_1, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd13, ngA.cd05, ngA.cd14, ngA.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd17, ngA.cd18, ngA.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd19, ngA.cd27, latLng, NIIGATA_HEIGHT_A_2, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd19, ngA.cd27, ngA.cd18, ngA.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd20, ngA.cd21, ngA.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd19, ngA.cd27, latLng, NIIGATA_HEIGHT_A_2, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd19, ngA.cd27, ngA.cd20, ngA.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([ngB.cd12, ngB.cd14, ngB.cd20, ngB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([ngB.cd12, ngB.cd04, ngB.cd06, ngB.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngB.cd13, ngB.cd05, latLng, NIIGATA_HEIGHT_B_1, NIIGATA_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngB.cd18, ngB.cd20, ngB.cd28, ngB.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngB.cd19, ngB.cd27, latLng, NIIGATA_HEIGHT_B_2, NIIGATA_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngB.cd11, ngB.cd12, ngB.cd18, ngB.cd17])) {
    height.push({
      val: mathTennia(
        g,
        ngB.cd19,
        ngB.cd13,
        NIIGATA_HEIGHT_B_2,
        NIIGATA_HEIGHT_B_1,
        latLng,
        NIIGATA_LENGTH_B,
        NIIGATA_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd14, ngB.cd15, ngB.cd21, ngB.cd20])) {
    height.push({
      val: mathTennia(
        g,
        ngB.cd19,
        ngB.cd13,
        NIIGATA_HEIGHT_B_2,
        NIIGATA_HEIGHT_B_1,
        latLng,
        NIIGATA_LENGTH_B,
        NIIGATA_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd07, ngB.cd12, ngB.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd13, ngB.cd05, latLng, NIIGATA_HEIGHT_B_1, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd13, ngB.cd05, ngB.cd12, ngB.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd08, ngB.cd15, ngB.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd13, ngB.cd05, latLng, NIIGATA_HEIGHT_B_1, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd13, ngB.cd05, ngB.cd14, ngB.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd17, ngB.cd18, ngB.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd19, ngB.cd27, latLng, NIIGATA_HEIGHT_B_2, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd19, ngB.cd27, ngB.cd18, ngB.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd20, ngB.cd21, ngB.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd19, ngB.cd27, latLng, NIIGATA_HEIGHT_B_2, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd19, ngB.cd27, ngB.cd20, ngB.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    inPoly([ngA.cd12, ngA.cd04, ngA.cd06, ngA.cd14]) ||
    inPoly([ngA.cd18, ngA.cd20, ngA.cd28, ngA.cd26]) ||
    inPoly([ngB.cd12, ngB.cd04, ngB.cd06, ngB.cd14]) ||
    inPoly([ngB.cd18, ngB.cd20, ngB.cd28, ngB.cd26])
  ) {
    reStr = "進入表面";
  }
  if (
    inPoly([ngA.cd12, ngA.cd14, ngA.cd20, ngA.cd18]) ||
    inPoly([ngB.cd12, ngB.cd14, ngB.cd20, ngB.cd18])
  ) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 新潟空港の高さ制限を計算する
 * 新潟は水平表面のみ（半径3500m）。円錐・外側水平表面なし。
 */
export function calculateNiigataRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NIIGATA_REFERENCE_POINT.lat, NIIGATA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    if (distance > NIIGATA_HORIZ_RADIUS) {
      return { items: [] };
    }

    const result = calcNiigataHorizontalSurface(g, point, lat, lng);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "niigata",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
