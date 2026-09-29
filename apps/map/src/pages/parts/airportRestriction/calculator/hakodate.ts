import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import {
  surfacePoints as hM,
  conicalCutPath as hakodateConicalCutPath,
  outerCutPath as hakodateOuterCutPath,
  HAKODATE_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as HAKODATE_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as HAKODATE_LENGTH,
  WIDTH_OF_LANDING_AREA as HAKODATE_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as HAKODATE_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as HAKODATE_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as HAKODATE_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as HAKODATE_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as HAKODATE_PITCH_CONICAL,
} from "../data/hakodate";
import {
  STR_TO_SURFACE,
  decimalsAddition,
  decimalsMultiplication,
  decimalsSubstract,
  hakodateApproachHeight,
  hakodateTransQuadHeight,
  hakodateTransTriHeight,
  isPointInPolygon,
} from "./shared";
import type { HeightEntry } from "./shared";

function isHakodatePointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 函館: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 円錐は切り欠き内かつ 4000m 超、外側水平は切り欠き内。水平は 4000m 以内の円のみ。
 */
function calcHakodateSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);
  const pitchT = HAKODATE_PITCH_TRANS;

  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14])) {
    height.push({
      val: hakodateApproachHeight(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    height.push({
      val: hakodateApproachHeight(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: hakodateApproachHeight(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([hM.cd11, hM.cd12, hM.cd18, hM.cd17])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd14, hM.cd15, hM.cd21, hM.cd20])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd07, hM.cd12, hM.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd13,
        hM.cd12,
        hM.cd05,
        hM.cd04,
        latLng,
        HAKODATE_HEIGHT_1,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd08, hM.cd15, hM.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd13,
        hM.cd14,
        hM.cd05,
        hM.cd06,
        latLng,
        HAKODATE_HEIGHT_1,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd17, hM.cd18, hM.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd19,
        hM.cd18,
        hM.cd27,
        hM.cd26,
        latLng,
        HAKODATE_HEIGHT_2,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd20, hM.cd21, hM.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd19,
        hM.cd20,
        hM.cd27,
        hM.cd28,
        latLng,
        HAKODATE_HEIGHT_2,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (distance <= HAKODATE_HORIZ_RADIUS) {
    height.push({
      val: HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (inPoly(hakodateConicalCutPath) && distance > HAKODATE_HORIZ_RADIUS) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, HAKODATE_HORIZ_RADIUS),
      HAKODATE_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(hakodateOuterCutPath)) {
    height.push({
      val: HAKODATE_REF_HEIGHT + HAKODATE_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  } else if (
    inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14]) ||
    inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])
  ) {
    reStr = "進入表面";
  }
  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 函館空港の高さ制限を計算する。
 * 公式 GetCirclePaths(CDA〜CDE) の切り欠きを円錐・外側水平に使う。
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

    const result = calcHakodateSurfaces(g, point, lat, lng, distance);
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
