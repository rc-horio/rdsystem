import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import {
  surfacePoints as mzM,
  conicalCutPath as miyazakiConicalCutPath,
  outerCutPath as miyazakiOuterCutPath,
  MIYAZAKI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MIYAZAKI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MIYAZAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as MIYAZAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MIYAZAKI_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MIYAZAKI_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as MIYAZAKI_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as MIYAZAKI_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as MIYAZAKI_PITCH_CONICAL,
} from "../data/miyazaki";
import {
  STR_TO_SURFACE,
  decimalsAddition,
  decimalsMultiplication,
  decimalsSubstract,
  hakodateApproachHeight,
  hakodateTransQuadHeight,
  hakodateTransTriHeight,
  isPointInPolygon,
  pickSendaiSurfaceName,
} from "./shared";
import type { HeightEntry } from "./shared";

function isMiyazakiPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 宮崎: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 進入内では水平を除外、延長進入内では円錐を除外（公式 ClickSurface の continue）。
 * 円錐は GetCirclePaths1 切り欠き内かつ 3500m 超。外側水平は GetCirclePaths2 切り欠き内。
 */
function calcMiyazakiSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);
  const pitchT = MIYAZAKI_PITCH_TRANS;

  const inLanding = inPoly([mzM.cd12, mzM.cd14, mzM.cd20, mzM.cd18]);
  const inApproachW = inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14]);
  const inApproachE = inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26]);
  const inExtE = inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29]);
  const inApproach = inApproachW || inApproachE;

  if (inLanding) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inApproachW) {
    height.push({
      val: hakodateApproachHeight(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inApproachE) {
    height.push({
      val: hakodateApproachHeight(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inExtE) {
    height.push({
      val: hakodateApproachHeight(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([mzM.cd11, mzM.cd12, mzM.cd18, mzM.cd17])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd14, mzM.cd15, mzM.cd21, mzM.cd20])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd07, mzM.cd12, mzM.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd13,
        mzM.cd12,
        mzM.cd05,
        mzM.cd04,
        latLng,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd08, mzM.cd15, mzM.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd13,
        mzM.cd14,
        mzM.cd05,
        mzM.cd06,
        latLng,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd17, mzM.cd18, mzM.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd19,
        mzM.cd18,
        mzM.cd27,
        mzM.cd26,
        latLng,
        MIYAZAKI_HEIGHT_2,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd20, mzM.cd21, mzM.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd19,
        mzM.cd20,
        mzM.cd27,
        mzM.cd28,
        latLng,
        MIYAZAKI_HEIGHT_2,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (!inApproach && distance > 0 && distance <= MIYAZAKI_HORIZ_RADIUS) {
    height.push({
      val: MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (
    !inExtE &&
    inPoly(miyazakiConicalCutPath) &&
    distance > MIYAZAKI_HORIZ_RADIUS
  ) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, MIYAZAKI_HORIZ_RADIUS),
      MIYAZAKI_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(miyazakiOuterCutPath)) {
    height.push({
      val: MIYAZAKI_REF_HEIGHT + MIYAZAKI_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  const st = STR_TO_SURFACE[picked.name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 宮崎空港の高さ制限を計算する。
 * 公式 GetCirclePaths1（円錐）/ GetCirclePaths2（外側、CDB1〜CDB17）の切り欠きを使う。
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

    const result = calcMiyazakiSurfaces(g, point, lat, lng, distance);
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
